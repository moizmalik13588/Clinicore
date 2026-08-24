import { IMoodRepository, IMoodService } from './mood.interface';
import { MoodMapper } from './mood.mapper';
import { openRouterChat, parseJsonResponse } from '../../common/utils/openrouter.helper';
import { getPaginationParams } from '../../common/utils/helpers';
import {
    CreateMoodEventDto,
    MoodAnalysisResult,
    ListMoodEventsDto,
    MoodTrendsDto,
} from './mood.dto';
import {
    MoodEventResponse,
    MoodTrendsResponse,
    MoodCallTimelineResponse,
    PatientMoodHistoryResponse,
} from './mood.response';
import { env } from '../../config/env';
import { prisma } from '../../db/client';

// ─── Mood detection prompt ────────────────────────────────────────────────────
const MOOD_SYSTEM_PROMPT = `
You are an emotion analysis AI for a medical clinic call center.
Analyze the provided call transcript excerpt and detect the patient's emotional state.

Return ONLY a valid JSON object — no explanation, no markdown:
{
  "mood": "calm | frustrated | angry | anxious | happy",
  "intensity": 0.0 to 1.0,
  "confidence": 0.0 to 1.0,
  "action": "none | empathy_phrase | tone_soften | escalate | slow_down"
}

Guidelines:
- intensity: 0.0 = very mild, 1.0 = extreme
- confidence: how sure you are about the detection
- action "none" for calm/happy
- action "empathy_phrase" for mild frustration
- action "tone_soften" for moderate frustration
- action "escalate" for anger intensity > 0.8
- action "slow_down" for anxiety
- Focus on PATIENT speech only, not the agent
`.trim();

// ─── Intensity thresholds by sensitivity ──────────────────────────────────────
const SENSITIVITY_THRESHOLDS: Record<string, number> = {
    low: 0.8,
    medium: 0.6,
    high: 0.4,
};

export class MoodService implements IMoodService {

    constructor(private readonly repo: IMoodRepository) { }

    // ─── Core: analyze text → mood ────────────────────────────────────────────
    async analyzeMood(
        text: string,
        callId?: string,
        patientId?: string,
        clinicId?: string,
        timestampOffset: number = 0,
    ): Promise<MoodAnalysisResult> {

        if (!text || text.trim().length < 10) {
            return { mood: 'calm', intensity: 0, confidence: 0, action: 'none' };
        }

        try {
            const raw = await openRouterChat(
                [
                    { role: 'system', content: MOOD_SYSTEM_PROMPT },
                    { role: 'user', content: `Transcript excerpt:\n\n${text.slice(0, 500)}` },
                ],
                {
                    model: 'anthropic/claude-haiku-4-5',
                    maxTokens: 150,
                    temperature: 0.1,
                },
            );

            const parsed = parseJsonResponse<MoodAnalysisResult>(raw);

            if (!parsed) {
                console.warn('[Mood] Parse failed — defaulting to calm');
                return { mood: 'calm', intensity: 0, confidence: 0.5, action: 'none' };
            }

            // Validate mood value
            const validMoods = ['calm', 'frustrated', 'angry', 'anxious', 'happy'];
            if (!validMoods.includes(parsed.mood)) {
                parsed.mood = 'calm';
            }

            // Clamp values 0-1
            parsed.intensity = Math.max(0, Math.min(1, parsed.intensity || 0));
            parsed.confidence = Math.max(0, Math.min(1, parsed.confidence || 0.5));

            console.log(`[Mood] Detected: ${parsed.mood} | intensity: ${parsed.intensity} | action: ${parsed.action}`);

            // Save to DB agar callId + clinicId hai
            if (callId && clinicId) {
                await this.saveMoodEvent({
                    clinicId,
                    callId,
                    patientId,
                    detectedMood: parsed.mood,
                    intensity: parsed.intensity,
                    confidence: parsed.confidence,
                    timestampOffset,
                    aiActionTaken: parsed.action !== 'none' ? parsed.action : undefined,
                    transcriptExcerpt: text.slice(0, 300),
                });
            }

            return parsed;

        } catch (err) {
            console.error('[Mood] Analysis error:', err);
            return { mood: 'calm', intensity: 0, confidence: 0, action: 'none' };
        }
    }

    async saveMoodEvent(dto: CreateMoodEventDto): Promise<MoodEventResponse> {
        const event = await this.repo.create(dto);

        setImmediate(async () => {
            try {
                if (dto.patientId) {
                    await this.repo.updatePatientLastMood(dto.patientId, dto.detectedMood);
                    await this.autoTagPatient(dto.patientId, dto.clinicId);
                }
            } catch (err) {
                console.error('[Mood] Post-save failed:', err);
            }
        });

        return MoodMapper.toResponse(event);
    }

    // ─── Get call mood timeline ───────────────────────────────────────────────
    // getMoodForCall mein calls table bhi update karo:

    async getMoodForCall(callId: string, clinicId: string): Promise<MoodCallTimelineResponse> {
        // retellCallId ya DB id dono accept karo
        const call = await prisma.call.findFirst({
            where: {
                clinicId,
                OR: [
                    { retellCallId: callId },
                    { id: callId },
                ],
            },
            select: { id: true },
        });

        const dbCallId = call?.id || callId;

        const events = await this.repo.findByCallId(dbCallId, clinicId);

        const dominantMood = MoodMapper.getDominantMood(events);
        const avgIntensity = MoodMapper.getAvgIntensity(events);
        const escalated = events.some(e => e.escalationTriggered);

        // DB mein calls table update karo
        if (events.length > 0 && call?.id) {
            await this.repo.updateCallMoodSummary(call.id, dominantMood, avgIntensity);

            // Patient last mood update
            const callRecord = await prisma.call.findUnique({
                where: { id: call.id },
                select: { patientId: true },
            });

            if (callRecord?.patientId) {
                await this.repo.updatePatientLastMood(callRecord.patientId, dominantMood);
            }

            console.log(`[Mood] Summary saved | call: ${call.id} | dominant: ${dominantMood}`);
        }

        return {
            callId: dbCallId,
            events: MoodMapper.toResponseList(events),
            summary: {
                dominantMood,
                avgIntensity,
                totalEvents: events.length,
                escalated,
            },
        };
    }

    // ─── Get mood trends ──────────────────────────────────────────────────────
    async getMoodTrends(clinicId: string, dto: MoodTrendsDto): Promise<MoodTrendsResponse> {
        const events = await this.repo.findTrends(clinicId, dto);

        if (events.length === 0) {
            return {
                range: dto.range,
                data: [],
                summary: { dominantMood: 'N/A', calmRate: 0, angryRate: 0, totalEvents: 0 },
            };
        }

        // Group by date
        const dateMap: Record<string, Record<string, number>> = {};

        for (const event of events) {
            const date = (event as any).createdAt.toISOString().slice(0, 10);

            if (!dateMap[date]) {
                dateMap[date] = { calm: 0, frustrated: 0, angry: 0, anxious: 0, happy: 0, total: 0 };
            }

            const mood = (event as any).detectedMood as string;
            if (mood in dateMap[date]) dateMap[date][mood]++;
            dateMap[date].total++;
        }

        const data = Object.entries(dateMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, counts]) => ({
                date,
                calm: counts.total ? Math.round((counts.calm / counts.total) * 100) : 0,
                frustrated: counts.total ? Math.round((counts.frustrated / counts.total) * 100) : 0,
                angry: counts.total ? Math.round((counts.angry / counts.total) * 100) : 0,
                anxious: counts.total ? Math.round((counts.anxious / counts.total) * 100) : 0,
                happy: counts.total ? Math.round((counts.happy / counts.total) * 100) : 0,
                total: counts.total,
            }));

        // Overall summary
        const dominantMood = MoodMapper.getDominantMood(events);
        const totalEvents = events.length;
        const calmCount = events.filter((e: any) => e.detectedMood === 'calm').length;
        const angryCount = events.filter((e: any) => e.detectedMood === 'angry').length;

        return {
            range: dto.range,
            data,
            summary: {
                dominantMood,
                calmRate: Math.round((calmCount / totalEvents) * 100),
                angryRate: Math.round((angryCount / totalEvents) * 100),
                totalEvents,
            },
        };
    }

    // ─── Patient mood history ─────────────────────────────────────────────────
    async getPatientMoodHistory(
        patientId: string,
        clinicId: string,
    ): Promise<PatientMoodHistoryResponse> {
        const events = await this.repo.findByPatientId(patientId, clinicId, 100);

        const dominantMood = MoodMapper.getDominantMood(events);
        const callIds = [...new Set(events.map(e => e.callId))];
        const angryCount = events.filter(e => e.detectedMood === 'angry').length;
        const anxiousCount = events.filter(e => e.detectedMood === 'anxious').length;

        return {
            patientId,
            events: MoodMapper.toResponseList(events),
            summary: {
                dominantMood,
                totalCalls: callIds.length,
                angryCount,
                anxiousCount,
            },
        };
    }

    // ─── List events ──────────────────────────────────────────────────────────
    async listEvents(clinicId: string, dto: ListMoodEventsDto) {
        const { page, limit, offset } = getPaginationParams({
            page: dto.page as any, limit: dto.limit as any,
        });

        const { data, total } = await this.repo.findAll(clinicId, dto, offset, limit);

        return {
            data: MoodMapper.toResponseList(data),
            total, page, limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async runAutoTagBatch(clinicId: string): Promise<{ tagged: number }> {
        const patients = await prisma.patient.findMany({
            where: { clinicId },
            select: { id: true },
        });
        let taggedCount = 0;
        for (const p of patients) {
            await this.autoTagPatient(p.id, clinicId);
            taggedCount++;
        }
        return { tagged: taggedCount };
    }

    // mood.service.ts mein yeh method update karo:

    shouldTriggerAction(mood: string, intensity: number): boolean {
        // Calm aur happy pe koi action nahi
        if (mood === 'calm' || mood === 'happy') return false;

        // Sensitivity thresholds
        const thresholds: Record<string, number> = {
            low: 0.75,
            medium: 0.55,
            high: 0.40,
        };

        const threshold = thresholds[env.MOOD_SENSITIVITY] || 0.55;
        return intensity >= threshold;
    }

    private async autoTagPatient(patientId: string, clinicId: string): Promise<void> {
        try {
            // Last 10 mood events check karo
            const recentMoods = await this.repo.findByPatientId(patientId, clinicId, 10);

            if (recentMoods.length < 3) return;

            const anxiousCount = recentMoods.filter(m => m.detectedMood === 'anxious').length;
            const angryCount = recentMoods.filter(m => m.detectedMood === 'angry').length;
            const frustCount = recentMoods.filter(m => m.detectedMood === 'frustrated').length;

            const patient = await prisma.patient.findUnique({
                where: { id: patientId },
                select: { crmTags: true },
            });

            if (!patient) return;

            const tags = new Set(patient.crmTags || []);

            // 3+ anxious events → 'anxious' tag
            if (anxiousCount >= 3) tags.add('anxious');

            // 2+ angry events → 'high-risk' tag
            if (angryCount >= 2) tags.add('high-risk');

            // 3+ frustrated events → 'needs-followup' tag
            if (frustCount >= 3) tags.add('needs-followup');

            const newTags = Array.from(tags);

            if (newTags.length !== (patient.crmTags || []).length) {
                await prisma.patient.update({
                    where: { id: patientId },
                    data: { crmTags: newTags },
                });
                console.log(`[Mood] Auto-tagged patient: ${newTags.join(', ')}`);
            }
        } catch (err) {
            console.error('[Mood] Auto-tag failed:', err);
        }
    }
}
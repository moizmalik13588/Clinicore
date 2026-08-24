import { PrismaClient } from '@prisma/client';
import {
    CallResponse,
    CallWithTranscriptResponse,
    CallWithMoodTimelineResponse,
    MoodSegment,
} from './calls.response';

type Call = Awaited<ReturnType<PrismaClient['call']['findUniqueOrThrow']>>;
type Patient = Awaited<ReturnType<PrismaClient['patient']['findUniqueOrThrow']>>;
type MoodEvent = Awaited<ReturnType<PrismaClient['moodEvent']['findUniqueOrThrow']>>;

export type CallWithRelations = Call & {
    patient: Pick<Patient, 'id' | 'name' | 'phone'> | null;
};

export type CallWithMoodRelations = CallWithRelations & {
    moodEvents: MoodEvent[];
};

export class CallsMapper {

    // ─── Basic response ───────────────────────────────────────────────────────
    static toResponse(c: CallWithRelations): CallResponse {
        return {
            id: c.id,
            patientId: c.patientId,
            retellCallId: c.retellCallId,
            fromNumber: c.fromNumber,
            toNumber: c.toNumber,
            direction: c.direction,
            status: c.status,
            duration: c.duration,
            dominantMood: c.dominantMood,
            avgIntensity: c.avgIntensity,
            startedAt: c.startedAt?.toISOString() ?? null,
            endedAt: c.endedAt?.toISOString() ?? null,
            createdAt: c.createdAt.toISOString(),
            patient: c.patient ? {
                id: c.patient.id,
                name: c.patient.name,
                phone: c.patient.phone,
            } : null,
        };
    }

    // ─── With transcript ──────────────────────────────────────────────────────
    static toDetailResponse(c: CallWithRelations): CallWithTranscriptResponse {
        return {
            ...CallsMapper.toResponse(c),
            transcript: (c as any).transcript ?? null,
        };
    }

    // ─── With mood timeline ───────────────────────────────────────────────────
    static toMoodTimelineResponse(c: CallWithMoodRelations): CallWithMoodTimelineResponse {
        const events = c.moodEvents || [];
        const base = CallsMapper.toDetailResponse(c);

        // Build timeline segments — sorted by timestamp_offset
        const moodTimeline: MoodSegment[] = events
            .sort((a, b) => a.timestampOffset - b.timestampOffset)
            .map(e => ({
                timestampOffset: e.timestampOffset,
                mood: e.detectedMood,
                intensity: e.intensity,
                confidence: e.confidence,
                aiActionTaken: e.aiActionTaken,
                transcriptExcerpt: e.transcriptExcerpt,
                escalated: e.escalationTriggered,
            }));

        // Compute summary
        const dominantMood = CallsMapper.computeDominantMood(events);
        const avgIntensity = events.length > 0
            ? Math.round(events.reduce((s, e) => s + e.intensity, 0) / events.length * 100) / 100
            : 0;

        const total = events.length;
        const calmCount = events.filter(e => e.detectedMood === 'calm').length;
        const angryCount = events.filter(e => e.detectedMood === 'angry').length;
        const anxiousCount = events.filter(e => e.detectedMood === 'anxious').length;
        const escalated = events.some(e => e.escalationTriggered);

        return {
            ...base,
            moodTimeline,
            moodSummary: {
                dominantMood,
                avgIntensity,
                totalEvents: total,
                escalated,
                calmPercent: total ? Math.round((calmCount / total) * 100) : 0,
                angryPercent: total ? Math.round((angryCount / total) * 100) : 0,
                anxiousPercent: total ? Math.round((anxiousCount / total) * 100) : 0,
            },
        };
    }

    static toResponseList(calls: CallWithRelations[]): CallResponse[] {
        return calls.map(CallsMapper.toResponse);
    }

    // ─── Dominant mood helper ─────────────────────────────────────────────────
    static computeDominantMood(events: MoodEvent[]): string {
        if (events.length === 0) return 'N/A';

        const counts: Record<string, number> = {};
        for (const e of events) {
            counts[e.detectedMood] = (counts[e.detectedMood] || 0) + 1;
        }

        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)[0][0];
    }
}
import { PrismaClient } from '@prisma/client';
import { prisma } from '../../db/client';
import { IMoodRepository } from './mood.interface';
import { CreateMoodEventDto, ListMoodEventsDto, MoodTrendsDto } from './mood.dto';

type MoodEvent = Awaited<ReturnType<PrismaClient['moodEvent']['findUniqueOrThrow']>>;

export class MoodRepository implements IMoodRepository {

    // ─── Create mood event ────────────────────────────────────────────────────
    async create(dto: CreateMoodEventDto): Promise<MoodEvent> {
        return prisma.moodEvent.create({
            data: {
                clinicId: dto.clinicId,
                callId: dto.callId,
                patientId: dto.patientId,
                detectedMood: dto.detectedMood,
                intensity: dto.intensity,
                confidence: dto.confidence,
                timestampOffset: dto.timestampOffset,
                aiActionTaken: dto.aiActionTaken,
                transcriptExcerpt: dto.transcriptExcerpt?.slice(0, 300),
                escalationTriggered: dto.escalationTriggered || false,
            },
        });
    }

    // ─── Find by call ─────────────────────────────────────────────────────────
    async findByCallId(callId: string, clinicId: string): Promise<MoodEvent[]> {
        return prisma.moodEvent.findMany({
            where: { callId, clinicId },
            orderBy: { timestampOffset: 'asc' },
        });
    }

    // ─── Find by patient ──────────────────────────────────────────────────────
    async findByPatientId(
        patientId: string,
        clinicId: string,
        limit: number = 50,
    ): Promise<MoodEvent[]> {
        return prisma.moodEvent.findMany({
            where: { patientId, clinicId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    // ─── List all ─────────────────────────────────────────────────────────────
    async findAll(
        clinicId: string,
        dto: ListMoodEventsDto,
        offset: number,
        limit: number,
    ): Promise<{ data: MoodEvent[]; total: number }> {
        const where: any = { clinicId };

        if (dto.patientId) where.patientId = dto.patientId;
        if (dto.callId) where.callId = dto.callId;
        if (dto.mood) where.detectedMood = dto.mood;

        const [data, total] = await Promise.all([
            prisma.moodEvent.findMany({
                where,
                skip: offset,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.moodEvent.count({ where }),
        ]);

        return { data, total };
    }

    // ─── Trends data ──────────────────────────────────────────────────────────
    async findTrends(clinicId: string, dto: MoodTrendsDto): Promise<MoodEvent[]> {
        const days = dto.range === '7d' ? 7 : dto.range === '30d' ? 30 : 90;
        const from = new Date(Date.now() - days * 86400000);

        return prisma.moodEvent.findMany({
            where: {
                clinicId,
                createdAt: { gte: from },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    // ─── Last mood for call ───────────────────────────────────────────────────
    async getLastMoodForCall(callId: string): Promise<MoodEvent | null> {
        return prisma.moodEvent.findFirst({
            where: { callId },
            orderBy: { timestampOffset: 'desc' },
        });
    }

    // ─── Update call mood summary ─────────────────────────────────────────────
    async updateCallMoodSummary(
        callId: string,
        dominantMood: string,
        avgIntensity: number,
    ): Promise<void> {
        await prisma.call.updateMany({
            where: { retellCallId: callId },
            data: {
                dominantMood,
                avgIntensity,
            },
        });
    }

    // ─── Update patient last mood ─────────────────────────────────────────────
    async updatePatientLastMood(patientId: string, mood: string): Promise<void> {
        await prisma.patient.update({
            where: { id: patientId },
            data: { lastMood: mood },
        });
    }
}
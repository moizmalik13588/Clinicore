import { prisma } from '../../db/client';
import { ICallsRepository } from './calls.interface';
import { CallWithRelations, CallWithMoodRelations } from './calls.mapper';
import { CreateCallRepoDto, UpdateCallRepoDto, ListCallsDto } from './calls.dto';
import { CallStatus, CallDirection } from '../../common/types';

const callInclude = {
    patient: { select: { id: true, name: true, phone: true } },
} as const;

const callWithMoodInclude = {
    patient: { select: { id: true, name: true, phone: true } },
    moodEvents: {
        orderBy: { timestampOffset: 'asc' as const },
    },
} as const;

export class CallsRepository implements ICallsRepository {

    async findAll(
        clinicId: string,
        dto: ListCallsDto,
        offset: number,
        limit: number,
    ): Promise<{ data: CallWithRelations[]; total: number }> {
        const where: any = { clinicId };

        if (dto.patientId) where.patientId = dto.patientId;
        if (dto.status) where.status = dto.status;
        if (dto.direction) where.direction = dto.direction;

        const [data, total] = await Promise.all([
            prisma.call.findMany({
                where,
                skip: offset,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: callInclude,
            }),
            prisma.call.count({ where }),
        ]);

        return { data, total };
    }

    async findById(id: string, clinicId: string): Promise<CallWithRelations | null> {
        return prisma.call.findFirst({
            where: { id, clinicId },
            include: callInclude,
        });
    }

    // ─── Find by ID with mood timeline ────────────────────────────────────────
    async findByIdWithMood(id: string, clinicId: string): Promise<CallWithMoodRelations | null> {
        return prisma.call.findFirst({
            where: { id, clinicId },
            include: callWithMoodInclude,
        }) as Promise<CallWithMoodRelations | null>;
    }

    // ─── Find by retellCallId with mood ───────────────────────────────────────
    async findByRetellIdWithMood(
        retellCallId: string,
    ): Promise<CallWithMoodRelations | null> {
        return prisma.call.findUnique({
            where: { retellCallId },
            include: callWithMoodInclude,
        }) as Promise<CallWithMoodRelations | null>;
    }

    async findByRetellCallId(retellCallId: string): Promise<CallWithRelations | null> {
        return prisma.call.findUnique({
            where: { retellCallId },
            include: callInclude,
        });
    }

    async findTodayCount(clinicId: string): Promise<number> {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);
        return prisma.call.count({
            where: { clinicId, createdAt: { gte: start, lte: end } },
        });
    }

    async create(dto: CreateCallRepoDto): Promise<CallWithRelations> {
        return prisma.call.create({
            data: {
                clinicId: dto.clinicId,
                patientId: dto.patientId,
                retellCallId: dto.retellCallId,
                fromNumber: dto.fromNumber,
                toNumber: dto.toNumber,
                direction: dto.direction,
                status: CallStatus.IN_PROGRESS,
                startedAt: dto.startedAt,
            },
            include: callInclude,
        });
    }

    async update(
        id: string,
        clinicId: string,
        dto: UpdateCallRepoDto,
    ): Promise<CallWithRelations> {
        return prisma.call.update({
            where: { id },
            data: {
                ...(dto.patientId !== undefined && { patientId: dto.patientId }),
                ...(dto.status !== undefined && { status: dto.status }),
                ...(dto.duration !== undefined && { duration: dto.duration }),
                ...(dto.transcript !== undefined && { transcript: dto.transcript }),
                ...(dto.dominantMood !== undefined && { dominantMood: dto.dominantMood }),
                ...(dto.avgIntensity !== undefined && { avgIntensity: dto.avgIntensity }),
                ...(dto.endedAt !== undefined && { endedAt: dto.endedAt }),
            },
            include: callInclude,
        });
    }

    // ─── Update mood summary ──────────────────────────────────────────────────
    async updateMoodSummary(
        id: string,
        dominantMood: string,
        avgIntensity: number,
    ): Promise<void> {
        await prisma.call.update({
            where: { id },
            data: { dominantMood, avgIntensity },
        });
    }
}
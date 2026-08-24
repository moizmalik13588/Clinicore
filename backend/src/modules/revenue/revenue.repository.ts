import { prisma } from '../../db/client';
import { IRevenueRepository } from './revenue.interface';
import { RevenueWithRelations } from './revenue.mapper';
import { CreateRevenueRepoDto, ListRevenueDto, RevenueStatsDto } from './revenue.dto';
import { RevenueStatsResponse } from './revenue.response';

const revenueInclude = {
    patient: { select: { id: true, name: true } },
    appointment: { select: { id: true, status: true, type: true } },
} as const;

export class RevenueRepository implements IRevenueRepository {

    async create(dto: CreateRevenueRepoDto): Promise<RevenueWithRelations> {
        return prisma.revenueEvent.create({
            data: {
                clinicId: dto.clinicId,
                patientId: dto.patientId,
                appointmentId: dto.appointmentId,
                amount: dto.amount,
                type: dto.type,
                description: dto.description,
            },
            include: revenueInclude,
        });
    }

    async findAll(
        clinicId: string,
        dto: ListRevenueDto,
        offset: number,
        limit: number,
    ): Promise<{ data: RevenueWithRelations[]; total: number; totalAmount: number }> {
        const where: any = { clinicId };

        if (dto.type) where.type = dto.type;

        if (dto.startDate || dto.endDate) {
            where.createdAt = {};
            if (dto.startDate) where.createdAt.gte = new Date(dto.startDate);
            if (dto.endDate) where.createdAt.lte = new Date(dto.endDate);
        }

        const [data, total, aggregate] = await Promise.all([
            prisma.revenueEvent.findMany({
                where,
                skip: offset,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: revenueInclude,
            }),
            prisma.revenueEvent.count({ where }),
            prisma.revenueEvent.aggregate({
                where,
                _sum: { amount: true },
            }),
        ]);

        return {
            data,
            total,
            totalAmount: Number(aggregate._sum.amount || 0),
        };
    }

    async findById(id: string, clinicId: string): Promise<RevenueWithRelations | null> {
        return prisma.revenueEvent.findFirst({
            where: { id, clinicId },
            include: revenueInclude,
        });
    }

    async getStats(clinicId: string, dto: RevenueStatsDto): Promise<RevenueStatsResponse> {

        // ─── Date range ────────────────────────────────────────────────────────
        const now = new Date();
        let startDate: Date | undefined;

        switch (dto.range) {
            case '7d': startDate = new Date(now.getTime() - 7 * 86400000); break;
            case '30d': startDate = new Date(now.getTime() - 30 * 86400000); break;
            case '90d': startDate = new Date(now.getTime() - 90 * 86400000); break;
            case '1y': startDate = new Date(now.getTime() - 365 * 86400000); break;
            case 'all': startDate = undefined; break;
        }

        const baseWhere: any = { clinicId };
        if (startDate) baseWhere.createdAt = { gte: startDate };

        // ─── This month ────────────────────────────────────────────────────────
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const weekStart = new Date(now.getTime() - 7 * 86400000);

        const [
            totalAllTime,
            totalThisMonth,
            totalThisWeek,
            allEvents,
            byType,
            topPatients,
        ] = await Promise.all([

            // Total all time
            prisma.revenueEvent.aggregate({
                where: { clinicId },
                _sum: { amount: true },
                _count: { id: true },
            }),

            // This month
            prisma.revenueEvent.aggregate({
                where: { clinicId, createdAt: { gte: monthStart } },
                _sum: { amount: true },
            }),

            // This week
            prisma.revenueEvent.aggregate({
                where: { clinicId, createdAt: { gte: weekStart } },
                _sum: { amount: true },
            }),

            // All events in range for monthly grouping
            prisma.revenueEvent.findMany({
                where: baseWhere,
                select: { amount: true, type: true, createdAt: true, patientId: true },
                orderBy: { createdAt: 'asc' },
            }),

            // By type
            prisma.revenueEvent.groupBy({
                by: ['type'],
                where: baseWhere,
                _sum: { amount: true },
                _count: { id: true },
            }),

            // Top patients by revenue
            prisma.revenueEvent.groupBy({
                by: ['patientId'],
                where: { ...baseWhere, patientId: { not: null } },
                _sum: { amount: true },
                _count: { id: true },
                orderBy: { _sum: { amount: 'desc' } },
                take: 10,
            }),
        ]);

        // ─── Monthly grouping ──────────────────────────────────────────────────
        const monthMap: Record<string, { total: number; count: number }> = {};

        for (const event of allEvents) {
            const key = event.createdAt.toISOString().slice(0, 7);
            if (!monthMap[key]) monthMap[key] = { total: 0, count: 0 };
            monthMap[key].total += Number(event.amount);
            monthMap[key].count++;
        }

        const byMonth = Object.entries(monthMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, data]) => {
                const [year, m] = month.split('-');
                const label = new Date(parseInt(year), parseInt(m) - 1)
                    .toLocaleString('en', { month: 'short', year: 'numeric' });
                return { month, label, total: data.total, count: data.count };
            });

        // ─── By type ───────────────────────────────────────────────────────────
        const byTypeFormatted = byType.map(t => ({
            type: t.type,
            total: Number(t._sum.amount || 0),
            count: t._count.id,
        }));

        // ─── Top patients ──────────────────────────────────────────────────────
        const patientIds = topPatients
            .map(p => p.patientId)
            .filter(Boolean) as string[];

        const patients = await prisma.patient.findMany({
            where: { id: { in: patientIds } },
            select: { id: true, name: true },
        });

        const patientMap = Object.fromEntries(patients.map(p => [p.id, p.name]));

        const topPatientsFormatted = topPatients.map(p => ({
            patientId: p.patientId!,
            patientName: patientMap[p.patientId!] || 'Unknown',
            total: Number(p._sum.amount || 0),
            visits: p._count.id,
        }));

        // ─── Avg per appointment ───────────────────────────────────────────────
        const totalCount = Number(totalAllTime._count.id || 0);
        const totalAmt = Number(totalAllTime._sum.amount || 0);
        const avg = totalCount > 0 ? totalAmt / totalCount : 0;

        return {
            totalAllTime: totalAmt,
            totalThisMonth: Number(totalThisMonth._sum.amount || 0),
            totalThisWeek: Number(totalThisWeek._sum.amount || 0),
            avgPerAppointment: Math.round(avg),
            byMonth,
            byType: byTypeFormatted,
            topPatients: topPatientsFormatted,
        };
    }

    async delete(id: string, clinicId: string): Promise<void> {
        await prisma.revenueEvent.delete({ where: { id } });
    }
}
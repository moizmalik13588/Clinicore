import { prisma } from '../../db/client';
import { IDashboardRepository } from './dashboard.interface';
import {
    RevenueStatsResponse,
    TimelineResponse,
    AppointmentStatusBreakdown,
    MoodDistribution,
    DashboardStatsResponse,
    DashboardOverviewResponse,
} from './dashboard.response';

export class DashboardRepository implements IDashboardRepository {

    // ─── Single optimized overview query ─────────────────────────────────────
    // 14 queries parallel — pehle 16 sequential thi, ab sab ek saath chalti hain
    async getOverviewData(clinicId: string): Promise<DashboardOverviewResponse> {
        const now = new Date();
        const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const last6mo = new Date(now.getTime() - 180 * 86400000);

        const [
            totalPatients,
            newThisMonth,
            returningPatients,
            callsToday,
            apptsToday,
            activeDoctors,
            moodToday,
            revAllTime,
            revThisMonth,
            revMonthly,
            apptBreakdown,
            moodDistRaw,
            timelineCalls,
            timelineAppts,
        ] = await Promise.all([

            // 1. Total patients
            prisma.patient.count({
                where: { clinicId },
            }),

            // 2. New this month
            prisma.patient.count({
                where: {
                    clinicId,
                    createdAt: { gte: monthStart },
                },
            }),

            // 3. Returning patients (visited more than once)
            prisma.patient.count({
                where: {
                    clinicId,
                    totalVisits: { gt: 1 },
                },
            }),

            // 4. Calls today
            prisma.call.count({
                where: {
                    clinicId,
                    createdAt: { gte: todayStart, lte: todayEnd },
                },
            }),

            // 5. Appointments today (not cancelled)
            prisma.appointment.count({
                where: {
                    clinicId,
                    appointmentDate: { gte: todayStart, lte: todayEnd },
                    status: { notIn: ['cancelled'] },
                },
            }),

            // 6. Active doctors
            prisma.doctor.count({
                where: { clinicId, isActive: true },
            }),

            // 7. Mood events today — for dominant mood
            prisma.moodEvent.findMany({
                where: {
                    clinicId,
                    createdAt: { gte: todayStart, lte: todayEnd },
                },
                select: { detectedMood: true },
            }),

            // 8. Revenue all time
            prisma.revenueEvent.aggregate({
                where: { clinicId },
                _sum: { amount: true },
            }),

            // 9. Revenue this month
            prisma.revenueEvent.aggregate({
                where: {
                    clinicId,
                    createdAt: { gte: monthStart },
                },
                _sum: { amount: true },
            }),

            // 10. Revenue last 6 months — for chart
            prisma.revenueEvent.findMany({
                where: {
                    clinicId,
                    createdAt: { gte: last6mo },
                },
                select: { amount: true, createdAt: true },
            }),

            // 11. Appointment status breakdown this month
            prisma.appointment.groupBy({
                by: ['status'],
                where: {
                    clinicId,
                    appointmentDate: { gte: monthStart },
                },
                _count: { status: true },
            }),

            // 12. Mood distribution today
            prisma.moodEvent.groupBy({
                by: ['detectedMood'],
                where: {
                    clinicId,
                    createdAt: { gte: todayStart, lte: todayEnd },
                },
                _count: { detectedMood: true },
            }),

            // 13. Timeline — calls today per hour
            prisma.call.findMany({
                where: {
                    clinicId,
                    createdAt: { gte: todayStart, lte: todayEnd },
                },
                select: { createdAt: true },
            }),

            // 14. Timeline — appointments today per hour
            prisma.appointment.findMany({
                where: {
                    clinicId,
                    appointmentDate: { gte: todayStart, lte: todayEnd },
                    status: { notIn: ['cancelled'] },
                },
                select: { appointmentDate: true },
            }),
        ]);

        // ─── Process: returning rate ────────────────────────────────────────────
        const returningRate = totalPatients > 0
            ? Math.round((returningPatients / totalPatients) * 100)
            : 0;

        // ─── Process: dominant mood today ────────────────────────────────────────
        let avgMoodToday = 'N/A';
        if (moodToday.length > 0) {
            const counts: Record<string, number> = {};
            for (const m of moodToday) {
                counts[m.detectedMood] = (counts[m.detectedMood] || 0) + 1;
            }
            avgMoodToday = Object.entries(counts)
                .sort(([, a], [, b]) => b - a)[0][0];
        }

        // ─── Process: revenue by month ────────────────────────────────────────────
        const monthMap: Record<string, { total: number; count: number }> = {};
        for (const r of revMonthly) {
            const key = r.createdAt.toISOString().slice(0, 7); // "2025-05"
            if (!monthMap[key]) monthMap[key] = { total: 0, count: 0 };
            monthMap[key].total += Number(r.amount);
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

        // ─── Process: appointment breakdown ──────────────────────────────────────
        const breakdown: AppointmentStatusBreakdown = {
            scheduled: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0,
        };
        for (const r of apptBreakdown) {
            const key = r.status as keyof AppointmentStatusBreakdown;
            if (key in breakdown) breakdown[key] = r._count.status;
        }

        // ─── Process: mood distribution ───────────────────────────────────────────
        const moodDistribution: MoodDistribution = {
            calm: 0, frustrated: 0, angry: 0, anxious: 0, happy: 0, total: 0,
        };
        for (const r of moodDistRaw) {
            const key = r.detectedMood as keyof Omit<MoodDistribution, 'total'>;
            if (key in moodDistribution) {
                (moodDistribution as any)[key] = r._count.detectedMood;
                moodDistribution.total += r._count.detectedMood;
            }
        }

        // ─── Process: hourly timeline 9am–6pm ────────────────────────────────────
        const slots = [];
        for (let hour = 9; hour <= 18; hour++) {
            const hourStr = `${hour.toString().padStart(2, '0')}:00`;
            slots.push({
                hour: hourStr,
                calls: timelineCalls.filter(c => c.createdAt.getHours() === hour).length,
                appointments: timelineAppts.filter(a => a.appointmentDate.getHours() === hour).length,
            });
        }

        // ─── Assemble final response ──────────────────────────────────────────────
        return {
            stats: {
                totalPatients,
                newPatientsThisMonth: newThisMonth,
                callsToday,
                appointmentsToday: apptsToday,
                returningRate,
                avgMoodToday,
                activeDoctors,
            },
            revenue: {
                totalAllTime: Number(revAllTime._sum.amount || 0),
                totalThisMonth: Number(revThisMonth._sum.amount || 0),
                byMonth,
            },
            timeline: {
                date: now.toISOString().slice(0, 10),
                slots,
            },
            appointmentBreakdown: breakdown,
            moodDistribution,
        };
    }

    // ─── Individual methods — alag endpoints ke liye ──────────────────────────

    async getTotalPatients(clinicId: string): Promise<number> {
        return prisma.patient.count({ where: { clinicId } });
    }

    async getNewPatientsThisMonth(clinicId: string): Promise<number> {
        const start = new Date();
        start.setDate(1); start.setHours(0, 0, 0, 0);
        return prisma.patient.count({
            where: { clinicId, createdAt: { gte: start } },
        });
    }

    async getCallsTodayCount(clinicId: string): Promise<number> {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);
        return prisma.call.count({
            where: { clinicId, createdAt: { gte: start, lte: end } },
        });
    }

    async getAppointmentsTodayCount(clinicId: string): Promise<number> {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);
        return prisma.appointment.count({
            where: {
                clinicId,
                appointmentDate: { gte: start, lte: end },
                status: { notIn: ['cancelled'] },
            },
        });
    }

    async getActiveDoctorsCount(clinicId: string): Promise<number> {
        return prisma.doctor.count({ where: { clinicId, isActive: true } });
    }

    async getReturningPatientsRate(clinicId: string): Promise<number> {
        const [total, returning] = await Promise.all([
            prisma.patient.count({ where: { clinicId } }),
            prisma.patient.count({ where: { clinicId, totalVisits: { gt: 1 } } }),
        ]);
        return total > 0 ? Math.round((returning / total) * 100) : 0;
    }

    async getAvgMoodToday(clinicId: string): Promise<string> {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);

        const moods = await prisma.moodEvent.findMany({
            where: { clinicId, createdAt: { gte: start, lte: end } },
            select: { detectedMood: true },
        });

        if (!moods.length) return 'N/A';

        const counts: Record<string, number> = {};
        for (const m of moods) {
            counts[m.detectedMood] = (counts[m.detectedMood] || 0) + 1;
        }
        return Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0];
    }

    async getRevenueStats(clinicId: string): Promise<RevenueStatsResponse> {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const last6mo = new Date(now.getTime() - 180 * 86400000);

        const [totalAllTime, totalThisMonth, monthly] = await Promise.all([
            prisma.revenueEvent.aggregate({
                where: { clinicId },
                _sum: { amount: true },
            }),
            prisma.revenueEvent.aggregate({
                where: { clinicId, createdAt: { gte: monthStart } },
                _sum: { amount: true },
            }),
            prisma.revenueEvent.findMany({
                where: { clinicId, createdAt: { gte: last6mo } },
                select: { amount: true, createdAt: true },
            }),
        ]);

        const monthMap: Record<string, number> = {};
        for (const r of monthly) {
            const key = r.createdAt.toISOString().slice(0, 7);
            monthMap[key] = (monthMap[key] || 0) + Number(r.amount);
        }

        const byMonth = Object.entries(monthMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, total]) => {
                const [year, m] = month.split('-');
                const label = new Date(parseInt(year), parseInt(m) - 1)
                    .toLocaleString('en', { month: 'short', year: 'numeric' });
                return { month, label, total, count: 0 };
            });

        return {
            totalAllTime: Number(totalAllTime._sum.amount || 0),
            totalThisMonth: Number(totalThisMonth._sum.amount || 0),
            byMonth,
        };
    }

    async getHourlyTimeline(clinicId: string): Promise<TimelineResponse> {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);

        const [calls, appointments] = await Promise.all([
            prisma.call.findMany({
                where: { clinicId, createdAt: { gte: start, lte: end } },
                select: { createdAt: true },
            }),
            prisma.appointment.findMany({
                where: {
                    clinicId,
                    appointmentDate: { gte: start, lte: end },
                    status: { notIn: ['cancelled'] },
                },
                select: { appointmentDate: true },
            }),
        ]);

        const slots = [];
        for (let hour = 9; hour <= 18; hour++) {
            slots.push({
                hour: `${hour.toString().padStart(2, '0')}:00`,
                calls: calls.filter(c => c.createdAt.getHours() === hour).length,
                appointments: appointments.filter(a => a.appointmentDate.getHours() === hour).length,
            });
        }

        return { date: new Date().toISOString().slice(0, 10), slots };
    }

    async getAppointmentStatusBreakdown(clinicId: string): Promise<AppointmentStatusBreakdown> {
        const start = new Date();
        start.setDate(1); start.setHours(0, 0, 0, 0);

        const results = await prisma.appointment.groupBy({
            by: ['status'],
            where: { clinicId, appointmentDate: { gte: start } },
            _count: { status: true },
        });

        const breakdown: AppointmentStatusBreakdown = {
            scheduled: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0,
        };
        for (const r of results) {
            const key = r.status as keyof AppointmentStatusBreakdown;
            if (key in breakdown) breakdown[key] = r._count.status;
        }
        return breakdown;
    }

    async getMoodDistributionToday(clinicId: string): Promise<MoodDistribution> {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);

        const results = await prisma.moodEvent.groupBy({
            by: ['detectedMood'],
            where: { clinicId, createdAt: { gte: start, lte: end } },
            _count: { detectedMood: true },
        });

        const dist: MoodDistribution = {
            calm: 0, frustrated: 0, angry: 0, anxious: 0, happy: 0, total: 0,
        };
        for (const r of results) {
            const key = r.detectedMood as keyof Omit<MoodDistribution, 'total'>;
            if (key in dist) {
                (dist as any)[key] = r._count.detectedMood;
                dist.total += r._count.detectedMood;
            }
        }
        return dist;
    }
}
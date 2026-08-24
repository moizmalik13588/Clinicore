import { IDashboardRepository, IDashboardService } from './dashboard.interface';
import {
    DashboardStatsResponse,
    RevenueStatsResponse,
    TimelineResponse,
    DashboardOverviewResponse,
} from './dashboard.response';

export class DashboardService implements IDashboardService {

    constructor(private readonly repo: IDashboardRepository) { }

    // ─── Stats ────────────────────────────────────────────────────────────────
    async getStats(clinicId: string): Promise<DashboardStatsResponse> {
        // Sab queries parallel mein chalao
        const [
            totalPatients,
            newPatientsThisMonth,
            callsToday,
            appointmentsToday,
            activeDoctors,
            returningRate,
            avgMoodToday,
        ] = await Promise.all([
            this.repo.getTotalPatients(clinicId),
            this.repo.getNewPatientsThisMonth(clinicId),
            this.repo.getCallsTodayCount(clinicId),
            this.repo.getAppointmentsTodayCount(clinicId),
            this.repo.getActiveDoctorsCount(clinicId),
            this.repo.getReturningPatientsRate(clinicId),
            this.repo.getAvgMoodToday(clinicId),
        ]);

        return {
            totalPatients,
            newPatientsThisMonth,
            callsToday,
            appointmentsToday,
            returningRate,
            avgMoodToday,
            activeDoctors,
        };
    }

    // ─── Revenue ──────────────────────────────────────────────────────────────
    async getRevenue(clinicId: string): Promise<RevenueStatsResponse> {
        return this.repo.getRevenueStats(clinicId);
    }

    // ─── Timeline ─────────────────────────────────────────────────────────────
    async getTimeline(clinicId: string): Promise<TimelineResponse> {
        return this.repo.getHourlyTimeline(clinicId);
    }

    // ─── Overview — sab ek jagah ──────────────────────────────────────────────
    async getOverview(clinicId: string): Promise<DashboardOverviewResponse> {
        const [stats, revenue, timeline, appointmentBreakdown, moodDistribution] =
            await Promise.all([
                this.getStats(clinicId),
                this.getRevenue(clinicId),
                this.getTimeline(clinicId),
                this.repo.getAppointmentStatusBreakdown(clinicId),
                this.repo.getMoodDistributionToday(clinicId),
            ]);

        return this.repo.getOverviewData(clinicId);
    }
}
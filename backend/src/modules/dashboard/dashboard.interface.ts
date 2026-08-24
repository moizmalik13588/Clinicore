import {
    DashboardStatsResponse,
    RevenueStatsResponse,
    TimelineResponse,
    DashboardOverviewResponse,
    AppointmentStatusBreakdown,
    MoodDistribution,
} from './dashboard.response';

// ─── Repository Interface ─────────────────────────────────────────────────────
export interface IDashboardRepository {
    getOverviewData(clinicId: string): Promise<DashboardOverviewResponse>;  // ← new
    getTotalPatients(clinicId: string): Promise<number>;
    getNewPatientsThisMonth(clinicId: string): Promise<number>;
    getCallsTodayCount(clinicId: string): Promise<number>;
    getAppointmentsTodayCount(clinicId: string): Promise<number>;
    getActiveDoctorsCount(clinicId: string): Promise<number>;
    getReturningPatientsRate(clinicId: string): Promise<number>;
    getAvgMoodToday(clinicId: string): Promise<string>;
    getRevenueStats(clinicId: string): Promise<RevenueStatsResponse>;
    getHourlyTimeline(clinicId: string): Promise<TimelineResponse>;
    getAppointmentStatusBreakdown(clinicId: string): Promise<AppointmentStatusBreakdown>;
    getMoodDistributionToday(clinicId: string): Promise<MoodDistribution>;
}

// ─── Service Interface ────────────────────────────────────────────────────────
export interface IDashboardService {
    getStats(clinicId: string): Promise<DashboardStatsResponse>;
    getRevenue(clinicId: string): Promise<RevenueStatsResponse>;
    getTimeline(clinicId: string): Promise<TimelineResponse>;
    getOverview(clinicId: string): Promise<DashboardOverviewResponse>;
}
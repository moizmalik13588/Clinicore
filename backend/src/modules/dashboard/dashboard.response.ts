// ─── Dashboard Response Types ─────────────────────────────────────────────────

export interface DashboardStatsResponse {
    totalPatients: number;
    callsToday: number;
    appointmentsToday: number;
    returningRate: number;   // percentage 0-100
    avgMoodToday: string;   // calm | frustrated | angry | anxious | happy | N/A
    activeDoctors: number;
    newPatientsThisMonth: number;
}

export interface RevenueByMonth {
    month: string;   // "2025-01"
    label: string;   // "Jan 2025"
    total: number;
    count: number;
}

export interface RevenueStatsResponse {
    totalAllTime: number;
    totalThisMonth: number;
    byMonth: RevenueByMonth[];
}

export interface TimelineSlot {
    hour: string;    // "09:00"
    calls: number;
    appointments: number;
}

export interface TimelineResponse {
    date: string;
    slots: TimelineSlot[];
}

export interface AppointmentStatusBreakdown {
    scheduled: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    no_show: number;
}

export interface MoodDistribution {
    calm: number;
    frustrated: number;
    angry: number;
    anxious: number;
    happy: number;
    total: number;
}

export interface DashboardOverviewResponse {
    stats: DashboardStatsResponse;
    revenue: RevenueStatsResponse;
    timeline: TimelineResponse;
    appointmentBreakdown: AppointmentStatusBreakdown;
    moodDistribution: MoodDistribution;
}
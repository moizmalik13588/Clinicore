export interface RevenueEventResponse {
    id: string;
    amount: number;
    type: string;
    description: string | null;
    createdAt: string;
    patient: {
        id: string;
        name: string;
    } | null;
    appointment: {
        id: string;
        status: string;
        type: string;
    } | null;
}

export interface RevenueByMonth {
    month: string;   // "2025-01"
    label: string;   // "Jan 2025"
    total: number;
    count: number;
}

export interface RevenueByType {
    type: string;
    total: number;
    count: number;
}

export interface RevenueStatsResponse {
    totalAllTime: number;
    totalThisMonth: number;
    totalThisWeek: number;
    avgPerAppointment: number;
    byMonth: RevenueByMonth[];
    byType: RevenueByType[];
    topPatients: Array<{
        patientId: string;
        patientName: string;
        total: number;
        visits: number;
    }>;
}

export interface RevenueListResponse {
    data: RevenueEventResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    totalAmount: number;
}
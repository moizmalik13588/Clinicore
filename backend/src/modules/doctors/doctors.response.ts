export interface DoctorResponse {
    id: string;
    name: string;
    specialty: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface DoctorListResponse {
    data: DoctorResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
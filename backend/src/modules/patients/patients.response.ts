export interface PatientDoctorInfo {
    id: string;
    name: string;
    specialty: string | null;
}

export interface PatientResponse {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    totalVisits: number;
    lastVisitDate: string | null;
    lastComplaint: string | null;
    lastMood: string | null;
    crmTags: string[];
    preferredTimeSlot: string | null;
    notes: string | null;
    preferredDoctor: PatientDoctorInfo | null;
    createdAt: string;
    updatedAt: string;
}

export interface PatientListResponse {
    data: PatientResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
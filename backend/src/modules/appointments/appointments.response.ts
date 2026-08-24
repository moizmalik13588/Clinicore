export interface AppointmentPatientInfo {
    id: string;
    name: string;
    phone: string;
}

export interface AppointmentDoctorInfo {
    id: string;
    name: string;
    specialty: string | null;
}

export interface AppointmentResponse {
    id: string;
    patientId: string;
    doctorId: string | null;
    appointmentDate: string;
    duration: number;
    status: string;
    type: string;
    notes: string | null;
    reminderSent: boolean;
    createdAt: string;
    updatedAt: string;
    patient: AppointmentPatientInfo;
    doctor: AppointmentDoctorInfo | null;
}

export interface AppointmentListResponse {
    data: AppointmentResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
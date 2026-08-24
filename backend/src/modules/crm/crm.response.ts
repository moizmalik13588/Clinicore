import { PatientResponse } from '../patients/patients.response';

export interface CrmPatientContext {
    patient: PatientResponse;
    isReturning: boolean;
    lastVisit: VisitResponse | null;
    totalCalls: number;
}

export interface VisitResponse {
    id: string;
    visitDate: string;
    chiefComplaint: string | null;
    diagnosis: string | null;
    treatmentNotes: string | null;
    followUpDays: number | null;
    doctor: {
        id: string;
        name: string;
        specialty: string | null;
    } | null;
    appointment: {
        id: string;
        status: string;
        type: string;
    } | null;
    createdAt: string;
}

export interface MoodLogResponse {
    id: string;
    detectedMood: string;
    intensity: number;
    confidence: number;
    timestampOffset: number;
    aiActionTaken: string | null;
    transcriptExcerpt: string | null;
    callId: string;
    createdAt: string;
}

export interface VisitHistoryResponse {
    data: VisitResponse[];
    total: number;
}

export interface MoodLogListResponse {
    data: MoodLogResponse[];
    total: number;
}
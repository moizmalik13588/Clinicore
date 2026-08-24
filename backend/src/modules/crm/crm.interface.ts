import { VisitWithRelations } from './crm.mapper';
import { PatientWithDoctor } from '../patients/patients.mapper';
import { PrismaClient } from '@prisma/client';
import {
    CreateVisitRepoDto,
    CrmSearchDto,
    CreateVisitDto,
    PhoneLookupDto,
} from './crm.dto';
import {
    CrmPatientContext,
    VisitHistoryResponse,
    MoodLogListResponse,
    VisitResponse,
} from './crm.response';

type MoodEvent = Awaited<ReturnType<PrismaClient['moodEvent']['findUniqueOrThrow']>>;

export interface ICrmRepository {
    findPatientByPhone(phone: string, clinicId: string): Promise<PatientWithDoctor | null>;
    findPatientById(id: string, clinicId: string): Promise<PatientWithDoctor | null>;
    findVisitHistory(patientId: string, clinicId: string): Promise<{ data: VisitWithRelations[]; total: number }>;
    findLastVisit(patientId: string, clinicId: string): Promise<VisitWithRelations | null>;
    findMoodLog(patientId: string, clinicId: string): Promise<{ data: MoodEvent[]; total: number }>;
    findCallsCount(patientId: string, clinicId: string): Promise<number>;
    createVisit(dto: CreateVisitRepoDto): Promise<VisitWithRelations>;
    searchPatients(clinicId: string, query: string, offset: number, limit: number): Promise<{ data: PatientWithDoctor[]; total: number }>;
}

export interface ICrmService {
    lookupByPhone(phone: string, clinicId: string): Promise<CrmPatientContext | null>;
    getPatientHistory(patientId: string, clinicId: string): Promise<VisitHistoryResponse>;
    getPatientMoodLog(patientId: string, clinicId: string): Promise<MoodLogListResponse>;
    createVisit(clinicId: string, dto: CreateVisitDto): Promise<VisitResponse>;
    search(clinicId: string, query: CrmSearchDto): Promise<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>;
}
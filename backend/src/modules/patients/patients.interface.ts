import { PatientWithDoctor } from './patients.mapper';
import {
    CreatePatientRepoDto,
    UpdatePatientRepoDto,
    ListPatientsDto,
    CreatePatientDto,
    UpdatePatientDto,
} from './patients.dto';
import { PatientResponse, PatientListResponse } from './patients.response';

export interface IPatientsRepository {
    findAll(clinicId: string, dto: ListPatientsDto, offset: number, limit: number): Promise<{ data: PatientWithDoctor[]; total: number }>;
    findById(id: string, clinicId: string): Promise<PatientWithDoctor | null>;
    findByPhone(phone: string, clinicId: string): Promise<PatientWithDoctor | null>;
    create(dto: CreatePatientRepoDto): Promise<PatientWithDoctor>;
    update(id: string, clinicId: string, dto: UpdatePatientRepoDto): Promise<PatientWithDoctor>;
    softDelete(id: string, clinicId: string): Promise<void>;
}

export interface IPatientsService {
    list(clinicId: string, query: ListPatientsDto): Promise<PatientListResponse>;
    getById(id: string, clinicId: string): Promise<PatientResponse>;
    create(clinicId: string, dto: CreatePatientDto): Promise<PatientResponse>;
    update(id: string, clinicId: string, dto: UpdatePatientDto): Promise<PatientResponse>;
    delete(id: string, clinicId: string): Promise<void>;
}
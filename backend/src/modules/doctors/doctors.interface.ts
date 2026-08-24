import { PrismaClient } from '@prisma/client';
import {
    CreateDoctorRepoDto,
    UpdateDoctorRepoDto,
    ListDoctorsDto,
    CreateDoctorDto,
    UpdateDoctorDto,
} from './doctors.dto';
import { DoctorResponse, DoctorListResponse } from './doctors.response';

type Doctor = Awaited<ReturnType<PrismaClient['doctor']['findUniqueOrThrow']>>;

export interface IDoctorsRepository {
    findAll(clinicId: string, dto: ListDoctorsDto, offset: number, limit: number): Promise<{ data: Doctor[]; total: number }>;
    findById(id: string, clinicId: string): Promise<Doctor | null>;
    findAllActive(clinicId: string): Promise<Doctor[]>;
    create(dto: CreateDoctorRepoDto): Promise<Doctor>;
    update(id: string, clinicId: string, dto: UpdateDoctorRepoDto): Promise<Doctor>;
}

export interface IDoctorsService {
    list(clinicId: string, query: ListDoctorsDto): Promise<DoctorListResponse>;
    getById(id: string, clinicId: string): Promise<DoctorResponse>;
    getActive(clinicId: string): Promise<DoctorResponse[]>;
    create(clinicId: string, dto: CreateDoctorDto): Promise<DoctorResponse>;
    update(id: string, clinicId: string, dto: UpdateDoctorDto): Promise<DoctorResponse>;
    deactivate(id: string, clinicId: string): Promise<DoctorResponse>;
}
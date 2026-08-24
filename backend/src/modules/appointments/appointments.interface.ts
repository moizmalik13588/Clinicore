import { PrismaClient } from '@prisma/client';
import {
    CreateAppointmentRepoDto,
    UpdateAppointmentRepoDto,
    ListAppointmentsDto,
    CreateAppointmentDto,
    UpdateAppointmentDto,
} from './appointments.dto';
import {
    AppointmentResponse,
    AppointmentListResponse,
} from './appointments.response';

type Appointment = Awaited<ReturnType<PrismaClient['appointment']['findUniqueOrThrow']>>;
type Patient = Awaited<ReturnType<PrismaClient['patient']['findUniqueOrThrow']>>;
type Doctor = Awaited<ReturnType<PrismaClient['doctor']['findUniqueOrThrow']>>;

export type AppointmentWithRelations = Appointment & {
    patient: Pick<Patient, 'id' | 'name' | 'phone' | 'email'>;
    doctor: Pick<Doctor, 'id' | 'name' | 'specialty'> | null;
};

// ─── Repository Interface ─────────────────────────────────────────────────────
export interface IAppointmentsRepository {
    findAll(clinicId: string, dto: ListAppointmentsDto, offset: number, limit: number): Promise<{ data: AppointmentWithRelations[]; total: number }>;
    findById(id: string, clinicId: string): Promise<AppointmentWithRelations | null>;
    findTodayCount(clinicId: string): Promise<number>;
    create(dto: CreateAppointmentRepoDto): Promise<AppointmentWithRelations>;
    update(id: string, clinicId: string, dto: UpdateAppointmentRepoDto): Promise<AppointmentWithRelations>;
    delete(id: string, clinicId: string): Promise<void>;
}

// ─── Service Interface ────────────────────────────────────────────────────────
export interface IAppointmentsService {
    list(clinicId: string, query: ListAppointmentsDto): Promise<AppointmentListResponse>;
    getById(id: string, clinicId: string): Promise<AppointmentResponse>;
    create(clinicId: string, dto: CreateAppointmentDto): Promise<AppointmentResponse>;
    update(id: string, clinicId: string, dto: UpdateAppointmentDto): Promise<AppointmentResponse>;
    delete(id: string, clinicId: string): Promise<void>;
}
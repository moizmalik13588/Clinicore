import { prisma } from '../../db/client';
import { ICrmRepository } from './crm.interface';
import { VisitWithRelations } from './crm.mapper';
import { PatientWithDoctor } from '../patients/patients.mapper';
import { CreateVisitRepoDto } from './crm.dto';
import { normalizePhone } from '../../common/utils/helpers';
import { PrismaClient } from '@prisma/client';

type MoodEvent = Awaited<ReturnType<PrismaClient['moodEvent']['findUniqueOrThrow']>>;

const patientInclude = {
    preferredDoctor: { select: { id: true, name: true, specialty: true } },
} as const;

const visitInclude = {
    doctor: { select: { id: true, name: true, specialty: true } },
    appointment: { select: { id: true, status: true, type: true } },
} as const;

export class CrmRepository implements ICrmRepository {

    // ─── Phone Lookup — indexed query, must be <100ms ─────────────────────────
    async findPatientByPhone(
        phone: string,
        clinicId: string,
    ): Promise<PatientWithDoctor | null> {
        const normalized = normalizePhone(phone);
        return prisma.patient.findFirst({
            where: { phone: normalized, clinicId },
            include: patientInclude,
        });
    }

    async findPatientById(id: string, clinicId: string): Promise<PatientWithDoctor | null> {
        return prisma.patient.findFirst({
            where: { id, clinicId },
            include: patientInclude,
        });
    }

    // ─── Visit History ─────────────────────────────────────────────────────────
    async findVisitHistory(
        patientId: string,
        clinicId: string,
    ): Promise<{ data: VisitWithRelations[]; total: number }> {
        const [data, total] = await Promise.all([
            prisma.visitHistory.findMany({
                where: { patientId, clinicId },
                orderBy: { visitDate: 'desc' },
                include: visitInclude,
            }),
            prisma.visitHistory.count({ where: { patientId, clinicId } }),
        ]);
        return { data, total };
    }

    async findLastVisit(
        patientId: string,
        clinicId: string,
    ): Promise<VisitWithRelations | null> {
        return prisma.visitHistory.findFirst({
            where: { patientId, clinicId },
            orderBy: { visitDate: 'desc' },
            include: visitInclude,
        });
    }

    // ─── Mood Log ──────────────────────────────────────────────────────────────
    async findMoodLog(
        patientId: string,
        clinicId: string,
    ): Promise<{ data: MoodEvent[]; total: number }> {
        const [data, total] = await Promise.all([
            prisma.moodEvent.findMany({
                where: { patientId, clinicId },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.moodEvent.count({ where: { patientId, clinicId } }),
        ]);
        return { data, total };
    }

    // ─── Calls Count ──────────────────────────────────────────────────────────
    async findCallsCount(patientId: string, clinicId: string): Promise<number> {
        return prisma.call.count({ where: { patientId, clinicId } });
    }

    // ─── Create Visit ──────────────────────────────────────────────────────────
    async createVisit(dto: CreateVisitRepoDto): Promise<VisitWithRelations> {
        return prisma.visitHistory.create({
            data: {
                clinicId: dto.clinicId,
                patientId: dto.patientId,
                appointmentId: dto.appointmentId,
                doctorId: dto.doctorId,
                visitDate: dto.visitDate,
                chiefComplaint: dto.chiefComplaint,
                diagnosis: dto.diagnosis,
                treatmentNotes: dto.treatmentNotes,
                followUpDays: dto.followUpDays,
            },
            include: visitInclude,
        });
    }

    // ─── Advanced Search ───────────────────────────────────────────────────────
    async searchPatients(
        clinicId: string,
        query: string,
        offset: number,
        limit: number,
    ): Promise<{ data: PatientWithDoctor[]; total: number }> {
        const where: any = {
            clinicId,
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query } },
                { email: { contains: query, mode: 'insensitive' } },
                { crmTags: { has: query } },
            ],
        };

        const [data, total] = await Promise.all([
            prisma.patient.findMany({
                where,
                skip: offset,
                take: limit,
                orderBy: { name: 'asc' },
                include: patientInclude,
            }),
            prisma.patient.count({ where }),
        ]);

        return { data, total };
    }
}
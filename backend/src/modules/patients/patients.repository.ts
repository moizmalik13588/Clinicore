import { prisma } from '../../db/client';
import { IPatientsRepository } from './patients.interface';
import { PatientWithDoctor } from './patients.mapper';
import { CreatePatientRepoDto, UpdatePatientRepoDto, ListPatientsDto } from './patients.dto';
import { normalizePhone } from '../../common/utils/helpers';

const patientInclude = {
    preferredDoctor: { select: { id: true, name: true, specialty: true } },
} as const;

export class PatientsRepository implements IPatientsRepository {

    async findAll(
        clinicId: string,
        dto: ListPatientsDto,
        offset: number,
        limit: number,
    ): Promise<{ data: PatientWithDoctor[]; total: number }> {
        const where: any = { clinicId };

        if (dto.search) {
            where.OR = [
                { name: { contains: dto.search, mode: 'insensitive' } },
                { phone: { contains: dto.search } },
                { email: { contains: dto.search, mode: 'insensitive' } },
            ];
        }

        if (dto.tag) where.crmTags = { has: dto.tag };
        if (dto.mood) where.lastMood = dto.mood;

        const [data, total] = await Promise.all([
            prisma.patient.findMany({
                where,
                skip: offset,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: patientInclude,
            }),
            prisma.patient.count({ where }),
        ]);

        return { data, total };
    }

    async findById(id: string, clinicId: string): Promise<PatientWithDoctor | null> {
        return prisma.patient.findFirst({
            where: { id, clinicId },
            include: patientInclude,
        });
    }

    async findByPhone(phone: string, clinicId: string): Promise<PatientWithDoctor | null> {
        const normalized = normalizePhone(phone);
        return prisma.patient.findFirst({
            where: { phone: normalized, clinicId },
            include: patientInclude,
        });
    }

    async create(dto: CreatePatientRepoDto): Promise<PatientWithDoctor> {
        return prisma.patient.create({
            data: {
                clinicId: dto.clinicId,
                name: dto.name,
                phone: normalizePhone(dto.phone),
                email: dto.email || null,
                gender: dto.gender || null,
                dateOfBirth: dto.dateOfBirth || null,
                notes: dto.notes || null,
                preferredDoctorId: dto.preferredDoctorId || null,
                preferredTimeSlot: dto.preferredTimeSlot || null,
                crmTags: dto.crmTags || [],
            },
            include: patientInclude,
        });
    }

    async update(id: string, clinicId: string, dto: UpdatePatientRepoDto): Promise<PatientWithDoctor> {
        return prisma.patient.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.phone !== undefined && { phone: normalizePhone(dto.phone) }),
                ...(dto.email !== undefined && { email: dto.email }),
                ...(dto.gender !== undefined && { gender: dto.gender }),
                ...(dto.dateOfBirth !== undefined && { dateOfBirth: dto.dateOfBirth }),
                ...(dto.notes !== undefined && { notes: dto.notes }),
                ...(dto.preferredDoctorId !== undefined && { preferredDoctorId: dto.preferredDoctorId }),
                ...(dto.preferredTimeSlot !== undefined && { preferredTimeSlot: dto.preferredTimeSlot }),
                ...(dto.crmTags !== undefined && { crmTags: dto.crmTags }),
            },
            include: patientInclude,
        });
    }

    async softDelete(id: string, clinicId: string): Promise<void> {
        await prisma.patient.update({
            where: { id },
            data: { crmTags: { push: 'deleted' } },
        });
    }
}
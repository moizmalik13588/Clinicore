import { PrismaClient } from '@prisma/client';
import { prisma } from '../../db/client';
import { IDoctorsRepository } from './doctors.interface';
import { CreateDoctorRepoDto, UpdateDoctorRepoDto, ListDoctorsDto } from './doctors.dto';

type Doctor = Awaited<ReturnType<PrismaClient['doctor']['findUniqueOrThrow']>>;

export class DoctorsRepository implements IDoctorsRepository {

    async findAll(
        clinicId: string,
        dto: ListDoctorsDto,
        offset: number,
        limit: number,
    ): Promise<{ data: Doctor[]; total: number }> {
        const where: any = { clinicId };

        if (dto.isActive !== undefined) {
            where.isActive = dto.isActive === 'true';
        }

        const [data, total] = await Promise.all([
            prisma.doctor.findMany({
                where,
                skip: offset,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            prisma.doctor.count({ where }),
        ]);

        return { data, total };
    }

    async findById(id: string, clinicId: string): Promise<Doctor | null> {
        return prisma.doctor.findFirst({ where: { id, clinicId } });
    }

    async findAllActive(clinicId: string): Promise<Doctor[]> {
        return prisma.doctor.findMany({
            where: { clinicId, isActive: true },
            orderBy: { name: 'asc' },
        });
    }

    async create(dto: CreateDoctorRepoDto): Promise<Doctor> {
        return prisma.doctor.create({
            data: {
                clinicId: dto.clinicId,
                name: dto.name,
                specialty: dto.specialty,
            },
        });
    }

    async update(id: string, clinicId: string, dto: UpdateDoctorRepoDto): Promise<Doctor> {
        return prisma.doctor.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.specialty !== undefined && { specialty: dto.specialty }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            },
        });
    }
}
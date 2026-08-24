import { prisma } from '../../db/client';
import { IAppointmentsRepository, AppointmentWithRelations } from './appointments.interface';
import { CreateAppointmentRepoDto, UpdateAppointmentRepoDto, ListAppointmentsDto } from './appointments.dto';
import { AppointmentStatus } from '../../common/types';

const appointmentInclude = {
    patient: { select: { id: true, name: true, phone: true, email: true } },
    doctor: { select: { id: true, name: true, specialty: true } },
} as const;

export class AppointmentsRepository implements IAppointmentsRepository {

    async findAll(
        clinicId: string,
        dto: ListAppointmentsDto,
        offset: number,
        limit: number,
    ): Promise<{ data: AppointmentWithRelations[]; total: number }> {

        const where: any = { clinicId };

        // Range filter
        if (dto.range === 'today') {
            const start = new Date(); start.setHours(0, 0, 0, 0);
            const end = new Date(); end.setHours(23, 59, 59, 999);
            where.appointmentDate = { gte: start, lte: end };
        } else if (dto.range === '7days') {
            const start = new Date(); start.setHours(0, 0, 0, 0);
            const end = new Date(); end.setDate(end.getDate() + 7);
            where.appointmentDate = { gte: start, lte: end };
        } else if (dto.range === '30days') {
            const start = new Date(); start.setHours(0, 0, 0, 0);
            const end = new Date(); end.setDate(end.getDate() + 30);
            where.appointmentDate = { gte: start, lte: end };
        }

        if (dto.status) where.status = dto.status;
        if (dto.doctorId) where.doctorId = dto.doctorId;

        const [data, total] = await Promise.all([
            prisma.appointment.findMany({
                where,
                skip: offset,
                take: limit,
                orderBy: { appointmentDate: 'asc' },
                include: appointmentInclude,
            }),
            prisma.appointment.count({ where }),
        ]);

        return { data, total };
    }

    async findById(id: string, clinicId: string): Promise<AppointmentWithRelations | null> {
        return prisma.appointment.findFirst({
            where: { id, clinicId },
            include: appointmentInclude,
        });
    }

    async findTodayCount(clinicId: string): Promise<number> {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);
        return prisma.appointment.count({
            where: {
                clinicId,
                appointmentDate: { gte: start, lte: end },
                status: { notIn: [AppointmentStatus.CANCELLED] },
            },
        });
    }

    async create(dto: CreateAppointmentRepoDto): Promise<AppointmentWithRelations> {
        return prisma.appointment.create({
            data: {
                clinicId: dto.clinicId,
                patientId: dto.patientId,
                doctorId: dto.doctorId,
                appointmentDate: dto.appointmentDate,
                duration: dto.duration,
                type: dto.type,
                notes: dto.notes,
            },
            include: appointmentInclude,
        });
    }

    async update(
        id: string,
        clinicId: string,
        dto: UpdateAppointmentRepoDto,
    ): Promise<AppointmentWithRelations> {
        return prisma.appointment.update({
            where: { id },
            data: {
                ...(dto.doctorId !== undefined && { doctorId: dto.doctorId }),
                ...(dto.appointmentDate !== undefined && { appointmentDate: dto.appointmentDate }),
                ...(dto.duration !== undefined && { duration: dto.duration }),
                ...(dto.status !== undefined && { status: dto.status }),
                ...(dto.type !== undefined && { type: dto.type }),
                ...(dto.notes !== undefined && { notes: dto.notes }),
            },
            include: appointmentInclude,
        });
    }

    async delete(id: string, clinicId: string): Promise<void> {
        await prisma.appointment.delete({ where: { id } });
    }
}
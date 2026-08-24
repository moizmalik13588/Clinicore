import { prisma } from '../../db/client';
import { AppError, NotFoundError } from '../../common/errors/app.error';
import {
    CreateAvailabilityDto,
    UpdateAvailabilityDto,
    ListAvailabilityDto,
    AvailabilityResponse,
} from './doctors.dto';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toResponse(a: any): AvailabilityResponse {
    return {
        id: a.id,
        doctorId: a.doctorId,           // ← string ab
        dayOfWeek: a.dayOfWeek,
        dayName: DAY_NAMES[a.dayOfWeek] || 'Unknown',
        startTime: a.startTime,
        endTime: a.endTime,
        slotDurationMinutes: a.slotDurationMinutes,
    };
}

export class AvailabilityService {

    async list(dto: ListAvailabilityDto): Promise<AvailabilityResponse[]> {
        const where: any = {};
        if (dto.doctorId) where.doctorId = dto.doctorId;          // ← string, parseInt hataya
        if (dto.dayOfWeek !== undefined) where.dayOfWeek = parseInt(dto.dayOfWeek);

        const records = await prisma.doctorAvailability.findMany({
            where,
            orderBy: [{ doctorId: 'asc' }, { dayOfWeek: 'asc' }],
        });

        return records.map(toResponse);
    }

    async getById(id: string): Promise<AvailabilityResponse> {
        const record = await prisma.doctorAvailability.findUnique({ where: { id } });
        if (!record) throw new NotFoundError('Availability');
        return toResponse(record);
    }

    // ─── doctorId ab string hai — parseInt hataya ────────────────────────────
    async getByDoctor(doctorId: string): Promise<AvailabilityResponse[]> {
        const records = await prisma.doctorAvailability.findMany({
            where: { doctorId },
            orderBy: { dayOfWeek: 'asc' },
        });
        return records.map(toResponse);
    }

    async create(dto: CreateAvailabilityDto): Promise<AvailabilityResponse> {
        const existing = await prisma.doctorAvailability.findFirst({
            where: { doctorId: dto.doctorId, dayOfWeek: dto.dayOfWeek },
        });

        if (existing) {
            throw new AppError(
                `Availability for ${DAY_NAMES[dto.dayOfWeek]} already exists for this doctor. Use update instead.`,
                409,
            );
        }

        if (dto.startTime >= dto.endTime) {
            throw new AppError('startTime must be before endTime', 400);
        }

        const record = await prisma.doctorAvailability.create({
            data: {
                doctorId: dto.doctorId,     // ← string
                dayOfWeek: dto.dayOfWeek,
                startTime: dto.startTime,
                endTime: dto.endTime,
                slotDurationMinutes: dto.slotDurationMinutes || 30,
            },
        });

        return toResponse(record);
    }

    async bulkCreate(
        doctorId: string,                          // ← string
        schedules: Omit<CreateAvailabilityDto, 'doctorId'>[],
    ): Promise<AvailabilityResponse[]> {
        await prisma.doctorAvailability.deleteMany({ where: { doctorId } });

        await prisma.doctorAvailability.createMany({
            data: schedules.map(s => ({
                doctorId,
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
                slotDurationMinutes: s.slotDurationMinutes || 30,
            })),
        });

        return this.getByDoctor(doctorId);
    }

    async update(id: string, dto: UpdateAvailabilityDto): Promise<AvailabilityResponse> {
        const existing = await prisma.doctorAvailability.findUnique({ where: { id } });
        if (!existing) throw new NotFoundError('Availability');

        if (dto.startTime && dto.endTime && dto.startTime >= dto.endTime) {
            throw new AppError('startTime must be before endTime', 400);
        }

        const record = await prisma.doctorAvailability.update({
            where: { id },
            data: {
                ...(dto.startTime !== undefined && { startTime: dto.startTime }),
                ...(dto.endTime !== undefined && { endTime: dto.endTime }),
                ...(dto.slotDurationMinutes !== undefined && { slotDurationMinutes: dto.slotDurationMinutes }),
                ...(dto.dayOfWeek !== undefined && { dayOfWeek: dto.dayOfWeek }),
            },
        });

        return toResponse(record);
    }

    async delete(id: string): Promise<void> {
        const existing = await prisma.doctorAvailability.findUnique({ where: { id } });
        if (!existing) throw new NotFoundError('Availability');
        await prisma.doctorAvailability.delete({ where: { id } });
    }

    // ─── doctorId string ─────────────────────────────────────────────────────
    async getAvailableSlots(doctorId: string, date: string): Promise<string[]> {
        const dayOfWeek = new Date(date).getDay();

        const availability = await prisma.doctorAvailability.findFirst({
            where: { doctorId, dayOfWeek },
        });

        if (!availability) return [];

        const slots: string[] = [];
        const [startH, startM] = availability.startTime.split(':').map(Number);
        const [endH, endM] = availability.endTime.split(':').map(Number);

        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;
        const duration = availability.slotDurationMinutes;

        for (let mins = startMins; mins + duration <= endMins; mins += duration) {
            const h = Math.floor(mins / 60).toString().padStart(2, '0');
            const m = (mins % 60).toString().padStart(2, '0');
            slots.push(`${h}:${m}`);
        }

        return slots;
    }
}

export const availabilityService = new AvailabilityService();
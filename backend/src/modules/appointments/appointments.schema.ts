import { z } from 'zod';
import { AppointmentStatus, AppointmentType } from '../../common/types';

export const createAppointmentSchema = z.object({
    patientId: z.string().uuid('Valid patientId required'),
    doctorId: z.string().uuid().optional(),
    appointmentDate: z.string().datetime('Valid ISO datetime required'),
    duration: z.number().int().min(15).max(240).default(30),
    type: z.nativeEnum(AppointmentType).default(AppointmentType.GENERAL),
    notes: z.string().max(500).optional(),
});

export const updateAppointmentSchema = z.object({
    doctorId: z.string().uuid().optional(),
    appointmentDate: z.string().datetime().optional(),
    duration: z.number().int().min(15).max(240).optional(),
    status: z.nativeEnum(AppointmentStatus).optional(),
    type: z.nativeEnum(AppointmentType).optional(),
    notes: z.string().max(500).optional(),
});

export const listAppointmentsSchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    range: z.enum(['today', '7days', '30days', 'all']).default('all'),
    status: z.nativeEnum(AppointmentStatus).optional(),
    doctorId: z.string().uuid().optional(),
});
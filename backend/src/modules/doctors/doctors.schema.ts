import { z } from 'zod';

export const createDoctorSchema = z.object({
    name: z.string().min(2, 'Name required'),
    specialty: z.string().optional(),
});

export const updateDoctorSchema = z.object({
    name: z.string().min(2).optional(),
    specialty: z.string().optional(),
    isActive: z.boolean().optional(),
});

export const listDoctorsSchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
});

// Existing schemas ke saath add karo:

// createAvailabilitySchema mein yeh line change karo:
export const createAvailabilitySchema = z.object({
    doctorId: z.string().uuid('Valid doctorId required'),  // ← Int se string uuid
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Format: HH:MM or HH:MM:SS'),
    endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Format: HH:MM or HH:MM:SS'),
    slotDurationMinutes: z.number().int().min(15).max(120).default(30),
});

export const updateAvailabilitySchema = createAvailabilitySchema.partial().omit({ doctorId: true });

export const listAvailabilitySchema = z.object({
    doctorId: z.string().optional(),
    dayOfWeek: z.string().optional(),
});
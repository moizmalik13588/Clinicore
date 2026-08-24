import { z } from 'zod';

export const createPatientSchema = z.object({
    name: z.string().min(2, 'Name required'),
    phone: z.string().min(7, 'Valid phone required'),
    email: z.string().email().optional().or(z.literal('')),
    gender: z.enum(['male', 'female', 'other']).optional(),
    dateOfBirth: z.string().optional(),
    notes: z.string().optional(),
    preferredDoctorId: z.string().uuid().optional(),
    preferredTimeSlot: z.enum(['morning', 'afternoon', 'evening']).optional(),
    crmTags: z.array(z.string()).optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

export const listPatientsSchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    tag: z.string().optional(),
    mood: z.string().optional(),
});
import { z } from 'zod';

export const phoneLookupSchema = z.object({
    phone: z.string().min(7, 'Valid phone required'),
});

export const createVisitSchema = z.object({
    patientId: z.string().uuid('Valid patientId required'),
    appointmentId: z.string().uuid().optional(),
    doctorId: z.string().uuid().optional(),
    visitDate: z.string().datetime(),
    chiefComplaint: z.string().optional(),
    diagnosis: z.string().optional(),
    treatmentNotes: z.string().optional(),
    followUpDays: z.number().int().min(1).max(365).optional(),
});

export const crmSearchSchema = z.object({
    q: z.string().min(1, 'Search query required'),
    page: z.string().optional(),
    limit: z.string().optional(),
});
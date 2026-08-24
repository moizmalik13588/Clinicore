import { z } from 'zod';

export const createRevenueSchema = z.object({
    patientId: z.string().uuid().optional(),
    appointmentId: z.string().uuid().optional(),
    amount: z.number().positive('Amount must be positive'),
    type: z.enum([
        'new_patient',
        'returning_patient',
        'no_show_recovered',
        'consultation',
    ]).default('consultation'),
    description: z.string().max(200).optional(),
});

export const listRevenueSchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    type: z.enum([
        'new_patient',
        'returning_patient',
        'no_show_recovered',
        'consultation',
    ]).optional(),
});

export const revenueStatsSchema = z.object({
    range: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
});
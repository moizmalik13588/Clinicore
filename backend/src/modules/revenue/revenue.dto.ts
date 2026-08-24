import { z } from 'zod';
import {
    createRevenueSchema,
    listRevenueSchema,
    revenueStatsSchema,
} from './revenue.schema';

export type CreateRevenueDto = z.infer<typeof createRevenueSchema>;
export type ListRevenueDto = z.infer<typeof listRevenueSchema>;
export type RevenueStatsDto = z.infer<typeof revenueStatsSchema>;

export interface CreateRevenueRepoDto {
    clinicId: string;
    patientId?: string;
    appointmentId?: string;
    amount: number;
    type: string;
    description?: string;
}
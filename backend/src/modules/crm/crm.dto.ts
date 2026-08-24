import { z } from 'zod';
import {
    phoneLookupSchema,
    createVisitSchema,
    crmSearchSchema,
} from './crm.schema';

export type PhoneLookupDto = z.infer<typeof phoneLookupSchema>;
export type CreateVisitDto = z.infer<typeof createVisitSchema>;
export type CrmSearchDto = z.infer<typeof crmSearchSchema>;

export interface CreateVisitRepoDto {
    clinicId: string;
    patientId: string;
    appointmentId?: string;
    doctorId?: string;
    visitDate: Date;
    chiefComplaint?: string;
    diagnosis?: string;
    treatmentNotes?: string;
    followUpDays?: number;
}
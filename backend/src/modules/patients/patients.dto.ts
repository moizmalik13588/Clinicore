import { z } from 'zod';
import {
    createPatientSchema,
    updatePatientSchema,
    listPatientsSchema,
} from './patients.schema';

export type CreatePatientDto = z.infer<typeof createPatientSchema>;
export type UpdatePatientDto = z.infer<typeof updatePatientSchema>;
export type ListPatientsDto = z.infer<typeof listPatientsSchema>;

export interface CreatePatientRepoDto {
    clinicId: string;
    name: string;
    phone: string;
    email?: string;
    gender?: string;
    dateOfBirth?: Date;
    notes?: string;
    preferredDoctorId?: string;
    preferredTimeSlot?: string;
    crmTags: string[];
}

export interface UpdatePatientRepoDto {
    name?: string;
    phone?: string;
    email?: string | null;
    gender?: string;
    dateOfBirth?: Date | null;
    notes?: string;
    preferredDoctorId?: string | null;
    preferredTimeSlot?: string;
    crmTags?: string[];
}
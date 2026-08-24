import { z } from 'zod';
import {
    createDoctorSchema,
    updateDoctorSchema,
    listDoctorsSchema,
    createAvailabilitySchema,
    updateAvailabilitySchema,
    listAvailabilitySchema,
} from './doctors.schema';

export type CreateDoctorDto = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorDto = z.infer<typeof updateDoctorSchema>;
export type ListDoctorsDto = z.infer<typeof listDoctorsSchema>;

export interface CreateDoctorRepoDto {
    clinicId: string;
    name: string;
    specialty?: string;
}

export interface UpdateDoctorRepoDto {
    name?: string;
    specialty?: string;
    isActive?: boolean;
}

export interface AvailabilityResponse {
    id: number;
    doctorId: string;    // ← Int se string
    dayOfWeek: number;
    dayName: string;
    startTime: string;
    endTime: string;
    slotDurationMinutes: number;
}

export type CreateAvailabilityDto = z.infer<typeof createAvailabilitySchema>;
export type UpdateAvailabilityDto = z.infer<typeof updateAvailabilitySchema>;
export type ListAvailabilityDto = z.infer<typeof listAvailabilitySchema>;
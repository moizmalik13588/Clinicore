import { z } from 'zod';
import {
    createAppointmentSchema,
    updateAppointmentSchema,
    listAppointmentsSchema,
} from './appointments.schema';
import { AppointmentStatus, AppointmentType } from '../../common/types';

export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentDto = z.infer<typeof updateAppointmentSchema>;
export type ListAppointmentsDto = z.infer<typeof listAppointmentsSchema>;

export interface CreateAppointmentRepoDto {
    clinicId: string;
    patientId: string;
    doctorId?: string;
    appointmentDate: Date;
    duration: number;
    type: AppointmentType;
    notes?: string;
}

export interface UpdateAppointmentRepoDto {
    doctorId?: string;
    appointmentDate?: Date;
    duration?: number;
    status?: AppointmentStatus;
    type?: AppointmentType;
    notes?: string;
}
import { PrismaClient } from '@prisma/client';
import { AppointmentResponse } from './appointments.response';

type Appointment = Awaited<ReturnType<PrismaClient['appointment']['findUniqueOrThrow']>>;
type Patient = Awaited<ReturnType<PrismaClient['patient']['findUniqueOrThrow']>>;
type Doctor = Awaited<ReturnType<PrismaClient['doctor']['findUniqueOrThrow']>>;

type AppointmentWithRelations = Appointment & {
    patient: Pick<Patient, 'id' | 'name' | 'phone'>;
    doctor: Pick<Doctor, 'id' | 'name' | 'specialty'> | null;
};

export class AppointmentsMapper {
    static toResponse(a: AppointmentWithRelations): AppointmentResponse {
        return {
            id: a.id,
            patientId: a.patientId,
            doctorId: a.doctorId,
            appointmentDate: a.appointmentDate.toISOString(),
            duration: a.duration,
            status: a.status,
            type: a.type,
            notes: a.notes,
            reminderSent: a.reminderSent,
            createdAt: a.createdAt.toISOString(),
            updatedAt: a.updatedAt.toISOString(),
            patient: {
                id: a.patient.id,
                name: a.patient.name,
                phone: a.patient.phone,
            },
            doctor: a.doctor ? {
                id: a.doctor.id,
                name: a.doctor.name,
                specialty: a.doctor.specialty,
            } : null,
        };
    }

    static toResponseList(appointments: AppointmentWithRelations[]): AppointmentResponse[] {
        return appointments.map(AppointmentsMapper.toResponse);
    }
}
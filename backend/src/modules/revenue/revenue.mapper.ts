import { PrismaClient } from '@prisma/client';
import { RevenueEventResponse } from './revenue.response';

type RevenueEvent = Awaited<ReturnType<PrismaClient['revenueEvent']['findUniqueOrThrow']>>;
type Patient = Awaited<ReturnType<PrismaClient['patient']['findUniqueOrThrow']>>;
type Appointment = Awaited<ReturnType<PrismaClient['appointment']['findUniqueOrThrow']>>;

export type RevenueWithRelations = RevenueEvent & {
    patient: Pick<Patient, 'id' | 'name'> | null;
    appointment: Pick<Appointment, 'id' | 'status' | 'type'> | null;
};

export class RevenueMapper {
    static toResponse(r: RevenueWithRelations): RevenueEventResponse {
        return {
            id: r.id,
            amount: Number(r.amount),
            type: r.type,
            description: r.description,
            createdAt: r.createdAt.toISOString(),
            patient: r.patient ? {
                id: r.patient.id,
                name: r.patient.name,
            } : null,
            appointment: r.appointment ? {
                id: r.appointment.id,
                status: r.appointment.status,
                type: r.appointment.type,
            } : null,
        };
    }

    static toResponseList(events: RevenueWithRelations[]): RevenueEventResponse[] {
        return events.map(RevenueMapper.toResponse);
    }
}
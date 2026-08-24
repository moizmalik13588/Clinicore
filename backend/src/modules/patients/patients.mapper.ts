import { PrismaClient } from '@prisma/client';
import { PatientResponse } from './patients.response';

type Patient = Awaited<ReturnType<PrismaClient['patient']['findUniqueOrThrow']>>;
type Doctor = Awaited<ReturnType<PrismaClient['doctor']['findUniqueOrThrow']>>;

export type PatientWithDoctor = Patient & {
    preferredDoctor: Pick<Doctor, 'id' | 'name' | 'specialty'> | null;
};

export class PatientsMapper {
    static toResponse(p: PatientWithDoctor): PatientResponse {
        return {
            id: p.id,
            name: p.name,
            phone: p.phone,
            email: p.email,
            gender: p.gender,
            dateOfBirth: p.dateOfBirth?.toISOString() ?? null,
            totalVisits: p.totalVisits,
            lastVisitDate: p.lastVisitDate?.toISOString() ?? null,
            lastComplaint: p.lastComplaint,
            lastMood: p.lastMood,
            crmTags: p.crmTags,
            preferredTimeSlot: p.preferredTimeSlot,
            notes: p.notes,
            preferredDoctor: p.preferredDoctor ? {
                id: p.preferredDoctor.id,
                name: p.preferredDoctor.name,
                specialty: p.preferredDoctor.specialty,
            } : null,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
        };
    }

    static toResponseList(patients: PatientWithDoctor[]): PatientResponse[] {
        return patients.map(PatientsMapper.toResponse);
    }
}
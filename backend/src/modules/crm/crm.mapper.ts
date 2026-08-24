import { PrismaClient } from '@prisma/client';
import { VisitResponse, MoodLogResponse } from './crm.response';

type VisitHistory = Awaited<ReturnType<PrismaClient['visitHistory']['findUniqueOrThrow']>>;
type Doctor = Awaited<ReturnType<PrismaClient['doctor']['findUniqueOrThrow']>>;
type Appointment = Awaited<ReturnType<PrismaClient['appointment']['findUniqueOrThrow']>>;
type MoodEvent = Awaited<ReturnType<PrismaClient['moodEvent']['findUniqueOrThrow']>>;

export type VisitWithRelations = VisitHistory & {
    doctor: Pick<Doctor, 'id' | 'name' | 'specialty'> | null;
    appointment: Pick<Appointment, 'id' | 'status' | 'type'> | null;
};

export class CrmMapper {

    static toVisitResponse(v: VisitWithRelations): VisitResponse {
        return {
            id: v.id,
            visitDate: v.visitDate.toISOString(),
            chiefComplaint: v.chiefComplaint,
            diagnosis: v.diagnosis,
            treatmentNotes: v.treatmentNotes,
            followUpDays: v.followUpDays,
            doctor: v.doctor ? {
                id: v.doctor.id,
                name: v.doctor.name,
                specialty: v.doctor.specialty,
            } : null,
            appointment: v.appointment ? {
                id: v.appointment.id,
                status: v.appointment.status,
                type: v.appointment.type,
            } : null,
            createdAt: v.createdAt.toISOString(),
        };
    }

    static toMoodLogResponse(m: MoodEvent): MoodLogResponse {
        return {
            id: m.id,
            detectedMood: m.detectedMood,
            intensity: m.intensity,
            confidence: m.confidence,
            timestampOffset: m.timestampOffset,
            aiActionTaken: m.aiActionTaken,
            transcriptExcerpt: m.transcriptExcerpt,
            callId: m.callId,
            createdAt: m.createdAt.toISOString(),
        };
    }
}
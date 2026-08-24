import { PrismaClient } from '@prisma/client';
import { DoctorResponse } from './doctors.response';

type Doctor = Awaited<ReturnType<PrismaClient['doctor']['findUniqueOrThrow']>>;

export class DoctorsMapper {
    static toResponse(d: Doctor): DoctorResponse {
        return {
            id: d.id,
            name: d.name,
            specialty: d.specialty,
            isActive: d.isActive,
            createdAt: d.createdAt.toISOString(),
        };
    }

    static toResponseList(doctors: Doctor[]): DoctorResponse[] {
        return doctors.map(DoctorsMapper.toResponse);
    }
}
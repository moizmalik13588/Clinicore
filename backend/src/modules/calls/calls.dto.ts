import { z } from 'zod';
import {
    createCallSchema,
    updateCallSchema,
    listCallsSchema,
} from './calls.schema';
import { CallDirection, CallStatus } from '../../common/types';

export type CreateCallDto = z.infer<typeof createCallSchema>;
export type UpdateCallDto = z.infer<typeof updateCallSchema>;
export type ListCallsDto = z.infer<typeof listCallsSchema>;

export interface CreateCallRepoDto {
    clinicId: string;
    patientId?: string;
    retellCallId?: string;
    fromNumber?: string;
    toNumber?: string;
    direction: CallDirection;
    startedAt: Date;
}

export interface UpdateCallRepoDto {
    patientId?: string;
    status?: CallStatus;
    duration?: number;
    transcript?: string;
    dominantMood?: string;
    avgIntensity?: number;
    endedAt?: Date;
}
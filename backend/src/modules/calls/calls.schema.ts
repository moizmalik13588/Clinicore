import { z } from 'zod';
import { CallStatus, CallDirection } from '../../common/types';

export const createCallSchema = z.object({
    patientId: z.string().uuid().optional(),
    retellCallId: z.string().optional(),
    fromNumber: z.string().optional(),
    toNumber: z.string().optional(),
    direction: z.nativeEnum(CallDirection).default(CallDirection.INBOUND),
});

export const updateCallSchema = z.object({
    patientId: z.string().uuid().optional(),
    status: z.nativeEnum(CallStatus).optional(),
    duration: z.number().int().optional(),
    transcript: z.string().optional(),
    dominantMood: z.string().optional(),
    avgIntensity: z.number().min(0).max(1).optional(),
    endedAt: z.string().datetime().optional(),
});

export const listCallsSchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    patientId: z.string().uuid().optional(),
    status: z.nativeEnum(CallStatus).optional(),
    direction: z.nativeEnum(CallDirection).optional(),
});
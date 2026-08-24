import { z } from 'zod';

export const createAgentSchema = z.object({
    voiceId: z.string().default('11labs-Adrian'),
    agentName: z.string().default('Clinicore Assistant'),
    beginMessage: z.string().optional(),
});

export const updateClinicSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    apptDurationMins: z.number().int().min(5).max(1440).optional(),  // ← max 120 se 1440 kiya
});
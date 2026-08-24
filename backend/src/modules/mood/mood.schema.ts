import { z } from 'zod';

export const analyzeMoodSchema = z.object({
    text: z.string().min(5, 'Text too short for analysis'),
    callId: z.string().optional(),
    patientId: z.string().uuid().optional(),
});

export const moodTrendsSchema = z.object({
    range: z.enum(['7d', '30d', '90d']).default('7d'),
});

export const listMoodEventsSchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    patientId: z.string().uuid().optional(),
    callId: z.string().optional(),
    mood: z.enum(['calm', 'frustrated', 'angry', 'anxious', 'happy']).optional(),
});
import { z } from 'zod';
import {
    analyzeMoodSchema,
    moodTrendsSchema,
    listMoodEventsSchema,
} from './mood.schema';

export type AnalyzeMoodDto = z.infer<typeof analyzeMoodSchema>;
export type MoodTrendsDto = z.infer<typeof moodTrendsSchema>;
export type ListMoodEventsDto = z.infer<typeof listMoodEventsSchema>;

export interface CreateMoodEventDto {
    clinicId: string;
    callId: string;
    patientId?: string;
    detectedMood: string;
    intensity: number;
    confidence: number;
    timestampOffset: number;
    aiActionTaken?: string;
    transcriptExcerpt?: string;
    escalationTriggered?: boolean;
}

export interface MoodAnalysisResult {
    mood: string;
    intensity: number;
    confidence: number;
    action: string;
}
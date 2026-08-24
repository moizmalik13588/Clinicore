import { PrismaClient } from '@prisma/client';
import {
    CreateMoodEventDto,
    MoodAnalysisResult,
    ListMoodEventsDto,
    MoodTrendsDto,
} from './mood.dto';
import {
    MoodEventResponse,
    MoodAnalysisResponse,
    MoodTrendsResponse,
    MoodCallTimelineResponse,
    PatientMoodHistoryResponse,
} from './mood.response';

type MoodEvent = Awaited<ReturnType<PrismaClient['moodEvent']['findUniqueOrThrow']>>;

// ─── Repository Interface ─────────────────────────────────────────────────────
export interface IMoodRepository {
    create(dto: CreateMoodEventDto): Promise<MoodEvent>;
    findByCallId(callId: string, clinicId: string): Promise<MoodEvent[]>;
    findByPatientId(patientId: string, clinicId: string, limit?: number): Promise<MoodEvent[]>;
    findAll(clinicId: string, dto: ListMoodEventsDto, offset: number, limit: number): Promise<{ data: MoodEvent[]; total: number }>;
    findTrends(clinicId: string, dto: MoodTrendsDto): Promise<MoodEvent[]>;
    getLastMoodForCall(callId: string): Promise<MoodEvent | null>;
    updateCallMoodSummary(callId: string, dominantMood: string, avgIntensity: number): Promise<void>;
    updatePatientLastMood(patientId: string, mood: string): Promise<void>;
}

// ─── Service Interface ────────────────────────────────────────────────────────
export interface IMoodService {
    analyzeMood(text: string, callId?: string, patientId?: string, clinicId?: string, timestampOffset?: number): Promise<MoodAnalysisResult>;
    saveMoodEvent(dto: CreateMoodEventDto): Promise<MoodEventResponse>;
    getMoodForCall(callId: string, clinicId: string): Promise<MoodCallTimelineResponse>;
    getMoodTrends(clinicId: string, dto: MoodTrendsDto): Promise<MoodTrendsResponse>;
    getPatientMoodHistory(patientId: string, clinicId: string): Promise<PatientMoodHistoryResponse>;
    listEvents(clinicId: string, dto: ListMoodEventsDto): Promise<{ data: MoodEventResponse[]; total: number; page: number; limit: number; totalPages: number }>;
    runAutoTagBatch(clinicId: string): Promise<{ tagged: number }>;
}
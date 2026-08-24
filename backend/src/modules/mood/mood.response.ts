export interface MoodEventResponse {
    id: string;
    detectedMood: string;
    intensity: number;
    confidence: number;
    timestampOffset: number;
    aiActionTaken: string | null;
    transcriptExcerpt: string | null;
    escalationTriggered: boolean;
    callId: string;
    patientId: string | null;
    createdAt: string;
}

export interface MoodAnalysisResponse {
    mood: string;
    intensity: number;
    confidence: number;
    action: string;
    saved: boolean;
}

export interface MoodTrendPoint {
    date: string;   // "2025-05-01"
    calm: number;   // percentage
    frustrated: number;
    angry: number;
    anxious: number;
    happy: number;
    total: number;
}

export interface MoodTrendsResponse {
    range: string;
    data: MoodTrendPoint[];
    summary: {
        dominantMood: string;
        calmRate: number;
        angryRate: number;
        totalEvents: number;
    };
}

export interface MoodCallTimelineResponse {
    callId: string;
    events: MoodEventResponse[];
    summary: {
        dominantMood: string;
        avgIntensity: number;
        totalEvents: number;
        escalated: boolean;
    };
}

export interface PatientMoodHistoryResponse {
    patientId: string;
    events: MoodEventResponse[];
    summary: {
        dominantMood: string;
        totalCalls: number;
        angryCount: number;
        anxiousCount: number;
    };
}
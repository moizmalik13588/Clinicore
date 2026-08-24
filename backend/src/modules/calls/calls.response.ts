export interface CallPatientInfo {
    id: string;
    name: string;
    phone: string;
}

export interface CallResponse {
    id: string;
    patientId: string | null;
    retellCallId: string | null;
    fromNumber: string | null;
    toNumber: string | null;
    direction: string;
    status: string;
    duration: number | null;
    dominantMood: string | null;
    avgIntensity: number | null;
    startedAt: string | null;
    endedAt: string | null;
    createdAt: string;
    patient: CallPatientInfo | null;
}

export interface CallWithTranscriptResponse extends CallResponse {
    transcript: string | null;
}

// ─── Mood segment for timeline ────────────────────────────────────────────────
export interface MoodSegment {
    timestampOffset: number;     // seconds into call
    mood: string;
    intensity: number;
    confidence: number;
    aiActionTaken: string | null;
    transcriptExcerpt: string | null;
    escalated: boolean;
}

// ─── Full call with mood timeline ─────────────────────────────────────────────
export interface CallWithMoodTimelineResponse extends CallWithTranscriptResponse {
    moodTimeline: MoodSegment[];
    moodSummary: {
        dominantMood: string;
        avgIntensity: number;
        totalEvents: number;
        escalated: boolean;
        calmPercent: number;
        angryPercent: number;
        anxiousPercent: number;
    };
}

export interface CallListResponse {
    data: CallResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
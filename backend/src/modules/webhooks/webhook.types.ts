export interface ProcessCallStartedDto {
    callId: string;
    agentId: string;
    fromNumber: string;
    toNumber: string;
    direction: 'inbound' | 'outbound';
    startedAt: Date;
    metadata?: Record<string, any>;
}

export interface ProcessCallEndedDto {
    callId: string;
    fromNumber: string;
    endedAt: Date;
    durationMs: number;
    transcript?: string;
    analysis?: {
        callSummary?: string;
        userSentiment?: string;
        callSuccessful?: boolean;
    };
}

export interface ProcessTranscriptUpdateDto {
    callId: string;
    transcript: Array<{ role: string; content: string }>;
    lastWords: string;
}

// ─── Rate limit store — per call tone update throttle ─────────────────────────
export interface ToneUpdateRecord {
    lastUpdateAt: number;   // timestamp ms
    updateCount: number;
}
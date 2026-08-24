import { PrismaClient } from '@prisma/client';
import { MoodEventResponse } from './mood.response';

type MoodEvent = Awaited<ReturnType<PrismaClient['moodEvent']['findUniqueOrThrow']>>;

export class MoodMapper {
    static toResponse(m: MoodEvent): MoodEventResponse {
        return {
            id: m.id,
            detectedMood: m.detectedMood,
            intensity: m.intensity,
            confidence: m.confidence,
            timestampOffset: m.timestampOffset,
            aiActionTaken: m.aiActionTaken,
            transcriptExcerpt: m.transcriptExcerpt,
            escalationTriggered: m.escalationTriggered,
            callId: m.callId,
            patientId: m.patientId,
            createdAt: m.createdAt.toISOString(),
        };
    }

    static toResponseList(events: MoodEvent[]): MoodEventResponse[] {
        return events.map(MoodMapper.toResponse);
    }

    // Dominant mood calculate karo
    static getDominantMood(events: MoodEvent[]): string {
        if (events.length === 0) return 'calm';

        const counts: Record<string, number> = {};
        for (const e of events) {
            counts[e.detectedMood] = (counts[e.detectedMood] || 0) + 1;
        }

        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)[0][0];
    }

    // Average intensity
    static getAvgIntensity(events: MoodEvent[]): number {
        if (events.length === 0) return 0;
        const sum = events.reduce((acc, e) => acc + e.intensity, 0);
        return Math.round((sum / events.length) * 100) / 100;
    }
}
import {
    openRouterChat,
    parseJsonResponse,
} from '../../common/utils/openrouter.helper';

// ─── Extraction result types ──────────────────────────────────────────────────
export interface ExtractedCallData {
    chiefComplaint: string | null;
    appointmentType: 'general' | 'follow_up' | 'new_patient' | null;
    followUpNeeded: boolean;
    followUpDays: number | null;
    appointmentBooked: boolean;
    preferredDate: string | null;
    preferredTime: string | null;
    diagnosis: string | null;
    notes: string | null;
}

// ─── System prompts ───────────────────────────────────────────────────────────
const EXTRACTION_SYSTEM_PROMPT = `
You are a medical clinic AI assistant. Analyze the call transcript and extract key information.

Return ONLY a valid JSON object with these exact fields:
{
  "chiefComplaint": "main reason patient called (string or null)",
  "appointmentType": "general | follow_up | new_patient | null",
  "followUpNeeded": true/false,
  "followUpDays": number of days for follow-up (integer or null),
  "appointmentBooked": true/false (was appointment successfully booked),
  "preferredDate": "date mentioned by patient (string or null)",
  "preferredTime": "time mentioned by patient (string or null)",
  "diagnosis": "any diagnosis mentioned (string or null)",
  "notes": "any other important notes (string or null)"
}

Rules:
- Extract only what was explicitly mentioned
- Do not infer or assume
- chiefComplaint should be brief (max 10 words)
- Return ONLY the JSON, no explanation, no markdown
`.trim();

export class AiService {

    // ─── Extract complaint from transcript ────────────────────────────────────
    async extractCallData(transcript: string): Promise<ExtractedCallData> {

        if (!transcript || transcript.length < 50) {
            return this.emptyExtraction();
        }

        // Transcript 3000 chars mein trim karo (token limit)
        const trimmed = transcript.slice(0, 3000);

        try {
            const raw = await openRouterChat(
                [
                    { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
                    { role: 'user', content: `Call transcript:\n\n${trimmed}` },
                ],
                {
                    model: 'anthropic/claude-haiku-4-5',
                    maxTokens: 500,
                    temperature: 0.1,
                },
            );

            const parsed = parseJsonResponse<ExtractedCallData>(raw);

            if (!parsed) {
                console.warn('[AI] Extraction parse failed — returning empty');
                return this.emptyExtraction();
            }

            console.log('[AI] Extracted:', JSON.stringify(parsed, null, 2));
            return parsed;

        } catch (err) {
            console.error('[AI] Extraction error:', err);
            return this.emptyExtraction();
        }
    }

    // ─── Summarize transcript ─────────────────────────────────────────────────
    async summarizeTranscript(transcript: string): Promise<string | null> {
        if (!transcript || transcript.length < 50) return null;

        try {
            const summary = await openRouterChat(
                [
                    {
                        role: 'system',
                        content: 'Summarize this medical clinic call transcript in 2-3 sentences. Be concise and factual. Return only the summary text.',
                    },
                    {
                        role: 'user',
                        content: transcript.slice(0, 3000),
                    },
                ],
                {
                    model: 'anthropic/claude-haiku-4-5',
                    maxTokens: 200,
                },
            );

            return summary.trim() || null;
        } catch (err) {
            console.error('[AI] Summarize error:', err);
            return null;
        }
    }

    // ─── Empty result ─────────────────────────────────────────────────────────
    private emptyExtraction(): ExtractedCallData {
        return {
            chiefComplaint: null,
            appointmentType: null,
            followUpNeeded: false,
            followUpDays: null,
            appointmentBooked: false,
            preferredDate: null,
            preferredTime: null,
            diagnosis: null,
            notes: null,
        };
    }
}

export const aiService = new AiService();
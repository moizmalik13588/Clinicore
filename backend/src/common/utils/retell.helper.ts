import crypto from 'crypto';
import { env } from '../../config/env';

const RETELL_BASE_URL = 'https://api.retellai.com';

// ─── Base fetch ───────────────────────────────────────────────────────────────
async function retellFetch<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const res = await fetch(`${RETELL_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${env.RETELL_API_KEY}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`Retell API [${res.status}]: ${JSON.stringify(error)}`);
    }

    return res.json() as T;
}

// ─── Webhook Event Types ──────────────────────────────────────────────────────
export type RetellEventType =
    | 'call_started'
    | 'call_ended'
    | 'call_analyzed'
    | 'transcript_update';

export interface RetellWebhookEvent {
    event: RetellEventType;
    call: RetellCallObject;
}

export interface RetellCallObject {
    call_id: string;
    call_type: string;
    agent_id: string;
    call_status: string;
    from_number: string;
    to_number: string;
    direction: 'inbound' | 'outbound';
    start_timestamp: number;
    end_timestamp?: number;
    duration_ms?: number;
    transcript?: string;
    transcript_object?: RetellTranscriptItem[];
    call_analysis?: RetellCallAnalysis;
    metadata?: Record<string, any>;
}

export interface RetellTranscriptItem {
    role: 'agent' | 'user';
    content: string;
    words?: RetellWord[];
}

export interface RetellWord {
    word: string;
    start: number;
    end: number;
    confidence: number;
}

export interface RetellCallAnalysis {
    call_summary?: string;
    in_voicemail?: boolean;
    user_sentiment?: string;
    call_successful?: boolean;
    custom_analysis_data?: Record<string, any>;
}

export interface RetellTranscriptWebhook {
    event: 'transcript_update';
    call_id: string;
    transcript: RetellTranscriptItem[];
}

// ─── Update call mid-call ─────────────────────────────────────────────────────
export async function updateRetellCall(
    callId: string,
    update: {
        system_prompt?: string;
        instructions?: string;
    },
): Promise<void> {
    await retellFetch(`/v2/update-call/${callId}`, {
        method: 'PATCH',
        body: JSON.stringify(update),
    });
}

// ─── Get call info ────────────────────────────────────────────────────────────
export async function getRetellCall(callId: string): Promise<RetellCallObject> {
    return retellFetch<RetellCallObject>(`/v2/get-call/${callId}`);
}

// ─── Retell Agent Management ──────────────────────────────────────────────────
export async function createRetellAgent(opts: any): Promise<any> {
    return retellFetch('/v2/create-agent', {
        method: 'POST',
        body: JSON.stringify(opts),
    });
}

export async function getRetellAgent(agentId: string): Promise<any> {
    return retellFetch(`/v2/get-agent/${agentId}`);
}

export async function updateRetellAgent(agentId: string, opts: any): Promise<any> {
    return retellFetch(`/v2/update-agent/${agentId}`, {
        method: 'PATCH',
        body: JSON.stringify(opts),
    });
}

export async function listRetellAgents(): Promise<any[]> {
    return retellFetch<any[]>('/v2/list-agents');
}

// ─── HMAC Signature Verify ────────────────────────────────────────────────────
export function verifyRetellSignature(
    rawBody: string,
    signature: string,
): boolean {
    try {
        const secret = env.RETELL_WEBHOOK_SECRET;
        if (!secret) return false;

        const expected = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');

        const sigBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expected, 'hex');
        if (sigBuffer.length !== expectedBuffer.length) return false;

        return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
        return false;
    }
}

// ─── Extract last N words from transcript ─────────────────────────────────────
export function extractLastWords(
    transcript: RetellTranscriptItem[],
    wordCount: number = 150,
): string {
    const allText = transcript
        .map(t => `${t.role}: ${t.content}`)
        .join(' ');

    const words = allText.split(' ');
    return words.slice(-wordCount).join(' ');
}
import { env } from '../../config/env';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface OpenRouterOptions {
    model?: string;
    maxTokens?: number;
    temperature?: number;
}

export interface OpenRouterResponse {
    id: string;
    choices: Array<{
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

// ─── Main chat function ───────────────────────────────────────────────────────
export async function openRouterChat(
    messages: OpenRouterMessage[],
    opts: OpenRouterOptions = {},
): Promise<string> {

    if (!env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is not set in .env');
    }

    const model = opts.model || 'anthropic/claude-haiku-4-5';
    const maxTokens = opts.maxTokens || 1000;
    const temperature = opts.temperature || 0.2;

    const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': env.API_BASE_URL,
            'X-Title': 'Clinicore Backend',
        },
        body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            temperature,
            messages,
        }),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`OpenRouter error [${res.status}]: ${JSON.stringify(error)}`);
    }

    const data = await res.json() as OpenRouterResponse;
    const content = data.choices[0]?.message?.content || '';

    console.log(`[OpenRouter] tokens used: ${data.usage?.total_tokens || 0}`);

    return content;
}

// ─── JSON parse helper ────────────────────────────────────────────────────────
export function parseJsonResponse<T>(raw: string): T | null {
    try {
        // markdown code blocks hata do agar ho
        const cleaned = raw
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        return JSON.parse(cleaned) as T;
    } catch {
        console.error('[OpenRouter] JSON parse failed:', raw);
        return null;
    }
}
// ─── Vapi Webhook Types ───────────────────────────────────────────────────────

export interface VapiToolCallPayload {
    message: {
        type: 'tool-calls';
        toolCallList: VapiToolCall[];
        call: {
            id: string;
            phoneNumber?: string;
            customer?: {
                number: string;
            };
        };
    };
}

export interface VapiToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;   // JSON string
    };
}

export interface VapiToolResult {
    results: Array<{
        toolCallId: string;
        result: string;
    }>;
}

// ─── Vapi Event Webhook ───────────────────────────────────────────────────────
export interface VapiEventPayload {
    message: {
        type: string;   // call-start | end-of-call-report | transcript | hang
        call?: {
            id: string;
            phoneNumber?: string;
            customer?: { number: string };
        };
        transcript?: string;
        summary?: string;
        recordingUrl?: string;
        endedReason?: string;
    };
}
// ─── Escalation tracking per call ────────────────────────────────────────────

interface EscalationRecord {
    callId: string;
    negativeCount: number;   // consecutive negative mood events
    lastEscalatedAt: number | null;
    escalated: boolean;
}

const escalationStore = new Map<string, EscalationRecord>();

const ESCALATION_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
const CONSECUTIVE_THRESHOLD = 3;               // 3+ negative events → escalate

// Negative moods
const NEGATIVE_MOODS = new Set(['frustrated', 'angry', 'anxious']);

// ─── Track mood event ─────────────────────────────────────────────────────────
export function trackMoodEvent(
    callId: string,
    mood: string,
): EscalationRecord {
    const record = escalationStore.get(callId) || {
        callId,
        negativeCount: 0,
        lastEscalatedAt: null,
        escalated: false,
    };

    if (NEGATIVE_MOODS.has(mood)) {
        record.negativeCount++;
    } else {
        // Positive mood — reset counter
        record.negativeCount = Math.max(0, record.negativeCount - 1);
    }

    escalationStore.set(callId, record);
    return record;
}

// ─── Should escalate? ─────────────────────────────────────────────────────────
export function shouldEscalate(
    callId: string,
    mood: string,
    intensity: number,
): boolean {
    const record = escalationStore.get(callId);

    // Already escalated recently?
    if (record?.lastEscalatedAt) {
        const elapsed = Date.now() - record.lastEscalatedAt;
        if (elapsed < ESCALATION_COOLDOWN_MS) return false;
    }

    // Extreme anger — immediate escalation
    if (mood === 'angry' && intensity > 0.8) return true;

    // Consecutive negative events
    if ((record?.negativeCount || 0) >= CONSECUTIVE_THRESHOLD) return true;

    return false;
}

// ─── Mark escalated ───────────────────────────────────────────────────────────
export function markEscalated(callId: string): void {
    const record = escalationStore.get(callId) || {
        callId,
        negativeCount: 0,
        lastEscalatedAt: null,
        escalated: false,
    };

    record.lastEscalatedAt = Date.now();
    record.escalated = true;
    escalationStore.set(callId, record);
}

// ─── Clear on call end ────────────────────────────────────────────────────────
export function clearEscalationRecord(callId: string): void {
    escalationStore.delete(callId);
}

// ─── Get record ───────────────────────────────────────────────────────────────
export function getEscalationRecord(callId: string): EscalationRecord | null {
    return escalationStore.get(callId) || null;
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────
setInterval(() => {
    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const [id, rec] of escalationStore.entries()) {
        if ((rec.lastEscalatedAt || 0) < cutoff && !rec.escalated) {
            escalationStore.delete(id);
        }
    }
}, 10 * 60 * 1000);
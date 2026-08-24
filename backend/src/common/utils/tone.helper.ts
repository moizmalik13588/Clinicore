// ─── Tone adjustment instructions per mood ────────────────────────────────────
// Yeh Retell ko bheja jata hai — AI apna tone shift karta hai

export interface ToneInstruction {
    mood: string;
    intensity: number;
    instruction: string;
    priority: number; // higher = more urgent
}

// ─── Build instruction based on mood + intensity ──────────────────────────────
export function buildToneInstruction(
    mood: string,
    intensity: number,
): ToneInstruction | null {

    // Calm ya happy — koi action nahi
    if (mood === 'calm' || mood === 'happy') return null;

    // Low intensity — koi action nahi
    if (intensity < 0.4) return null;

    switch (mood) {

        case 'frustrated':
            if (intensity >= 0.4 && intensity < 0.65) {
                return {
                    mood, intensity,
                    priority: 1,
                    instruction: [
                        'TONE ADJUSTMENT: Patient is mildly frustrated.',
                        'Acknowledge their concern briefly.',
                        'Use a slightly warmer tone.',
                        'Move efficiently to resolve their issue.',
                    ].join(' '),
                };
            }
            return {
                mood, intensity,
                priority: 2,
                instruction: [
                    'TONE ADJUSTMENT: Patient is frustrated.',
                    'Immediately acknowledge: "I completely understand your frustration, and I want to resolve this for you right away."',
                    'Slow down your speech.',
                    'Use a soft, empathetic tone throughout.',
                    'Do not rush — take time to fully address their concern.',
                    'End with: "Is there anything else I can help you with today?"',
                ].join(' '),
            };

        case 'angry':
            if (intensity >= 0.6 && intensity < 0.8) {
                return {
                    mood, intensity,
                    priority: 3,
                    instruction: [
                        'TONE ADJUSTMENT: Patient is angry.',
                        'Do NOT argue or become defensive.',
                        'Say: "I sincerely apologize. Your concern is completely valid."',
                        'Speak slowly and calmly.',
                        'Offer a concrete solution immediately.',
                        'Use the patient\'s name to personalize the conversation.',
                    ].join(' '),
                };
            }
            // Extreme anger
            return {
                mood, intensity,
                priority: 5,
                instruction: [
                    'CRITICAL TONE ADJUSTMENT: Patient is extremely angry.',
                    'Use maximum empathy immediately.',
                    'Say: "I sincerely apologize. This should not have happened and I completely understand your frustration."',
                    'Do NOT defend the clinic.',
                    'Offer: "I can arrange an immediate callback from our senior staff within 30 minutes. Would that help?"',
                    'Speak very slowly and calmly.',
                    'If the patient remains upset, offer to escalate: "I will personally make sure this is addressed."',
                ].join(' '),
            };

        case 'anxious':
            if (intensity >= 0.4 && intensity < 0.65) {
                return {
                    mood, intensity,
                    priority: 1,
                    instruction: [
                        'TONE ADJUSTMENT: Patient seems slightly anxious.',
                        'Use a calm, reassuring tone.',
                        'Speak clearly and at a measured pace.',
                        'Provide clear, step-by-step information.',
                    ].join(' '),
                };
            }
            return {
                mood, intensity,
                priority: 2,
                instruction: [
                    'TONE ADJUSTMENT: Patient is anxious and worried.',
                    'Be extra reassuring: "Please don\'t worry — I am here to help you and everything will be sorted out."',
                    'Speak slowly and clearly.',
                    'Confirm each piece of information twice.',
                    'Avoid medical jargon.',
                    'End every response with reassurance.',
                    'Summary at end: "So what we have agreed is..."',
                ].join(' '),
            };

        case 'sad':
            return {
                mood, intensity,
                priority: 2,
                instruction: [
                    'TONE ADJUSTMENT: Patient seems sad or distressed.',
                    'Use a gentle, compassionate tone.',
                    'Express empathy: "I can hear that you are going through a difficult time."',
                    'Be patient and allow them time to express themselves.',
                    'Offer support: "We are here for you and will do everything we can to help."',
                ].join(' '),
            };

        default:
            return null;
    }
}

// ─── Cooldown map per call ────────────────────────────────────────────────────
interface CooldownRecord {
    lastUpdate: number;
    updateCount: number;
    lastMood: string;
    lastPriority: number;
}

const cooldownMap = new Map<string, CooldownRecord>();

export const COOLDOWN_MS = 30 * 1000; // 30 seconds

export function canSendInstruction(
    callId: string,
    priority: number,
): boolean {
    const record = cooldownMap.get(callId);
    if (!record) return true;

    const elapsed = Date.now() - record.lastUpdate;

    // High priority (angry) — shorter cooldown: 15s
    if (priority >= 4) {
        return elapsed >= 15 * 1000;
    }

    return elapsed >= COOLDOWN_MS;
}

export function markInstructionSent(
    callId: string,
    mood: string,
    priority: number,
): void {
    const record = cooldownMap.get(callId);
    cooldownMap.set(callId, {
        lastUpdate: Date.now(),
        updateCount: (record?.updateCount || 0) + 1,
        lastMood: mood,
        lastPriority: priority,
    });
}

export function clearCallCooldown(callId: string): void {
    cooldownMap.delete(callId);
}

export function getCallStats(callId: string): CooldownRecord | null {
    return cooldownMap.get(callId) || null;
}

// ─── Cleanup stale entries ────────────────────────────────────────────────────
setInterval(() => {
    const now = Date.now();
    for (const [callId, record] of cooldownMap.entries()) {
        if (now - record.lastUpdate > 15 * 60 * 1000) { // 15 min
            cooldownMap.delete(callId);
        }
    }
}, 5 * 60 * 1000);
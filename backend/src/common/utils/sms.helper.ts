import twilio from 'twilio';
import { env } from '../../config/env';

// ─── Twilio client singleton ──────────────────────────────────────────────────
let client: twilio.Twilio;

function getTwilioClient(): twilio.Twilio {
    if (!client) {
        client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    }
    return client;
}

// ─── SMS Types ────────────────────────────────────────────────────────────────
export interface SmsOptions {
    to: string;
    message: string;
    from?: string;
}

export interface SmsResult {
    success: boolean;
    messageSid?: string;
    error?: string;
}

// ─── Send SMS ─────────────────────────────────────────────────────────────────
export async function sendSms(opts: SmsOptions): Promise<SmsResult> {
    try {
        const msg = await getTwilioClient().messages.create({
            body: opts.message,
            from: opts.from || env.TWILIO_DEFAULT_NUMBER,
            to: opts.to,
        });

        console.log(`[SMS] Sent to ${opts.to} | SID: ${msg.sid}`);

        return {
            success: true,
            messageSid: msg.sid,
        };
    } catch (err: any) {
        console.error(`[SMS] Failed to send to ${opts.to}:`, err.message);
        return {
            success: false,
            error: err.message,
        };
    }
}

// ─── SMS Templates ────────────────────────────────────────────────────────────

// Appointment confirmation
export function appointmentConfirmationSms(
    patientName: string,
    date: string,
    time: string,
    doctorName: string,
    clinicName: string,
): string {
    return `Hi ${patientName}! Your appointment is confirmed.\n📅 ${date} at ${time}\n👨‍⚕️ ${doctorName}\n🏥 ${clinicName}\n\nReply CANCEL to cancel.`;
}

// Appointment reminder (24h before)
export function appointmentReminderSms(
    patientName: string,
    date: string,
    time: string,
    doctorName: string,
): string {
    return `Hi ${patientName}! Reminder: You have an appointment tomorrow.\n📅 ${date} at ${time}\n👨‍⚕️ ${doctorName}\n\nReply CONFIRM to confirm or CANCEL to cancel.`;
}

// Appointment cancellation
export function appointmentCancelledSms(
    patientName: string,
    date: string,
    time: string,
): string {
    return `Hi ${patientName}, your appointment on ${date} at ${time} has been cancelled.\n\nTo reschedule, please call us or reply BOOK.`;
}

// New patient welcome
export function welcomeSms(
    patientName: string,
    clinicName: string,
): string {
    return `Welcome to ${clinicName}, ${patientName}! 🏥\n\nYour profile has been created. We look forward to serving you.\n\nFor appointments, please call us anytime.`;
}

// Recall SMS (follow-up)
export function recallSms(
    patientName: string,
    lastVisitDate: string,
    clinicName: string,
    lastComplaint?: string,
): string {
    const complaint = lastComplaint
        ? `regarding your ${lastComplaint}`
        : 'for a follow-up checkup';

    return `Hi ${patientName}! It's been a while since your last visit on ${lastVisitDate}.\n\nWe recommend scheduling an appointment ${complaint}.\n\nCall us or reply BOOK to schedule.\n\n- ${clinicName}`;
}

// Verify Twilio webhook signature
import crypto from 'crypto';

export function verifyTwilioWebhook(
    authToken: string,
    signature: string,
    url: string,
    params: Record<string, string>,
): boolean {
    try {
        const client = twilio(env.TWILIO_ACCOUNT_SID, authToken);
        return twilio.validateRequest(authToken, signature, url, params);
    } catch {
        return false;
    }
}
import cron from 'node-cron';
import { prisma } from '../db/client';
import { smsService } from '../modules/sms/sms.service';

// ─── Runs every hour ──────────────────────────────────────────────────────────
// Appointments jo exactly 24 hours baad hain unko SMS bhejo

export function startReminderJob(): void {

    // Har ghante chalega: "0 * * * *"
    cron.schedule('0 * * * *', async () => {
        console.log('[Reminder Job] Running at:', new Date().toISOString());

        try {
            await sendReminders();
        } catch (err) {
            console.error('[Reminder Job] Error:', err);
        }
    });

    console.log('✅ Reminder job scheduled — runs every hour');
}

async function sendReminders(): Promise<void> {
    // 24h window: ab se 24h + 30 min margin
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23.5 * 60 * 60 * 1000); // 23.5h
    const windowEnd = new Date(now.getTime() + 24.5 * 60 * 60 * 1000); // 24.5h

    // Appointments dhundo jo:
    // 1. Scheduled ya confirmed hain
    // 2. 24h window mein hain
    // 3. Reminder abhi tak nahi gaya
    const appointments = await prisma.appointment.findMany({
        where: {
            status: { in: ['scheduled', 'confirmed'] },
            reminderSent: false,
            appointmentDate: {
                gte: windowStart,
                lte: windowEnd,
            },
        },
        include: {
            patient: { select: { id: true, name: true, phone: true } },
            doctor: { select: { id: true, name: true } },
            clinic: { select: { id: true, name: true } },
        },
    });

    if (appointments.length === 0) {
        console.log('[Reminder Job] No appointments to remind');
        return;
    }

    console.log(`[Reminder Job] Found ${appointments.length} appointment(s) to remind`);

    let sent = 0;
    let failed = 0;

    for (const appt of appointments) {
        try {
            if (!appt.patient?.phone) {
                console.log(`[Reminder Job] Skip — no phone for patient: ${appt.patient?.name}`);
                continue;
            }

            await smsService.sendAppointmentReminder(appt.id);
            sent++;

            console.log(`[Reminder Job] ✅ Sent to ${appt.patient.name} | ${appt.appointmentDate.toISOString()}`);

        } catch (err) {
            failed++;
            console.error(`[Reminder Job] ❌ Failed for ${appt.patient?.name}:`, err);
        }
    }

    console.log(`[Reminder Job] Done | sent: ${sent} | failed: ${failed}`);
}

// ─── Manual trigger — test ke liye ───────────────────────────────────────────
export async function triggerReminderJobNow(): Promise<{ sent: number }> {
    console.log('[Reminder Job] Manual trigger');

    const now = new Date();
    const windowStart = new Date(now.getTime() + 23.5 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
        where: {
            status: { in: ['scheduled', 'confirmed'] },
            reminderSent: false,
            appointmentDate: { gte: windowStart, lte: windowEnd },
        },
        include: {
            patient: { select: { id: true, name: true, phone: true } },
            doctor: { select: { id: true, name: true } },
        },
    });

    let sent = 0;
    for (const appt of appointments) {
        try {
            if (!appt.patient?.phone) continue;
            await smsService.sendAppointmentReminder(appt.id);
            sent++;
        } catch (err) {
            console.error(`[Reminder Job] Failed:`, err);
        }
    }

    return { sent };
}
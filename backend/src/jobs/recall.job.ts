import cron from 'node-cron';
import { prisma } from '../db/client';
import { smsService } from '../modules/sms/sms.service';

// ─── Runs daily at 10 AM ──────────────────────────────────────────────────────
// Patients jinhe follow-up chahiye unhe recall SMS bhejo

export function startRecallJob(): void {

    // Har roz 10am: "0 10 * * *"
    cron.schedule('0 10 * * *', async () => {
        console.log('[Recall Job] Running at:', new Date().toISOString());

        try {
            await processRecalls();
        } catch (err) {
            console.error('[Recall Job] Error:', err);
        }
    });

    console.log('✅ Recall job scheduled — runs daily at 10 AM');
}

async function processRecalls(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Visit history mein jinki follow_up_days aaj ya pehle complete ho gayi
    // Aur unhe abhi tak koi naya appointment nahi mila
    const overdueVisits = await prisma.visitHistory.findMany({
        where: {
            followUpDays: { not: null, gt: 0 },
            visitDate: {
                // follow_up_days ago visit hua tha
                lte: today,
            },
        },
        include: {
            patient: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    lastMood: true,
                    crmTags: true,
                    clinicId: true,
                    lastVisitDate: true,
                    lastComplaint: true,
                },
            },
        },
        orderBy: { visitDate: 'asc' },
        take: 50, // batch size
    });

    if (overdueVisits.length === 0) {
        console.log('[Recall Job] No patients need recall today');
        return;
    }

    // Filter: jinki visit date + follow_up_days = today ya pehle
    const toRecall = overdueVisits.filter(v => {
        if (!v.followUpDays) return false;

        const followUpDate = new Date(v.visitDate);
        followUpDate.setDate(followUpDate.getDate() + v.followUpDays);
        followUpDate.setHours(0, 0, 0, 0);

        return followUpDate <= today;
    });

    // Dedup by patient — ek patient ko ek din mein sirf ek SMS
    const seen = new Set<string>();
    const unique = toRecall.filter(v => {
        if (seen.has(v.patientId)) return false;
        seen.add(v.patientId);
        return true;
    });

    // Check: koi upcoming appointment already hai?
    const patientIds = unique.map(v => v.patientId);

    const existingAppointments = await prisma.appointment.findMany({
        where: {
            patientId: { in: patientIds },
            status: { in: ['scheduled', 'confirmed'] },
            appointmentDate: { gte: today },
        },
        select: { patientId: true },
    });

    const alreadyScheduled = new Set(existingAppointments.map(a => a.patientId));

    console.log(`[Recall Job] ${unique.length} due | ${alreadyScheduled.size} already scheduled`);

    let sent = 0;
    let skipped = 0;

    for (const visit of unique) {
        // Skip agar appointment already hai
        if (alreadyScheduled.has(visit.patientId)) {
            skipped++;
            continue;
        }

        if (!visit.patient?.phone || !visit.patient?.clinicId) {
            skipped++;
            continue;
        }

        try {
            await smsService.sendRecall(visit.patientId, visit.patient.clinicId);
            sent++;

            console.log(`[Recall Job] ✅ Recall sent to ${visit.patient.name}`);

            // Small delay — rate limiting ke liye
            await sleep(200);

        } catch (err) {
            console.error(`[Recall Job] ❌ Failed for ${visit.patient.name}:`, err);
        }
    }

    console.log(`[Recall Job] Done | sent: ${sent} | skipped: ${skipped}`);
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Manual trigger ───────────────────────────────────────────────────────────
export async function triggerRecallJobNow(): Promise<{ sent: number; skipped: number }> {
    console.log('[Recall Job] Manual trigger');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueVisits = await prisma.visitHistory.findMany({
        where: {
            followUpDays: { not: null, gt: 0 },
            visitDate: { lte: today },
        },
        include: {
            patient: {
                select: {
                    id: true, name: true, phone: true,
                    clinicId: true, lastVisitDate: true, lastComplaint: true,
                },
            },
        },
        take: 50,
    });

    const toRecall = overdueVisits.filter(v => {
        if (!v.followUpDays) return false;
        const followUpDate = new Date(v.visitDate);
        followUpDate.setDate(followUpDate.getDate() + v.followUpDays);
        return followUpDate <= today;
    });

    const seen = new Set<string>();
    const unique = toRecall.filter(v => {
        if (seen.has(v.patientId)) return false;
        seen.add(v.patientId);
        return true;
    });

    const existing = await prisma.appointment.findMany({
        where: {
            patientId: { in: unique.map(v => v.patientId) },
            status: { in: ['scheduled', 'confirmed'] },
            appointmentDate: { gte: today },
        },
        select: { patientId: true },
    });

    const alreadyScheduled = new Set(existing.map(a => a.patientId));

    let sent = 0;
    let skipped = 0;

    for (const visit of unique) {
        if (alreadyScheduled.has(visit.patientId) || !visit.patient?.phone) {
            skipped++;
            continue;
        }
        try {
            await smsService.sendRecall(visit.patientId, visit.patient.clinicId);
            sent++;
        } catch (err) {
            console.error('[Recall Job]', err);
        }
    }

    return { sent, skipped };
}
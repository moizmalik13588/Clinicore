import cron from 'node-cron';
import { prisma } from '../db/client';
import { sendSms } from '../common/utils/sms.helper';
import { sendMoodReportEmail } from '../common/utils/email.helper';

// ─── Thresholds ───────────────────────────────────────────────────────────────
const ANGER_ALERT_THRESHOLD = 30; // anger > 30% → alert
const ANXIOUS_ALERT_THRESHOLD = 40; // anxious > 40% → alert

// ─── Start job ────────────────────────────────────────────────────────────────
export function startMoodReportJob(): void {
    // Daily 8am: "0 8 * * *"
    cron.schedule('0 8 * * *', async () => {
        console.log('[Mood Report Job] Running at:', new Date().toISOString());
        try {
            await generateMoodReports();
        } catch (err) {
            console.error('[Mood Report Job] Error:', err);
        }
    });

    console.log('✅ Mood report job scheduled — daily 8 AM');
}

// ─── Main function ────────────────────────────────────────────────────────────
async function generateMoodReports(): Promise<void> {
    // Yesterday range
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    console.log(`[Mood Report] Processing date: ${yesterday.toDateString()}`);

    const clinics = await prisma.clinic.findMany({
        select: { id: true, name: true, phone: true, email: true },
    });

    console.log(`[Mood Report] Processing ${clinics.length} clinic(s)`);

    for (const clinic of clinics) {
        try {
            await processClinicReport(clinic, yesterday, yesterdayEnd);
        } catch (err) {
            console.error(`[Mood Report] Clinic ${clinic.name} failed:`, err);
        }
    }
}

// ─── Per-clinic report ────────────────────────────────────────────────────────
async function processClinicReport(
    clinic: { id: string; name: string; phone: string | null; email: string | null },
    startDate: Date,
    endDate: Date,
): Promise<void> {

    // Already generated today?
    const existing = await prisma.dailyReport.findUnique({
        where: {
            clinicId_reportDate: {
                clinicId: clinic.id,
                reportDate: startDate,
            },
        },
    });

    if (existing) {
        console.log(`[Mood Report] ${clinic.name} — report already exists`);
        return;
    }

    // Calls count
    const totalCalls = await prisma.call.count({
        where: {
            clinicId: clinic.id,
            status: 'completed',
            createdAt: { gte: startDate, lte: endDate },
        },
    });

    if (totalCalls === 0) {
        console.log(`[Mood Report] ${clinic.name} — no calls yesterday`);
        return;
    }

    // Mood events
    const moodEvents = await prisma.moodEvent.findMany({
        where: {
            clinicId: clinic.id,
            createdAt: { gte: startDate, lte: endDate },
        },
        select: {
            detectedMood: true,
            intensity: true,
            escalationTriggered: true,
        },
    });

    const totalMoodEvents = moodEvents.length;

    if (totalMoodEvents === 0) {
        console.log(`[Mood Report] ${clinic.name} — no mood events yesterday`);
        return;
    }

    // Count per mood
    const counts: Record<string, number> = {
        calm: 0, frustrated: 0, angry: 0, anxious: 0, happy: 0,
    };
    for (const e of moodEvents) {
        const mood = e.detectedMood.toLowerCase();
        if (mood in counts) counts[mood]++;
    }

    const total = totalMoodEvents;
    const calmRate = Math.round((counts.calm / total) * 100);
    const angryRate = Math.round((counts.angry / total) * 100);
    const anxiousRate = Math.round((counts.anxious / total) * 100);
    const frustratedRate = Math.round((counts.frustrated / total) * 100);
    const happyRate = Math.round((counts.happy / total) * 100);
    const flaggedCalls = moodEvents.filter(e => e.escalationTriggered).length;

    // Dominant mood
    const dominantMood = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)[0][0];

    // Save to DB
    const report = await prisma.dailyReport.create({
        data: {
            clinicId: clinic.id,
            reportDate: startDate,
            totalCalls,
            totalMoodEvents: total,
            calmRate,
            angryRate,
            anxiousRate,
            frustratedRate,
            happyRate,
            flaggedCalls,
            dominantMood,
            alertSent: false,
        },
    });

    console.log(`[Mood Report] ${clinic.name} | angry:${angryRate}% | calm:${calmRate}% | flagged:${flaggedCalls}`);

    // ─── Auto-tag anxious patients ─────────────────────────────────────────────
    try {
        const { moodService } = await import('../modules/mood/mood.container');
        const tagged = await moodService.runAutoTagBatch(clinic.id);
        if (tagged.tagged > 0) {
            console.log(`[Mood Report] Auto-tagged ${tagged.tagged} patients`);
        }
    } catch (err) {
        console.error('[Mood Report] Auto-tag failed:', err);
    }

    // ─── Alert check ──────────────────────────────────────────────────────────
    const needsAlert = angryRate > ANGER_ALERT_THRESHOLD ||
        anxiousRate > ANXIOUS_ALERT_THRESHOLD;

    if (!needsAlert) return;

    console.log(`[Mood Report] ⚠️ Alert threshold exceeded — sending alerts`);

    const dateStr = startDate.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
    });

    let alertSent = false;

    // ─── SMS Alert ────────────────────────────────────────────────────────────
    if (clinic.phone) {
        try {
            await sendSms({
                to: clinic.phone,
                message: buildSmsAlert({
                    clinicName: clinic.name,
                    dateStr,
                    totalCalls,
                    angryRate,
                    anxiousRate,
                    frustratedRate,
                    calmRate,
                    flaggedCalls,
                    dominantMood,
                }),
            });
            alertSent = true;
            console.log(`[Mood Report] SMS alert sent to ${clinic.phone}`);
        } catch (err) {
            console.error('[Mood Report] SMS failed:', err);
        }
    }

    // ─── Email Alert ──────────────────────────────────────────────────────────
    if (clinic.email) {
        try {
            await sendMoodReportEmail(clinic.email, clinic.name, {
                dateStr,
                totalCalls,
                totalMoodEvents: total,
                calmRate,
                angryRate,
                anxiousRate,
                frustratedRate,
                happyRate,
                flaggedCalls,
                dominantMood,
            });
            alertSent = true;
            console.log(`[Mood Report] Email alert sent to ${clinic.email}`);
        } catch (err) {
            console.error('[Mood Report] Email failed:', err);
        }
    }

    // Update alert_sent flag
    if (alertSent) {
        await prisma.dailyReport.update({
            where: { id: report.id },
            data: { alertSent: true },
        });
    }
}

// ─── SMS alert message ────────────────────────────────────────────────────────
function buildSmsAlert(data: {
    clinicName: string;
    dateStr: string;
    totalCalls: number;
    angryRate: number;
    anxiousRate: number;
    frustratedRate: number;
    calmRate: number;
    flaggedCalls: number;
    dominantMood: string;
}): string {
    const lines = [
        `⚠️ Clinicore Mood Alert`,
        `${data.clinicName} — ${data.dateStr}`,
        ``,
        `📊 Yesterday's Report:`,
        `😡 Angry:     ${data.angryRate}%${data.angryRate > 30 ? ' ⚠️ HIGH' : ''}`,
        `😰 Anxious:   ${data.anxiousRate}%${data.anxiousRate > 40 ? ' ⚠️ HIGH' : ''}`,
        `😤 Frustrated:${data.frustratedRate}%`,
        `😊 Calm:      ${data.calmRate}%`,
        ``,
        `Total calls:  ${data.totalCalls}`,
        `Flagged:      ${data.flaggedCalls}`,
        `Dominant:     ${data.dominantMood}`,
        ``,
        `Action: Review flagged calls in dashboard.`,
    ];
    return lines.join('\n');
}

// ─── Manual trigger ───────────────────────────────────────────────────────────
export async function triggerMoodReportNow(): Promise<{
    clinicsProcessed: number;
    reportsGenerated: number;
    alertsSent: number;
}> {
    console.log('[Mood Report] Manual trigger');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const clinics = await prisma.clinic.findMany({
        select: { id: true, name: true, phone: true, email: true },
    });

    let reportsGenerated = 0;
    let alertsSent = 0;

    for (const clinic of clinics) {
        try {
            const before = await prisma.dailyReport.count({ where: { clinicId: clinic.id } });
            await processClinicReport(clinic, yesterday, yesterdayEnd);
            const after = await prisma.dailyReport.count({ where: { clinicId: clinic.id } });
            if (after > before) reportsGenerated++;
        } catch (err) {
            console.error(`[Mood Report] ${clinic.name} failed:`, err);
        }
    }

    const alerts = await prisma.dailyReport.count({
        where: { alertSent: true, reportDate: { gte: yesterday } },
    });

    return {
        clinicsProcessed: clinics.length,
        reportsGenerated,
        alertsSent: alerts,
    };
}
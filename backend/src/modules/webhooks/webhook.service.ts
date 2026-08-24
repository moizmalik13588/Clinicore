import { prisma } from '../../db/client';
import {
    ProcessCallStartedDto,
    ProcessCallEndedDto,
    ProcessTranscriptUpdateDto,
} from './webhook.types';
import { normalizePhone } from '../../common/utils/helpers';
import { env } from '../../config/env';

export class WebhookService {

    // ─── call_started ─────────────────────────────────────────────────────────
    async handleCallStarted(dto: ProcessCallStartedDto): Promise<void> {
        console.log(`[Webhook] call_started | ${dto.callId} | from: ${dto.fromNumber}`);

        const normalizedPhone = normalizePhone(dto.fromNumber || '');
        const clinicId = env.CLINIC_ID || '';

        if (!clinicId) {
            console.warn(`[Webhook] CLINIC_ID not set in .env`);
            return;
        }

        const patient = await prisma.patient.findFirst({
            where: { phone: normalizedPhone, clinicId },
        }).catch(() => null);

        await prisma.call.upsert({
            where: { retellCallId: dto.callId },
            create: {
                clinicId,
                patientId: patient?.id || null,
                retellCallId: dto.callId,
                fromNumber: normalizedPhone || null,
                toNumber: dto.toNumber || null,
                direction: dto.direction || 'inbound',
                status: 'in_progress',
                startedAt: dto.startedAt,
            },
            update: {
                status: 'in_progress',
                startedAt: dto.startedAt,
                patientId: patient?.id || null,
            },
        }).catch(err => console.error('[Webhook] Call upsert failed:', err));

        if (patient) {
            console.log(`[Webhook] Returning patient: ${patient.name}`);
        } else {
            console.log(`[Webhook] New caller: ${normalizedPhone}`);
        }
    }

    // ─── call_ended ───────────────────────────────────────────────────────────
    async handleCallEnded(dto: ProcessCallEndedDto): Promise<void> {
        console.log(`[Webhook] call_ended | ${dto.callId} | ${Math.floor(dto.durationMs / 1000)}s`);

        const call = await prisma.call.findUnique({
            where: { retellCallId: dto.callId },
        }).catch(() => null);

        if (!call) {
            console.warn(`[Webhook] Call not found: ${dto.callId}`);
            return;
        }

        await prisma.call.update({
            where: { retellCallId: dto.callId },
            data: {
                status: 'completed',
                duration: Math.floor(dto.durationMs / 1000),
                transcript: dto.transcript || null,
                endedAt: dto.endedAt,
            },
        }).catch(err => console.error('[Webhook] Call update failed:', err));

        if (call.patientId) {
            await prisma.patient.update({
                where: { id: call.patientId },
                data: {
                    lastVisitDate: dto.endedAt,
                    totalVisits: { increment: 1 },
                },
            }).catch(() => { });
        }

        // AI extraction async
        if (dto.transcript && call.clinicId) {
            setImmediate(async () => {
                try {
                    const { extractionService } = await import('../ai/extraction.service');
                    await extractionService.processCallTranscript(dto.callId, call.clinicId);
                } catch (err) {
                    console.error('[Webhook] Extraction failed:', err);
                }
            });
        }
    }

    // ─── transcript_update ────────────────────────────────────────────────────
    async handleTranscriptUpdate(dto: ProcessTranscriptUpdateDto): Promise<void> {
        const call = await prisma.call.findUnique({
            where: { retellCallId: dto.callId },
            select: { id: true, startedAt: true, clinicId: true, patientId: true },
        }).catch(() => null);

        if (!call?.startedAt) return;

        const elapsedSecs = (Date.now() - call.startedAt.getTime()) / 1000;
        if (elapsedSecs < 15) return;

        console.log(`[Webhook] transcript_update | ${dto.callId} | ${elapsedSecs.toFixed(0)}s`);
    }

    // ─── call_analyzed ────────────────────────────────────────────────────────
    async handleCallAnalyzed(callId: string, analysis: any): Promise<void> {
        if (!analysis) return;
        await prisma.call.update({
            where: { retellCallId: callId },
            data: {
                ...(analysis.user_sentiment && {
                    dominantMood: analysis.user_sentiment.toLowerCase(),
                }),
            },
        }).catch(() => { });
    }
}

export const webhookService = new WebhookService();
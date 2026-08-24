import { prisma } from '../../db/client';
import { aiService, ExtractedCallData } from './ai.service';

export class ExtractionService {

    // ─── Main: call_ended ke baad run karo ───────────────────────────────────
    async processCallTranscript(
        callId: string,
        clinicId: string,
    ): Promise<void> {

        // Call + transcript fetch karo
        const call = await prisma.call.findFirst({
            where: { retellCallId: callId, clinicId },
            select: {
                id: true,
                patientId: true,
                transcript: true,
                startedAt: true,
                endedAt: true,
            },
        });

        if (!call?.transcript) {
            console.log(`[Extraction] No transcript for call: ${callId}`);
            return;
        }

        if (!call.patientId) {
            console.log(`[Extraction] No patient for call: ${callId} — skipping`);
            return;
        }

        console.log(`[Extraction] Processing call: ${callId}`);

        // AI se extract karo
        const extracted = await aiService.extractCallData(call.transcript);

        // Visit history insert karo
        await this.insertVisitHistory(
            call.id,
            call.patientId,
            clinicId,
            call.startedAt || new Date(),
            extracted,
        );

        // Patient last_complaint update karo
        await this.updatePatientComplaint(
            call.patientId,
            extracted,
        );

        console.log(`[Extraction] Done for call: ${callId} | complaint: ${extracted.chiefComplaint}`);
    }

    // ─── Visit history DB mein insert karo ───────────────────────────────────
    private async insertVisitHistory(
        callId: string,
        patientId: string,
        clinicId: string,
        visitDate: Date,
        extracted: ExtractedCallData,
    ): Promise<void> {

        // Duplicate check — same call ke liye already insert hua?
        const existing = await prisma.visitHistory.findFirst({
            where: {
                patientId,
                clinicId,
                visitDate,
            },
        });

        if (existing) {
            console.log(`[Extraction] Visit history already exists — updating`);
            await prisma.visitHistory.update({
                where: { id: existing.id },
                data: {
                    chiefComplaint: extracted.chiefComplaint || existing.chiefComplaint,
                    diagnosis: extracted.diagnosis || existing.diagnosis,
                    treatmentNotes: extracted.notes || existing.treatmentNotes,
                    followUpDays: extracted.followUpDays || existing.followUpDays,
                },
            });
            return;
        }

        await prisma.visitHistory.create({
            data: {
                clinicId,
                patientId,
                visitDate,
                chiefComplaint: extracted.chiefComplaint || null,
                diagnosis: extracted.diagnosis || null,
                treatmentNotes: extracted.notes || null,
                followUpDays: extracted.followUpDays || null,
            },
        });

        console.log(`[Extraction] Visit history inserted for patient: ${patientId}`);
    }

    // ─── Patient last_complaint update karo ──────────────────────────────────
    private async updatePatientComplaint(
        patientId: string,
        extracted: ExtractedCallData,
    ): Promise<void> {

        const updateData: any = {};

        if (extracted.chiefComplaint) {
            updateData.lastComplaint = extracted.chiefComplaint;
        }

        if (Object.keys(updateData).length === 0) return;

        await prisma.patient.update({
            where: { id: patientId },
            data: updateData,
        });

        console.log(`[Extraction] Patient updated | complaint: ${extracted.chiefComplaint}`);
    }
}

export const extractionService = new ExtractionService();
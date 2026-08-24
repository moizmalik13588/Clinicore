import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../common/types';
import { sendSuccess } from '../../common/utils/helpers';
import { aiService } from './ai.service';
import { extractionService } from './extraction.service';
import { prisma } from '../../db/client';
import { z } from 'zod';

const extractSchema = z.object({
    transcript: z.string().min(10, 'Transcript too short'),
});

const processCallSchema = z.object({
    callId: z.string().min(1, 'callId required'),
});

export class AiController {

    // POST /ai/extract — manual transcript extract karo
    extract = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { transcript } = extractSchema.parse(req.body);
            const result = await aiService.extractCallData(transcript);
            sendSuccess(res, result, 'Extraction complete');
        } catch (err) { next(err); }
    };

    // POST /ai/process-call — call ID dalo, auto extract karo
    processCall = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { callId } = processCallSchema.parse(req.body);

            // Verify call belongs to this clinic
            const call = await prisma.call.findFirst({
                where: {
                    retellCallId: callId,
                    clinicId: req.user!.clinicId,
                },
                select: { id: true, transcript: true },
            });

            if (!call) {
                res.status(404).json({ success: false, error: 'Call not found' });
                return;
            }

            if (!call.transcript) {
                res.status(400).json({ success: false, error: 'No transcript available for this call' });
                return;
            }

            // Async mein run karo
            setImmediate(async () => {
                try {
                    await extractionService.processCallTranscript(
                        callId,
                        req.user!.clinicId,
                    );
                } catch (err) {
                    console.error('[AI Controller] processCall error:', err);
                }
            });

            sendSuccess(res, { callId, status: 'processing' }, 'Extraction started');
        } catch (err) { next(err); }
    };

    // POST /ai/summarize — transcript summary
    summarize = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { transcript } = extractSchema.parse(req.body);
            const summary = await aiService.summarizeTranscript(transcript);
            sendSuccess(res, { summary });
        } catch (err) { next(err); }
    };
}

export const aiController = new AiController();
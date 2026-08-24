import { Response, NextFunction } from 'express';
import { IMoodService } from './mood.interface';
import { AuthRequest } from '../../common/types';
import { sendSuccess } from '../../common/utils/helpers';
import { getEscalationRecord } from '../../common/utils/escalation.helper';
import { getCallStats } from '../../common/utils/tone.helper';

export class MoodController {

    constructor(private readonly service: IMoodService) { }

    // POST /mood/analyze
    analyze = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { text, callId, patientId } = req.body;
            const result = await this.service.analyzeMood(
                text, callId, patientId, req.user!.clinicId, 0,
            );
            sendSuccess(res, result, 'Mood analyzed');
        } catch (err) { next(err); }
    };

    // GET /mood/call/:callId
    getCallMood = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getMoodForCall(
                req.params.callId, req.user!.clinicId,
            );
            sendSuccess(res, result);
        } catch (err) { next(err); }
    };

    // GET /mood/trends?range=7d|30d|90d
    getTrends = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getMoodTrends(
                req.user!.clinicId, req.query as any,
            );
            sendSuccess(res, result);
        } catch (err) { next(err); }
    };

    // GET /mood/patient/:patientId
    getPatientMood = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getPatientMoodHistory(
                req.params.patientId, req.user!.clinicId,
            );
            sendSuccess(res, result);
        } catch (err) { next(err); }
    };

    // GET /mood
    listEvents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.listEvents(
                req.user!.clinicId, req.query as any,
            );
            res.status(200).json({ success: true, ...result });
        } catch (err) { next(err); }
    };

    // POST /mood/auto-tag — batch auto-tag all patients
    runAutoTag = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.runAutoTagBatch(req.user!.clinicId);
            sendSuccess(res, result, `Auto-tag complete — ${result.tagged} patient(s) tagged`);
        } catch (err) { next(err); }
    };

    // GET /mood/debug/call/:callId
    debugCall = (req: AuthRequest, res: Response, next: NextFunction): void => {
        try {
            const escalation = getEscalationRecord(req.params.callId);
            const tone = getCallStats(req.params.callId);
            sendSuccess(res, {
                callId: req.params.callId,
                escalation: escalation || 'No record',
                tone: tone || 'No record',
            });
        } catch (err) { next(err); }
    };
}
import { Response, NextFunction } from 'express';
import { ICrmService } from './crm.interface';
import { AuthRequest } from '../../common/types';
import { sendSuccess } from '../../common/utils/helpers';

export class CrmController {

    constructor(private readonly service: ICrmService) { }

    // GET /crm/patient?phone=+923xx
    lookupByPhone = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { phone } = req.query as { phone: string };
            const result = await this.service.lookupByPhone(phone, req.user!.clinicId);

            if (!result) {
                sendSuccess(res, null, 'Patient not found — new patient');
                return;
            }

            sendSuccess(res, result);
        } catch (err) { next(err); }
    };

    // GET /crm/patient/:id/history
    getHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getPatientHistory(
                req.params.id, req.user!.clinicId,
            );
            sendSuccess(res, result);
        } catch (err) { next(err); }
    };

    // GET /crm/patient/:id/mood-log
    getMoodLog = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getPatientMoodLog(
                req.params.id, req.user!.clinicId,
            );
            sendSuccess(res, result);
        } catch (err) { next(err); }
    };

    // POST /crm/visit
    createVisit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.createVisit(req.user!.clinicId, req.body);
            sendSuccess(res, result, 'Visit recorded', 201);
        } catch (err) { next(err); }
    };

    // GET /crm/search?q=name|phone|tag
    search = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.search(req.user!.clinicId, req.query as any);
            res.status(200).json({ success: true, ...result });
        } catch (err) { next(err); }
    };
}
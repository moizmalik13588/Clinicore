import { Response, NextFunction } from 'express';
import { ICallsService } from './calls.interface';
import { AuthRequest } from '../../common/types';
import { sendSuccess } from '../../common/utils/helpers';

export class CallsController {

    constructor(private readonly service: ICallsService) { }

    list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.list(req.user!.clinicId, req.query as any);
            res.status(200).json({ success: true, ...result });
        } catch (err) { next(err); }
    };

    getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getById(req.params.id, req.user!.clinicId);
            sendSuccess(res, result);
        } catch (err) { next(err); }
    };

    // GET /calls/:id/mood-timeline
    getMoodTimeline = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getWithMoodTimeline(
                req.params.id,
                req.user!.clinicId,
            );
            sendSuccess(res, result);
        } catch (err) { next(err); }
    };

    // POST /calls/:id/compute-mood
    computeMood = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.computeMoodSummary(
                req.params.id,
                req.user!.clinicId,
            );
            sendSuccess(res, result, 'Mood summary computed and saved');
        } catch (err) { next(err); }
    };

    create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.create(req.user!.clinicId, req.body);
            sendSuccess(res, result, 'Call created', 201);
        } catch (err) { next(err); }
    };

    update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.update(req.params.id, req.user!.clinicId, req.body);
            sendSuccess(res, result, 'Call updated');
        } catch (err) { next(err); }
    };
}
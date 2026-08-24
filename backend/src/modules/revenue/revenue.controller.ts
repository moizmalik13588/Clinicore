import { Response, NextFunction } from 'express';
import { IRevenueService } from './revenue.interface';
import { AuthRequest } from '../../common/types';
import { sendSuccess } from '../../common/utils/helpers';

export class RevenueController {

    constructor(private readonly service: IRevenueService) { }

    // POST /revenue
    create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.create(req.user!.clinicId, req.body);
            sendSuccess(res, result, 'Revenue event recorded', 201);
        } catch (err) { next(err); }
    };

    // GET /revenue
    list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.list(req.user!.clinicId, req.query as any);
            res.status(200).json({ success: true, ...result });
        } catch (err) { next(err); }
    };

    // GET /revenue/stats?range=30d
    getStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getStats(
                req.user!.clinicId,
                req.query as any,
            );
            sendSuccess(res, result);
        } catch (err) { next(err); }
    };

    // DELETE /revenue/:id
    delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.service.delete(req.params.id, req.user!.clinicId);
            sendSuccess(res, null, 'Revenue event deleted');
        } catch (err) { next(err); }
    };
}
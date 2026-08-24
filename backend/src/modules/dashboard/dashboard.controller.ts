import { Response, NextFunction } from 'express';
import { IDashboardService } from './dashboard.interface';
import { AuthRequest } from '../../common/types';
import { sendSuccess } from '../../common/utils/helpers';
import { prisma } from '../../db/client';

export class DashboardController {

    constructor(private readonly service: IDashboardService) { }

    // GET /dashboard/stats
    getStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getStats(req.user!.clinicId);
            sendSuccess(res, result);
        } catch (err) { next(err); }
    };

    // GET /dashboard/revenue
    getRevenue = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getRevenue(req.user!.clinicId);
            sendSuccess(res, result);
        } catch (err) { next(err); }
    };

    // GET /dashboard/timeline
    getTimeline = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getTimeline(req.user!.clinicId);
            sendSuccess(res, result);
        } catch (err) { next(err); }
    };

    // GET /dashboard/overview — sab ek call mein
    getOverview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getOverview(req.user!.clinicId);
            sendSuccess(res, result);
        } catch (err) { next(err); }
    };

    // Existing controller mein add karo:

    // GET /dashboard/reports
    getDailyReports = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { limit = '30' } = req.query as { limit?: string };

            const reports = await prisma.dailyReport.findMany({
                where: { clinicId: req.user!.clinicId },
                orderBy: { reportDate: 'desc' },
                take: parseInt(limit),
            });

            sendSuccess(res, reports);
        } catch (err) { next(err); }
    };
}
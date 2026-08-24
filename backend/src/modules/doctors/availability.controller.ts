import { Response, NextFunction } from 'express';
import { availabilityService } from './availability.service';
import { AuthRequest } from '../../common/types';
import { sendSuccess } from '../../common/utils/helpers';

export class AvailabilityController {

    list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await availabilityService.list(req.query as any);
            sendSuccess(res, result);
        } catch (err) { next(err); }
    };

    // ─── doctorId string — parseInt hataya ───────────────────────────────────
    getByDoctor = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await availabilityService.getByDoctor(req.params.doctorId);
            sendSuccess(res, result);
        } catch (err) { next(err); }
    };

    getSlots = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { date } = req.query as { date: string };
            if (!date) {
                res.status(400).json({ success: false, error: 'date query param required (YYYY-MM-DD)' });
                return;
            }
            const result = await availabilityService.getAvailableSlots(req.params.doctorId, date);
            sendSuccess(res, { date, slots: result, total: result.length });
        } catch (err) { next(err); }
    };

    create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await availabilityService.create(req.body);
            sendSuccess(res, result, 'Availability created', 201);
        } catch (err) { next(err); }
    };

    // ─── doctorId string — parseInt hataya ───────────────────────────────────
    bulkCreate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await availabilityService.bulkCreate(
                req.params.doctorId,
                req.body.schedules,
            );
            sendSuccess(res, result, 'Availability schedule set', 201);
        } catch (err) { next(err); }
    };

    update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await availabilityService.update(req.params.id, req.body);
            sendSuccess(res, result, 'Availability updated');
        } catch (err) { next(err); }
    };

    delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            await availabilityService.delete(req.params.id);
            sendSuccess(res, null, 'Availability deleted');
        } catch (err) { next(err); }
    };
}

export const availabilityController = new AvailabilityController();
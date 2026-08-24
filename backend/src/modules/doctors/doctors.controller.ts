import { Response, NextFunction } from 'express';
import { IDoctorsService } from './doctors.interface';
import { AuthRequest } from '../../common/types';
import { sendSuccess } from '../../common/utils/helpers';

export class DoctorsController {

    constructor(private readonly service: IDoctorsService) { }

    list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.list(req.user!.clinicId, req.query as any);
            res.status(200).json({ success: true, ...result });
        } catch (err) { next(err); }
    };

    getActive = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getActive(req.user!.clinicId);
            sendSuccess(res, result);
        } catch (err) { next(err); }
    };

    getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getById(req.params.id, req.user!.clinicId);
            sendSuccess(res, result);
        } catch (err) { next(err); }
    };

    create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.create(req.user!.clinicId, req.body);
            sendSuccess(res, result, 'Doctor created', 201);
        } catch (err) { next(err); }
    };

    update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.update(req.params.id, req.user!.clinicId, req.body);
            sendSuccess(res, result, 'Doctor updated');
        } catch (err) { next(err); }
    };

    deactivate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.deactivate(req.params.id, req.user!.clinicId);
            sendSuccess(res, result, 'Doctor deactivated');
        } catch (err) { next(err); }
    };
}
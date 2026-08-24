import { Response, NextFunction } from 'express';
import { IAppointmentsService } from './appointments.interface';
import { AuthRequest } from '../../common/types';
import { sendSuccess } from '../../common/utils/helpers';

export class AppointmentsController {

    constructor(private readonly service: IAppointmentsService) { }

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

    create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.create(req.user!.clinicId, req.body);
            sendSuccess(res, result, 'Appointment created', 201);
        } catch (err) { next(err); }
    };

    update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.update(req.params.id, req.user!.clinicId, req.body);
            sendSuccess(res, result, 'Appointment updated');
        } catch (err) { next(err); }
    };

    delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.service.delete(req.params.id, req.user!.clinicId);
            sendSuccess(res, null, 'Appointment deleted');
        } catch (err) { next(err); }
    };
}
import { Response, NextFunction } from 'express';
import { clinicsService } from './clinics.service';
import { AuthRequest } from '../../common/types';
import { sendSuccess } from '../../common/utils/helpers';

export class ClinicsController {

    // POST /clinics/create-agent
    createAgent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await clinicsService.createAgent(req.user!.clinicId, {
                voiceId: req.body.voiceId || '11labs-Adrian',
                agentName: req.body.agentName || 'Clinicore Assistant',
                beginMessage: req.body.beginMessage,
            });
            sendSuccess(res, result, 'Retell agent created', 201);
        } catch (err) { next(err); }
    };

    // GET /clinics/agent
    getAgent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await clinicsService.getAgent(req.user!.clinicId);
            sendSuccess(res, result);
        } catch (err) { next(err); }
    };

    // GET /clinics/health
    healthCheck = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await clinicsService.healthCheck(req.user!.clinicId);
            sendSuccess(res, result);
        } catch (err) { next(err); }
    };

    // GET /clinics/me
    getClinic = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await clinicsService.getClinic(req.user!.clinicId);
            sendSuccess(res, result);
        } catch (err) { next(err); }
    };

    // PUT /clinics/me
    updateClinic = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await clinicsService.updateClinic(req.user!.clinicId, req.body);
            sendSuccess(res, result, 'Clinic updated');
        } catch (err) { next(err); }
    };
}

export const clinicsController = new ClinicsController();
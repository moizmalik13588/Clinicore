import { Response, NextFunction } from 'express';
import { smsService } from './sms.service';
import { AuthRequest } from '../../common/types';
import { sendSuccess } from '../../common/utils/helpers';
import { z } from 'zod';

const sendCustomSchema = z.object({
    to: z.string().min(7, 'Valid phone required'),
    message: z.string().min(1, 'Message required').max(1600),
});

const sendAppointmentSmsSchema = z.object({
    appointmentId: z.string().uuid(),
    type: z.enum(['confirmation', 'reminder', 'cancellation']),
});

export class SmsController {

    // POST /sms/send
    sendCustom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { to, message } = sendCustomSchema.parse(req.body);
            const result = await smsService.sendCustom(to, message);
            sendSuccess(res, result, result.success ? 'SMS sent' : 'SMS failed');
        } catch (err) { next(err); }
    };

    // POST /sms/appointment
    sendAppointmentSms = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { appointmentId, type } = sendAppointmentSmsSchema.parse(req.body);

            if (type === 'confirmation') {
                await smsService.sendAppointmentConfirmation(appointmentId);
            } else if (type === 'reminder') {
                await smsService.sendAppointmentReminder(appointmentId);
            }

            sendSuccess(res, null, `${type} SMS sent`);
        } catch (err) { next(err); }
    };

    // POST /sms/welcome/:patientId
    sendWelcome = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            await smsService.sendWelcome(req.params.patientId, req.user!.clinicId);
            sendSuccess(res, null, 'Welcome SMS sent');
        } catch (err) { next(err); }
    };

    // POST /sms/recall/:patientId
    sendRecall = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            await smsService.sendRecall(req.params.patientId, req.user!.clinicId);
            sendSuccess(res, null, 'Recall SMS sent');
        } catch (err) { next(err); }
    };
}

export const smsController = new SmsController();
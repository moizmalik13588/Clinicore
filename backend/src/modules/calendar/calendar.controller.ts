import { Request, Response, NextFunction } from 'express';
import { calendarService } from './calendar.service';
import { AuthRequest } from '../../common/types';
import { sendSuccess } from '../../common/utils/helpers';

export class CalendarController {

    // GET /auth/google → OAuth redirect
    initiateOAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const url = calendarService.getAuthUrl();
            res.redirect(url);
        } catch (err) { next(err); }
    };

    // GET /auth/google/callback
    handleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { code, state } = req.query as { code: string; state?: string };

            if (!code) {
                res.status(400).json({ success: false, error: 'No authorization code received' });
                return;
            }

            // clinicId state se lo ya env se
            const clinicId = state || process.env.CLINIC_ID || '';

            if (!clinicId) {
                res.status(400).json({ success: false, error: 'No clinicId found' });
                return;
            }

            await calendarService.handleCallback(code, clinicId);

            // Dashboard pe redirect karo
            res.redirect(`${process.env.DASHBOARD_URL}/setup?calendar=connected`);
        } catch (err) { next(err); }
    };

    // GET /calendar/status
    getStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const connected = await calendarService.isConnected(req.user!.clinicId);
            sendSuccess(res, {
                connected,
                message: connected
                    ? 'Google Calendar is connected'
                    : 'Google Calendar not connected. Visit /auth/google to authorize.',
            });
        } catch (err) { next(err); }
    };
}

export const calendarController = new CalendarController();
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../common/types';
import { sendSuccess } from '../../common/utils/helpers';
import {
    triggerReminderJobNow,
    triggerMoodReportNow,
    triggerRecallJobNow,
} from '../../jobs';

export class JobsController {

    // POST /jobs/trigger/reminders
    triggerReminders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await triggerReminderJobNow();
            sendSuccess(res, result, `Reminder job done — sent: ${result.sent}`);
        } catch (err) { next(err); }
    };

    // POST /jobs/trigger/mood-report
    triggerMoodReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await triggerMoodReportNow();
            sendSuccess(res, result, `Mood report done | reports: ${result.reportsGenerated} | alerts: ${result.alertsSent}`);
        } catch (err) { next(err); }
    };

    // POST /jobs/trigger/recall
    triggerRecall = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await triggerRecallJobNow();
            sendSuccess(res, result, `Recall done — sent: ${result.sent} | skipped: ${result.skipped}`);
        } catch (err) { next(err); }
    };
}

export const jobsController = new JobsController();
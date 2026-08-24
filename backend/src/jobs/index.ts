import { startReminderJob } from './reminder.job';
import { startMoodReportJob } from './mood.report.job';
import { startRecallJob } from './recall.job';

export function startAllJobs(): void {
    console.log('\n[Jobs] Starting background jobs...');

    startReminderJob();
    startMoodReportJob();
    startRecallJob();

    console.log('[Jobs] All background jobs started ✅\n');
}

// Re-export manual triggers for test endpoints
export {
    triggerReminderJobNow,
} from './reminder.job';

export {
    triggerMoodReportNow,
} from './mood.report.job';

export {
    triggerRecallJobNow,
} from './recall.job';
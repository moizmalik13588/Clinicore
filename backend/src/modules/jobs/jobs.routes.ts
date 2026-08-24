import { Router } from 'express';
import { jobsController } from './jobs.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// POST /jobs/trigger/reminders   ← manual trigger test ke liye
router.post('/trigger/reminders', jobsController.triggerReminders);
// POST /jobs/trigger/mood-report
router.post('/trigger/mood-report', jobsController.triggerMoodReport);
// POST /jobs/trigger/recall
router.post('/trigger/recall', jobsController.triggerRecall);

export default router;
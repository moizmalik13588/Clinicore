import { Router } from 'express';
import { calendarController } from './calendar.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';

const router = Router();

// GET /calendar/status
router.get('/status', authMiddleware, calendarController.getStatus);

export default router;  
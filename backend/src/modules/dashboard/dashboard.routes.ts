import { Router } from 'express';
import { dashboardController } from './dashboard.container';
import { authMiddleware } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/overview', dashboardController.getOverview);
router.get('/stats', dashboardController.getStats);
router.get('/revenue', dashboardController.getRevenue);
router.get('/timeline', dashboardController.getTimeline);
router.get('/reports', dashboardController.getDailyReports);   // ← new

export default router;
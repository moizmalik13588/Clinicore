import { Router } from 'express';
import { revenueController } from './revenue.container';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { validate } from '../../common/middleware/validate.middleware';
import {
    createRevenueSchema,
    listRevenueSchema,
    revenueStatsSchema,
} from './revenue.schema';

const router = Router();
router.use(authMiddleware);

// GET  /revenue/stats?range=30d
router.get('/stats', validate(revenueStatsSchema, 'query'), revenueController.getStats);
// GET  /revenue
router.get('/', validate(listRevenueSchema, 'query'), revenueController.list);
// POST /revenue
router.post('/', validate(createRevenueSchema), revenueController.create);
// DELETE /revenue/:id
router.delete('/:id', revenueController.delete);

export default router;
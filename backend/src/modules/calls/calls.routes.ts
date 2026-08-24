import { Router } from 'express';
import { callsController } from './calls.container';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { validate } from '../../common/middleware/validate.middleware';
import {
  createCallSchema,
  updateCallSchema,
  listCallsSchema,
} from './calls.schema';

const router = Router();
router.use(authMiddleware);

// GET  /calls
router.get('/', validate(listCallsSchema, 'query'), callsController.list);
// GET  /calls/:id               ← basic + transcript
router.get('/:id', callsController.getById);
// GET  /calls/:id/mood-timeline ← full mood timeline
router.get('/:id/mood-timeline', callsController.getMoodTimeline);
// POST /calls/:id/compute-mood  ← compute + save dominant mood
router.post('/:id/compute-mood', callsController.computeMood);
// POST /calls
router.post('/', validate(createCallSchema), callsController.create);
// PUT  /calls/:id
router.put('/:id', validate(updateCallSchema), callsController.update);

export default router;
import { Router, Response, NextFunction } from 'express';
import { moodController } from './mood.container';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { validate } from '../../common/middleware/validate.middleware';
import { AuthRequest } from '../../common/types';
import {
  analyzeMoodSchema,
  moodTrendsSchema,
  listMoodEventsSchema,
} from './mood.schema';

const router = Router();
router.use(authMiddleware);

// POST /mood/analyze            ← text dalo, mood pao + save
router.post('/analyze', validate(analyzeMoodSchema), moodController.analyze);

// GET  /mood/trends?range=7d    ← clinic-wide daily trend chart
router.get('/trends', validate(moodTrendsSchema, 'query'), moodController.getTrends);

// GET  /mood/call/:callId       ← call ki full mood timeline
router.get('/call/:callId', moodController.getCallMood);

// GET  /mood/patient/:patientId ← patient ka mood history
router.get('/patient/:patientId', moodController.getPatientMood);

// POST /mood/auto-tag           ← batch: anxious patients ko tag karo
router.post('/auto-tag', moodController.runAutoTag);

// GET  /mood/debug/call/:callId ← escalation + tone debug info
router.get('/debug/call/:callId', moodController.debugCall);

// GET  /mood                    ← list all mood events
router.get('/', validate(listMoodEventsSchema, 'query'), moodController.listEvents);

export default router;
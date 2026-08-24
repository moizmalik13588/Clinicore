import { Router } from 'express';
import { aiController } from './ai.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// POST /ai/extract      ← transcript dalo, extracted data pao
router.post('/extract', aiController.extract);
// POST /ai/process-call ← callId dalo, auto extract + save karo
router.post('/process-call', aiController.processCall);
// POST /ai/summarize    ← transcript summary
router.post('/summarize', aiController.summarize);

export default router;
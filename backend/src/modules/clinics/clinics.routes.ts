import { Router } from 'express';
import { clinicsController } from './clinics.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { validate } from '../../common/middleware/validate.middleware';
import {
    createAgentSchema,
    updateClinicSchema,
} from './clinics.schema';

const router = Router();
router.use(authMiddleware);

// GET  /clinics/me          ← clinic info
router.get('/me', clinicsController.getClinic);
// PUT  /clinics/me          ← clinic update
router.put('/me', validate(updateClinicSchema), clinicsController.updateClinic);
// POST /clinics/create-agent ← Retell agent banao
router.post('/create-agent', validate(createAgentSchema), clinicsController.createAgent);
// GET  /clinics/agent        ← agent info
router.get('/agent', clinicsController.getAgent);
// GET  /clinics/health       ← system health
router.get('/health', clinicsController.healthCheck);

export default router;
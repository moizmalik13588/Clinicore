import { Router } from 'express';
import { crmController } from './crm.container';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { validate } from '../../common/middleware/validate.middleware';
import {
  phoneLookupSchema,
  createVisitSchema,
  crmSearchSchema,
} from './crm.schema';

const router = Router();
router.use(authMiddleware);

// GET  /crm/patient?phone=+923xx  ← phone lookup <100ms
router.get('/patient', validate(phoneLookupSchema, 'query'), crmController.lookupByPhone);
// GET  /crm/patient/:id/history
router.get('/patient/:id/history', crmController.getHistory);
// GET  /crm/patient/:id/mood-log
router.get('/patient/:id/mood-log', crmController.getMoodLog);
// POST /crm/visit
router.post('/visit', validate(createVisitSchema), crmController.createVisit);
// GET  /crm/search?q=ahmed
router.get('/search', validate(crmSearchSchema, 'query'), crmController.search);

export default router;
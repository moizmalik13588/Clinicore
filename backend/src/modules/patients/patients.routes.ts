import { Router } from 'express';
import { patientsController } from './patients.container';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { validate } from '../../common/middleware/validate.middleware';
import {
  createPatientSchema,
  updatePatientSchema,
  listPatientsSchema,
} from './patients.schema';

const router = Router();
router.use(authMiddleware);

// GET  /patients?search=ahmed&tag=VIP&mood=calm
router.get('/', validate(listPatientsSchema, 'query'), patientsController.list);
// GET  /patients/:id
router.get('/:id', patientsController.getById);
// POST /patients
router.post('/', validate(createPatientSchema), patientsController.create);
// PUT  /patients/:id
router.put('/:id', validate(updatePatientSchema), patientsController.update);
// DELETE /patients/:id
router.delete('/:id', patientsController.delete);

export default router;
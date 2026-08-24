import { Router } from 'express';
import { appointmentsController } from './appointments.container';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { validate } from '../../common/middleware/validate.middleware';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  listAppointmentsSchema,
} from './appointments.schema';

const router = Router();

router.use(authMiddleware);

// GET  /appointments?range=today|7days|30days|all&status=scheduled&doctorId=uuid
router.get('/', validate(listAppointmentsSchema, 'query'), appointmentsController.list);
// GET  /appointments/:id
router.get('/:id', appointmentsController.getById);
// POST /appointments
router.post('/', validate(createAppointmentSchema), appointmentsController.create);
// PUT  /appointments/:id
router.put('/:id', validate(updateAppointmentSchema), appointmentsController.update);
// DELETE /appointments/:id
router.delete('/:id', appointmentsController.delete);

export default router;
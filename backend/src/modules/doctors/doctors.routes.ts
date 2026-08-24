import { Router } from 'express';
import { doctorsController } from './doctors.container';
import { availabilityController } from './availability.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { validate } from '../../common/middleware/validate.middleware';
import {
  createDoctorSchema,
  updateDoctorSchema,
  listDoctorsSchema,
  createAvailabilitySchema,
  updateAvailabilitySchema,
  listAvailabilitySchema,
} from './doctors.schema';

const router = Router();
router.use(authMiddleware);

// ─── Doctors ──────────────────────────────────────────────────────────────────
router.get('/', validate(listDoctorsSchema, 'query'), doctorsController.list);
router.get('/active', doctorsController.getActive);

// ─── Availability (before /:id to avoid conflicts) ───────────────────────────
router.get('/availability',
  validate(listAvailabilitySchema, 'query'),
  availabilityController.list,
);
router.post('/availability',
  validate(createAvailabilitySchema),
  availabilityController.create,
);
router.put('/availability/:id',
  validate(updateAvailabilitySchema),
  availabilityController.update,
);
router.delete('/availability/:id',
  availabilityController.delete,
);

// ─── Doctor by ID ─────────────────────────────────────────────────────────────
router.get('/:id', doctorsController.getById);
router.post('/', validate(createDoctorSchema), doctorsController.create);
router.put('/:id', validate(updateDoctorSchema), doctorsController.update);
router.patch('/:id/deactivate', doctorsController.deactivate);

// ─── Doctor-specific availability ─────────────────────────────────────────────
router.get('/:doctorId/availability', availabilityController.getByDoctor);
router.get('/:doctorId/slots', availabilityController.getSlots);
router.post('/:doctorId/availability/bulk', availabilityController.bulkCreate);

export default router;
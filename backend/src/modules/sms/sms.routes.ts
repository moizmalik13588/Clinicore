import { Router } from 'express';
import { smsController } from './sms.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// POST /sms/send                    ← custom SMS
router.post('/send', smsController.sendCustom);
// POST /sms/appointment              ← appointment SMS (confirmation/reminder)
router.post('/appointment', smsController.sendAppointmentSms);
// POST /sms/welcome/:patientId       ← welcome SMS
router.post('/welcome/:patientId', smsController.sendWelcome);
// POST /sms/recall/:patientId        ← recall SMS
router.post('/recall/:patientId', smsController.sendRecall);

export default router;
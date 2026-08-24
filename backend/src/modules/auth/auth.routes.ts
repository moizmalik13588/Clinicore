import { Router } from 'express';
import { authController } from './auth.container';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { authRateLimit } from '../../common/middleware/rate-limit.middleware';
import { validate } from '../../common/middleware/validate.middleware';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
} from './auth.schema';

const router = Router();

router.post('/register', authRateLimit, validate(registerSchema), authController.register);
router.post('/verify-otp', authRateLimit, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/login', authRateLimit, validate(loginSchema), authController.login);
router.post('/verify-login-otp', authRateLimit, validate(verifyOtpSchema), authController.verifyLoginOtp);
router.post('/resend-otp', authRateLimit, validate(resendOtpSchema), authController.resendOtp);
router.post('/refresh', authController.refresh);
router.post('/logout', authMiddleware, authController.logout);
router.post('/logout-all-devices', authMiddleware, authController.logoutAllDevices);
router.get('/me', authMiddleware, authController.me);

export default router;
import { Request, Response, NextFunction } from 'express';
import { IAuthService } from './auth.interface';
import { AuthRequest } from '../../common/types';
import { sendSuccess } from '../../common/utils/helpers';

export class AuthController {

    // ─── Dependency Injection ─────────────────────────────────────────────────
    constructor(private readonly authService: IAuthService) { }

    // ─── POST /auth/register ──────────────────────────────────────────────────
    register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.authService.register(req.body);
            sendSuccess(res, result, result.message, 201);
        } catch (err) {
            next(err);
        }
    };

    // ─── POST /auth/verify-otp ────────────────────────────────────────────────
    verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.authService.verifyOtp(req.body, res);
            sendSuccess(res, result, 'Email verified successfully');
        } catch (err) {
            next(err);
        }
    };

    // ─── POST /auth/login ─────────────────────────────────────────────────────
    login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.authService.login(req.body);
            sendSuccess(res, result, result.message);
        } catch (err) {
            next(err);
        }
    };

    // ─── POST /auth/verify-login-otp ──────────────────────────────────────────
    verifyLoginOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.authService.verifyLoginOtp(req.body, res);
            sendSuccess(res, result, 'Login successful');
        } catch (err) {
            next(err);
        }
    };

    // ─── POST /auth/resend-otp ────────────────────────────────────────────────
    resendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.authService.resendOtp(
                req.body.userId,
                req.body.type,
            );
            sendSuccess(res, result, result.message);
        } catch (err) {
            next(err);
        }
    };

    // ─── POST /auth/refresh ───────────────────────────────────────────────────
    refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const token = req.cookies?.refresh_token || req.body?.refreshToken;
            const result = await this.authService.refresh(token, res);
            sendSuccess(res, result, 'Token refreshed');
        } catch (err) {
            next(err);
        }
    };

    // ─── POST /auth/logout ────────────────────────────────────────────────────
    logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const plainRefreshToken =
                req.cookies?.refresh_token || req.body?.refreshToken;
            await this.authService.logout(req.user!.userId, plainRefreshToken, res);
            sendSuccess(res, null, 'Logged out successfully');
        } catch (err) {
            next(err);
        }
    };

    // ─── POST /auth/logout-all-devices ────────────────────────────────────────
    logoutAllDevices = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.authService.logoutAllDevices(req.user!.userId, res);
            sendSuccess(res, result, `Logged out from all devices`);
        } catch (err) {
            next(err);
        }
    };

    // ─── GET /auth/me ─────────────────────────────────────────────────────────
    me = (req: AuthRequest, res: Response, next: NextFunction): void => {
        try {
            sendSuccess(res, { user: req.user });
        } catch (err) {
            next(err);
        }
    };
}
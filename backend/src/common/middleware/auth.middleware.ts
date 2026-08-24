import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError } from '../errors/app.error';
import { AuthRequest } from '../types';

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    // Pehle cookie check karo, phir Authorization header (Postman ke liye)
    const token =
      req.cookies?.access_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      throw new UnauthorizedError('Access token required');
    }

    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}

export function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const token =
      req.cookies?.access_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (token) {
      req.user = verifyAccessToken(token);
    }
  } catch {
    // silently ignore
  }
  next();
}
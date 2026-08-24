import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env';
import { JwtPayload, UserRole } from '../types';

// ─── Access Token — 7 days ──────────────────────────────────────────────────────
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d',
  } as jwt.SignOptions);
}

// ─── Verify Access Token ──────────────────────────────────────────────────────
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

// ─── Decode without verify ────────────────────────────────────────────────────
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

// ─── Refresh Token — plain random (user ko milta hai) ────────────────────────
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

// ─── OTP — 6 digit ───────────────────────────────────────────────────────────
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── SHA-256 Hash — DB mein store hota hai ───────────────────────────────────
export function hashToken(plainToken: string): string {
  return crypto.createHash('sha256').update(plainToken).digest('hex');
}

// ─── Cookie Options ───────────────────────────────────────────────────────────
export const accessTokenCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/auth/refresh',
};

export const clearAccessTokenOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
};

export const clearRefreshTokenOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/auth/refresh',
};
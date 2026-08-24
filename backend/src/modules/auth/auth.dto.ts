import { z } from 'zod';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
} from './auth.schema';
import { OtpType, UserRole } from '@prisma/client';


// ─── Request DTOs (inferred from Zod schemas) ─────────────────────────────────
export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
export type ResendOtpDto = z.infer<typeof resendOtpSchema>;

// ─── Internal DTOs ────────────────────────────────────────────────────────────
export interface CreateUserDto {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  clinicId: string;
  isVerified: boolean;
}

export interface CreateClinicDto {
  name: string;
  email: string;
}

export interface CreateOtpDto {
  userId: string;
  otpHash: string;
  type: OtpType;
  expiresAt: Date;
}

export interface CreateRefreshTokenDto {
  token: string;
  userId: string;
  expiresAt: Date;
}
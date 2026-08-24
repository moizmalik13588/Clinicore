import { z } from 'zod';
import { OtpType } from '@prisma/client';

export const registerSchema = z.object({
    email: z.string().email('Valid email required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name required'),
    clinicName: z.string().min(2, 'Clinic name required'),
});

export const loginSchema = z.object({
    email: z.string().email('Valid email required'),
    password: z.string().min(1, 'Password required'),
});

export const verifyOtpSchema = z.object({
    userId: z.string().uuid('Valid userId required'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const resendOtpSchema = z.object({
    userId: z.string().uuid('Valid userId required'),
    type: z.nativeEnum(OtpType).default(OtpType.email_verify),
});
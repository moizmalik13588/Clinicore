import { Response } from 'express';
import { User, Clinic, Otp, RefreshToken, OtpType } from '@prisma/client';
import {
    RegisterDto,
    LoginDto,
    VerifyOtpDto,
    CreateUserDto,
    CreateClinicDto,
    CreateOtpDto,
    CreateRefreshTokenDto,
} from './auth.dto';
import {
    AuthTokensResponse,
    RegisterResponse,
    LoginResponse,
    RefreshResponse,
    ResendOtpResponse,
    LogoutAllResponse,
} from './auth.response';

// ─── Repository Interface ─────────────────────────────────────────────────────
// Sirf function signatures — koi implementation nahi
export interface IAuthRepository {
    findUserByEmail(email: string): Promise<(User & { clinic: Clinic }) | null>;
    findUserById(id: string): Promise<(User & { clinic: Clinic }) | null>;
    createClinic(dto: CreateClinicDto): Promise<Clinic>;
    createUser(dto: CreateUserDto): Promise<User>;
    createClinicAndUser(
        clinicDto: CreateClinicDto,
        userDto: Omit<CreateUserDto, 'clinicId'>,
    ): Promise<{ clinic: Clinic; user: User }>;
    markUserVerified(userId: string): Promise<void>;
    findOtp(userId: string, otpHash: string, type: OtpType): Promise<Otp | null>;
    createOtp(dto: CreateOtpDto): Promise<void>;
    deleteOtp(id: string): Promise<void>;
    deleteOtpsByUserAndType(userId: string, type: OtpType): Promise<void>;
    createRefreshToken(dto: CreateRefreshTokenDto): Promise<void>;
    findRefreshToken(hashedToken: string): Promise<(RefreshToken & { user: User & { clinic: Clinic } }) | null>;
    deleteRefreshToken(id: string): Promise<void>;
    deleteRefreshTokensByUser(userId: string): Promise<number>;
    deleteRefreshTokenByUserAndHash(userId: string, hashedToken: string): Promise<number>;
}

// ─── Service Interface ────────────────────────────────────────────────────────
// Sirf function signatures — koi implementation nahi
export interface IAuthService {
    register(dto: RegisterDto): Promise<RegisterResponse>;
    verifyOtp(dto: VerifyOtpDto, res: Response): Promise<AuthTokensResponse>;
    login(dto: LoginDto): Promise<LoginResponse>;
    verifyLoginOtp(dto: VerifyOtpDto, res: Response): Promise<AuthTokensResponse>;
    resendOtp(userId: string, type: OtpType): Promise<ResendOtpResponse>;
    refresh(plainRefreshToken: string | undefined, res: Response): Promise<RefreshResponse>;
    logout(userId: string, plainRefreshToken: string | undefined, res: Response): Promise<void>;
    logoutAllDevices(userId: string, res: Response): Promise<LogoutAllResponse>;
}
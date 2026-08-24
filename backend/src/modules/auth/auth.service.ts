import bcrypt from 'bcryptjs';
import { Response } from 'express';
import { IAuthRepository, IAuthService } from './auth.interface';
import { AuthMapper } from './auth.mapper';
import {
    signAccessToken,
    generateRefreshToken,
    generateOtp,
    hashToken,
    accessTokenCookieOptions,
    refreshTokenCookieOptions,
    clearAccessTokenOptions,
    clearRefreshTokenOptions,
} from '../../common/utils/jwt';

import {
    sendOtpEmail,
    sendLoginOtpEmail,
} from '../../common/utils/email.helper';

import {
    AppError,
    ConflictError,
    UnauthorizedError,
} from '../../common/errors/app.error';

import {
    RegisterDto,
    LoginDto,
    VerifyOtpDto,
} from './auth.dto';

import {
    AuthTokensResponse,
    RegisterResponse,
    LoginResponse,
    RefreshResponse,
    ResendOtpResponse,
    LogoutAllResponse,
} from './auth.response';

import { OtpType, UserRole } from '@prisma/client';

const OTP_EXPIRES_MINUTES = 10;
const REFRESH_EXPIRES_DAYS = 7;

export class AuthService implements IAuthService {

    constructor(private readonly authRepository: IAuthRepository) { }

    // ─────────────────────────────────────────────────────────────
    // CREATE + SEND OTP
    // ─────────────────────────────────────────────────────────────
    private async createAndSendOtp(
        userId: string,
        email: string,
        name: string,
        type: OtpType,
    ): Promise<void> {

        const plainOtp = generateOtp();

        console.log('PLAIN OTP:', plainOtp);

        const otpHash = hashToken(plainOtp);

        console.log('HASHED OTP:', otpHash);

        const expiresAt = new Date();
        expiresAt.setMinutes(
            expiresAt.getMinutes() + OTP_EXPIRES_MINUTES
        );

        // OLD OTP DELETE
        await this.authRepository.deleteOtpsByUserAndType(
            userId,
            type,
        );

        // SAVE OTP
        await this.authRepository.createOtp({
            userId,
            otpHash,
            type,
            expiresAt,
        });

        console.log('[OTP] Saved in DB');

        // SEND EMAIL
        if (type === OtpType.email_verify) {
            await sendOtpEmail(email, name, plainOtp);
        }

        if (type === OtpType.login) {
            await sendLoginOtpEmail(email, name, plainOtp);
        }

        console.log('[OTP] Email sent successfully');
    }

    // ─────────────────────────────────────────────────────────────
    // ISSUE TOKENS
    // ─────────────────────────────────────────────────────────────
    private async issueTokens(
        userId: string,
        clinicId: string,
        email: string,
        role: UserRole,
        res: Response,
    ): Promise<{
        accessToken: string;
        plainRefreshToken: string;
    }> {

        // ACCESS TOKEN
        const accessToken = signAccessToken({
            userId,
            clinicId,
            email,
            role: role as 'owner' | 'staff' | 'doctor',
        });

        // REFRESH TOKEN
        const plainRefreshToken = generateRefreshToken();

        const hashedToken = hashToken(
            plainRefreshToken
        );

        const expiresAt = new Date();

        expiresAt.setDate(
            expiresAt.getDate() + REFRESH_EXPIRES_DAYS
        );

        // DELETE OLD TOKENS
        await this.authRepository.deleteRefreshTokensByUser(
            userId
        );

        // SAVE NEW TOKEN
        await this.authRepository.createRefreshToken({
            token: hashedToken,
            userId,
            expiresAt,
        });

        // COOKIES
        res.cookie(
            'access_token',
            accessToken,
            accessTokenCookieOptions,
        );

        res.cookie(
            'refresh_token',
            plainRefreshToken,
            refreshTokenCookieOptions,
        );

        return {
            accessToken,
            plainRefreshToken,
        };
    }

    // ─────────────────────────────────────────────────────────────
    // REGISTER
    // ─────────────────────────────────────────────────────────────
    async register(
        dto: RegisterDto
    ): Promise<RegisterResponse> {

        const existing =
            await this.authRepository.findUserByEmail(
                dto.email
            );

        if (existing) {
            throw new ConflictError(
                'Email already registered'
            );
        }

        const passwordHash = await bcrypt.hash(
            dto.password,
            12,
        );

        const { user } =
            await this.authRepository.createClinicAndUser(
                {
                    name: dto.clinicName,
                    email: dto.email,
                },
                {
                    email: dto.email,
                    passwordHash,
                    name: dto.name,
                    role: UserRole.owner,
                    isVerified: false,
                },
            );

        await this.createAndSendOtp(
            user.id,
            user.email,
            user.name,
            OtpType.email_verify,
        );

        return {
            userId: user.id,
            email: user.email,
            message:
                `Verification code sent to ${user.email}. Please verify to continue.`,
        };
    }

    // ─────────────────────────────────────────────────────────────
    // VERIFY REGISTER OTP
    // ─────────────────────────────────────────────────────────────
    async verifyOtp(
        dto: VerifyOtpDto,
        res: Response,
    ): Promise<AuthTokensResponse> {

        const user =
            await this.authRepository.findUserById(
                dto.userId
            );

        if (!user) {
            throw new AppError('User not found', 404);
        }

        const otpHash = hashToken(dto.otp);

        console.log('dto.otp:', dto.otp);
        console.log('otpHash verify:', otpHash);

        const storedOtp =
            await this.authRepository.findOtp(
                dto.userId,
                otpHash,
                OtpType.email_verify,
            );

        console.log('storedOtp:', storedOtp);

        if (!storedOtp) {
            throw new AppError('Invalid OTP', 400);
        }

        if (storedOtp.expiresAt < new Date()) {

            await this.authRepository.deleteOtp(
                storedOtp.id
            );

            throw new AppError(
                'OTP expired. Please request a new one.',
                400,
            );
        }

        await this.authRepository.deleteOtp(
            storedOtp.id
        );

        await this.authRepository.markUserVerified(
            user.id
        );

        const {
            accessToken,
            plainRefreshToken,
        } = await this.issueTokens(
            user.id,
            user.clinicId,
            user.email,
            user.role,
            res,
        );

        return AuthMapper.toAuthTokensResponse(
            user,
            accessToken,
            plainRefreshToken,
        );
    }

    // ─────────────────────────────────────────────────────────────
    // LOGIN
    // ─────────────────────────────────────────────────────────────
    async login(
        dto: LoginDto
    ): Promise<LoginResponse> {

        console.log('=== LOGIN DEBUG ===');

        const user =
            await this.authRepository.findUserByEmail(
                dto.email
            );

        console.log(
            'user found:',
            user?.email,
            'isVerified:',
            user?.isVerified,
        );

        if (!user || !user.isActive) {
            throw new AppError(
                'Invalid email or password',
                401,
            );
        }

        const isValid = await bcrypt.compare(
            dto.password,
            user.passwordHash,
        );

        console.log('password valid:', isValid);

        if (!isValid) {
            throw new AppError(
                'Invalid email or password',
                401,
            );
        }

        // NOT VERIFIED
        if (!user.isVerified) {

            console.log(
                'User not verified — sending email_verify OTP'
            );

            await this.createAndSendOtp(
                user.id,
                user.email,
                user.name,
                OtpType.email_verify,
            );

            return {
                userId: user.id,
                email: user.email,
                requiresVerification: true,
                message:
                    `Account not verified. New code sent to ${user.email}.`,
            };
        }

        // VERIFIED → LOGIN OTP
        console.log('Sending login OTP to:', user.email);

        await this.createAndSendOtp(
            user.id,
            user.email,
            user.name,
            OtpType.login,
        );

        console.log('Login OTP sent successfully');

        return {
            userId: user.id,
            email: user.email,
            requiresVerification: false,
            message:
                `Login code sent to ${user.email}. Please verify to continue.`,
        };
    }

    // ─────────────────────────────────────────────────────────────
    // VERIFY LOGIN OTP
    // ─────────────────────────────────────────────────────────────
    async verifyLoginOtp(
        dto: VerifyOtpDto,
        res: Response,
    ): Promise<AuthTokensResponse> {

        const user =
            await this.authRepository.findUserById(
                dto.userId
            );

        if (!user) {
            throw new AppError('User not found', 404);
        }

        console.log(
            '=== VERIFY LOGIN OTP DEBUG ==='
        );

        console.log('Entered OTP:', dto.otp);

        const otpHash = hashToken(dto.otp);

        console.log('Generated Hash:', otpHash);

        const storedOtp =
            await this.authRepository.findOtp(
                dto.userId,
                otpHash,
                OtpType.login,
            );

        console.log('Stored OTP:', storedOtp);

        console.log('==============================');

        if (!storedOtp) {
            throw new AppError('Invalid OTP', 400);
        }

        if (storedOtp.expiresAt < new Date()) {

            await this.authRepository.deleteOtp(
                storedOtp.id
            );

            throw new AppError(
                'OTP expired. Please login again.',
                400,
            );
        }

        // DELETE OTP
        await this.authRepository.deleteOtp(
            storedOtp.id
        );

        // ISSUE TOKENS
        const {
            accessToken,
            plainRefreshToken,
        } = await this.issueTokens(
            user.id,
            user.clinicId,
            user.email,
            user.role,
            res,
        );

        return AuthMapper.toAuthTokensResponse(
            user,
            accessToken,
            plainRefreshToken,
        );
    }

    // ─────────────────────────────────────────────────────────────
    // RESEND OTP
    // ─────────────────────────────────────────────────────────────
    async resendOtp(
        userId: string,
        type: OtpType,
    ): Promise<ResendOtpResponse> {

        const user =
            await this.authRepository.findUserById(
                userId
            );

        if (!user) {
            throw new AppError('User not found', 404);
        }

        await this.createAndSendOtp(
            user.id,
            user.email,
            user.name,
            type,
        );

        return {
            userId: user.id,
            message: `New code sent to ${user.email}`,
        };
    }

    // ─────────────────────────────────────────────────────────────
    // REFRESH TOKEN
    // ─────────────────────────────────────────────────────────────
    async refresh(
        plainRefreshToken: string | undefined,
        res: Response,
    ): Promise<RefreshResponse> {

        if (!plainRefreshToken) {
            throw new UnauthorizedError(
                'Refresh token required'
            );
        }

        const hashedToken =
            hashToken(plainRefreshToken);

        const stored =
            await this.authRepository.findRefreshToken(
                hashedToken
            );

        if (!stored) {
            throw new UnauthorizedError(
                'Invalid refresh token'
            );
        }

        if (stored.expiresAt < new Date()) {

            await this.authRepository.deleteRefreshToken(
                stored.id
            );

            throw new UnauthorizedError(
                'Refresh token expired, please login again'
            );
        }

        if (!stored.user.isActive) {
            throw new UnauthorizedError(
                'Account deactivated'
            );
        }

        // DELETE OLD TOKEN
        await this.authRepository.deleteRefreshToken(
            stored.id
        );

        // ISSUE NEW TOKEN
        const {
            accessToken,
            plainRefreshToken: newRefreshToken,
        } = await this.issueTokens(
            stored.user.id,
            stored.user.clinicId,
            stored.user.email,
            stored.user.role,
            res,
        );

        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }

    // ─────────────────────────────────────────────────────────────
    // LOGOUT
    // ─────────────────────────────────────────────────────────────
    async logout(
        userId: string,
        plainRefreshToken: string | undefined,
        res: Response,
    ): Promise<void> {

        if (plainRefreshToken) {

            const hashedToken =
                hashToken(plainRefreshToken);

            await this.authRepository
                .deleteRefreshTokenByUserAndHash(
                    userId,
                    hashedToken,
                );

        } else {

            await this.authRepository
                .deleteRefreshTokensByUser(
                    userId
                );
        }

        res.clearCookie(
            'access_token',
            clearAccessTokenOptions,
        );

        res.clearCookie(
            'refresh_token',
            clearRefreshTokenOptions,
        );
    }

    // ─────────────────────────────────────────────────────────────
    // LOGOUT ALL DEVICES
    // ─────────────────────────────────────────────────────────────
    async logoutAllDevices(
        userId: string,
        res: Response,
    ): Promise<LogoutAllResponse> {

        const count =
            await this.authRepository
                .deleteRefreshTokensByUser(
                    userId
                );

        res.clearCookie(
            'access_token',
            clearAccessTokenOptions,
        );

        res.clearCookie(
            'refresh_token',
            clearRefreshTokenOptions,
        );

        return {
            devicesLoggedOut: count,
        };
    }
}
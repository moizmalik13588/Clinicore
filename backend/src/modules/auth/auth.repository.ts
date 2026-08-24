import { User, Clinic, Otp, RefreshToken } from '@prisma/client';
import { prisma } from '../../db/client';
import { IAuthRepository } from './auth.interface';
import {
    CreateUserDto,
    CreateClinicDto,
    CreateOtpDto,
    CreateRefreshTokenDto,
} from './auth.dto';
import { OtpType } from '@prisma/client';

export class AuthRepository implements IAuthRepository {

    // ─── User ──────────────────────────────────────────────────────────────────

    async findUserByEmail(email: string): Promise<(User & { clinic: Clinic }) | null> {
        return prisma.user.findUnique({
            where: { email },
            include: { clinic: true },
        });
    }

    async findUserById(id: string): Promise<(User & { clinic: Clinic }) | null> {
        return prisma.user.findUnique({
            where: { id },
            include: { clinic: true },
        });
    }

    async createClinic(dto: CreateClinicDto): Promise<Clinic> {
        return prisma.clinic.create({ data: dto });
    }

    async createUser(dto: CreateUserDto): Promise<User> {
        return prisma.user.create({ data: dto });
    }

    // Transaction: clinic + user ek saath banao
    async createClinicAndUser(
        clinicDto: CreateClinicDto,
        userDto: Omit<CreateUserDto, 'clinicId'>,
    ): Promise<{ clinic: Clinic; user: User }> {
        return prisma.$transaction(async (tx) => {
            const clinic = await tx.clinic.create({ data: clinicDto });
            const user = await tx.user.create({
                data: { ...userDto, clinicId: clinic.id },
            });
            return { clinic, user };
        });
    }

    async markUserVerified(userId: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: { isVerified: true },
        });
    }

    // ─── OTP ───────────────────────────────────────────────────────────────────

    async findOtp(userId: string, otpHash: string, type: OtpType): Promise<Otp | null> {
        return prisma.otp.findFirst({
            where: { userId, otpHash, type },   // Prisma string accept karta hai — enum value string hi hoti hai
        });
    }

    async createOtp(dto: CreateOtpDto): Promise<void> {
        await prisma.otp.create({ data: dto });
    }

    async deleteOtp(id: string): Promise<void> {
        await prisma.otp.delete({ where: { id } });
    }

    async deleteOtpsByUserAndType(userId: string, type: OtpType): Promise<void> {
        await prisma.otp.deleteMany({ where: { userId, type } });
    }


    // ─── Refresh Token ──────────────────────────────────────────────────────────

    async createRefreshToken(dto: CreateRefreshTokenDto): Promise<void> {
        await prisma.refreshToken.create({ data: dto });
    }

    async findRefreshToken(
        hashedToken: string,
    ): Promise<(RefreshToken & { user: User & { clinic: Clinic } }) | null> {
        return prisma.refreshToken.findUnique({
            where: { token: hashedToken },
            include: { user: { include: { clinic: true } } },
        });
    }

    async deleteRefreshToken(id: string): Promise<void> {
        await prisma.refreshToken.delete({ where: { id } });
    }

    async deleteRefreshTokensByUser(userId: string): Promise<number> {
        const result = await prisma.refreshToken.deleteMany({ where: { userId } });
        return result.count;
    }

    async deleteRefreshTokenByUserAndHash(
        userId: string,
        hashedToken: string,
    ): Promise<number> {
        const result = await prisma.refreshToken.deleteMany({
            where: { userId, token: hashedToken },
        });
        return result.count;
    }
}
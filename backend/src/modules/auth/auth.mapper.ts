import { User, Clinic } from '@prisma/client';
import { UserResponse, AuthTokensResponse } from './auth.response';

type UserWithClinic = User & { clinic: Clinic };

export class AuthMapper {

    // ─── Prisma User → UserResponse ───────────────────────────────────────────
    static toUserResponse(user: UserWithClinic): UserResponse {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            clinicId: user.clinicId,
            clinicName: user.clinic.name,
            isVerified: user.isVerified,
        };
    }

    // ─── User + Tokens → AuthTokensResponse ──────────────────────────────────
    static toAuthTokensResponse(
        user: UserWithClinic,
        accessToken: string,
        refreshToken: string,
    ): AuthTokensResponse {
        return {
            accessToken,
            refreshToken,
            user: AuthMapper.toUserResponse(user),
        };
    }
}
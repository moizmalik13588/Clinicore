// ─── Auth Response Types ──────────────────────────────────────────────────────
// Yeh woh shapes hain jo client ko milti hain

export interface UserResponse {
    id: string;
    email: string;
    name: string;
    role: string;
    clinicId: string;
    clinicName: string;
    isVerified: boolean;
}

export interface AuthTokensResponse {
    accessToken: string;
    refreshToken: string;
    user: UserResponse;
}

export interface RegisterResponse {
    userId: string;
    email: string;
    message: string;
}

export interface LoginResponse {
    userId: string;
    email: string;
    requiresVerification: boolean;
    message: string;
}

export interface RefreshResponse {
    accessToken: string;
    refreshToken: string;
}

export interface ResendOtpResponse {
    userId: string;
    message: string;
}

export interface LogoutAllResponse {
    devicesLoggedOut: number;
}
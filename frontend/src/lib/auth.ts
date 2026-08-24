export interface User {
    userId: string;
    clinicId: string;
    email: string;
    role: string;
    name?: string;
    clinicName?: string;
}

export function getUser(): User | null {
    try {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
}

export function setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
}

export function clearAuth(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
}

export function isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
}
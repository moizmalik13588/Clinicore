import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,           // cookies ke liye
    timeout: 15000,
});

// ─── Request interceptor — token inject ───────────────────────────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ─── Response interceptor — auto refresh ─────────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        // 401 aur retry nahi kiya abhi tak
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) throw new Error('No refresh token');

                const res = await axios.post(`${BASE_URL}/auth/refresh`, {
                    refreshToken,
                }, { withCredentials: true });

                const { accessToken, refreshToken: newRefresh } = res.data.data;
                localStorage.setItem('access_token', accessToken);
                localStorage.setItem('refresh_token', newRefresh);

                original.headers.Authorization = `Bearer ${accessToken}`;
                return api(original);
            } catch {
                // Refresh bhi fail — logout karo
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    },
);

export default api;

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export const authApi = {
    login: (email: string, password: string) => api.post('/auth/login', { email, password }),
    verifyLoginOtp: (userId: string, otp: string) => api.post('/auth/verify-login-otp', { userId, otp }),
    register: (data: any) => api.post('/auth/register', data),
    verifyOtp: (userId: string, otp: string) => api.post('/auth/verify-otp', { userId, otp }),
    me: () => api.get('/auth/me'),
    logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
};

export const patientsApi = {
    list: (params?: any) => api.get('/patients', { params }),
    getById: (id: string) => api.get(`/patients/${id}`),
    create: (data: any) => api.post('/patients', data),
    update: (id: string, data: any) => api.put(`/patients/${id}`, data),
    delete: (id: string) => api.delete(`/patients/${id}`),
};

export const appointmentsApi = {
    list: (params?: any) => api.get('/appointments', { params }),
    getById: (id: string) => api.get(`/appointments/${id}`),
    create: (data: any) => api.post('/appointments', data),
    update: (id: string, data: any) => api.put(`/appointments/${id}`, data),
    delete: (id: string) => api.delete(`/appointments/${id}`),
};

export const doctorsApi = {
    list: (params?: any) => api.get('/doctors', { params }),
    active: () => api.get('/doctors/active'),
    create: (data: any) => api.post('/doctors', data),
    update: (id: string, data: any) => api.put(`/doctors/${id}`, data),
    deactivate: (id: string) => api.patch(`/doctors/${id}/deactivate`),
};

export const dashboardApi = {
    overview: () => api.get('/dashboard/overview'),
    stats: () => api.get('/dashboard/stats'),
    revenue: () => api.get('/dashboard/revenue'),
    timeline: () => api.get('/dashboard/timeline'),
    reports: () => api.get('/dashboard/reports'),
};

export const crmApi = {
    lookupByPhone: (phone: string) => api.get('/crm/patient', { params: { phone } }),
    getHistory: (id: string) => api.get(`/crm/patient/${id}/history`),
    getMoodLog: (id: string) => api.get(`/crm/patient/${id}/mood-log`),
    createVisit: (data: any) => api.post('/crm/visit', data),
    search: (q: string) => api.get('/crm/search', { params: { q } }),
};

export const moodApi = {
    analyze: (data: any) => api.post('/mood/analyze', data),
    trends: (range: string) => api.get('/mood/trends', { params: { range } }),
    callTimeline: (callId: string) => api.get(`/mood/call/${callId}`),
    patientHistory: (id: string) => api.get(`/mood/patient/${id}`),
};

export const callsApi = {
    list: (params?: any) => api.get('/calls', { params }),
    getById: (id: string) => api.get(`/calls/${id}`),
    getMoodTimeline: (id: string) => api.get(`/calls/${id}/mood-timeline`),
};

export const revenueApi = {
    stats: (range: string) => api.get('/revenue/stats', { params: { range } }),
    list: (params?: any) => api.get('/revenue', { params }),
    create: (data: any) => api.post('/revenue', data),
};

export const smsApi = {
    send: (to: string, message: string) => api.post('/sms/send', { to, message }),
};
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../lib/api';
import { setTokens, setUser } from '../lib/auth';
import { useToast } from '../components/ui/Toast';
import Spinner from '../components/ui/Spinner';
import { Stethoscope, Mail, Lock, Activity, Calendar, Bell, Shield } from 'lucide-react';

type Step = 'login' | 'otp';

export default function Login() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [step, setStep] = useState<Step>('login');
    const [userId, setUserId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await authApi.login(email, password);
            const { userId: uid, message } = res.data.data;
            setUserId(uid);
            setStep('otp');
            showToast(message || 'OTP sent to your email', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Login failed', 'error');
        } finally {
            setLoading(false);
        }
    }

    async function handleOtp(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await authApi.verifyLoginOtp(userId, otp);
            const { accessToken, refreshToken, user } = res.data.data;

            setTokens(accessToken, refreshToken);
            setUser(user);

            showToast('Welcome back!', 'success');
            navigate('/dashboard');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Invalid OTP', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-dark-bg overflow-x-hidden">
            {/* Left Side: Form Container */}
            <div className="min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-16">
                {/* Mobile Brand Header */}
                <div className="flex items-center gap-3 lg:hidden">
                    <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm">
                        <Stethoscope size={20} />
                    </div>
                    <div>
                        <span className="text-xl font-bold text-dark-text tracking-tight block">Clinicore</span>
                        <span className="text-xs text-dark-muted">Clinical operations</span>
                    </div>
                </div>

                {/* Vertically centered form container */}
                <div className="max-w-md w-full mx-auto lg:mx-0 my-auto py-8">
                    {/* Desktop Logo */}
                    <div className="hidden lg:flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm">
                            <Stethoscope size={20} />
                        </div>
                        <div>
                            <span className="text-xl font-bold text-dark-text tracking-tight block">Clinicore</span>
                            <span className="text-xs text-dark-muted">Clinical operations</span>
                        </div>
                    </div>

                    <div className="space-y-2 mb-6">
                        <h1 className="text-2xl font-bold text-dark-text tracking-tight">
                            {step === 'login' ? 'Welcome back' : 'Verification Code'}
                        </h1>
                        <p className="text-dark-muted text-sm leading-relaxed">
                            {step === 'login'
                                ? 'Sign in to your clinic dashboard.'
                                : `Please enter the 6-digit verification code sent to ${email}.`}
                        </p>
                    </div>

                    {/* Segmented Pill-style Toggle */}
                    {step === 'login' && (
                        <div className="flex bg-slate-200/70 p-1 rounded-xl mb-6 shadow-inner">
                            <button
                                type="button"
                                className="flex-1 py-2 text-sm font-semibold rounded-lg bg-white text-dark-text shadow-sm transition-all"
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/register')}
                                className="flex-1 py-2 text-sm font-semibold rounded-lg text-dark-muted hover:text-dark-text transition-all"
                            >
                                Register
                            </button>
                        </div>
                    )}

                    {step === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-dark-text mb-1.5">Email address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-muted">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        className="input"
                                        style={{ paddingLeft: '48px' }}
                                        placeholder="doctor@clinic.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-sm font-medium text-dark-text">Password</label>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-muted">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        className="input"
                                        style={{ paddingLeft: '48px' }}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base shadow-sm mt-2 group"
                            >
                                {loading ? <Spinner size="sm" /> : null}
                                {loading ? 'Signing in...' : <>Sign In <span className="text-base group-hover:translate-x-0.5 transition-transform">→</span></>}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleOtp} className="space-y-5">
                            <div>
                                <input
                                    type="text"
                                    className="input text-center text-3xl tracking-[0.75em] font-bold py-3.5"
                                    placeholder="000000"
                                    maxLength={6}
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                    required
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base shadow-sm"
                            >
                                {loading ? <Spinner size="sm" /> : null}
                                {loading ? 'Verifying...' : 'Verify & Sign In →'}
                            </button>
                            <div className="flex items-center justify-between text-sm pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setStep('login'); setOtp(''); }}
                                    className="text-dark-muted hover:text-dark-text font-medium transition-colors"
                                >
                                    ← Back to login
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleLogin({ preventDefault: () => {} } as any)}
                                    className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                                >
                                    Resend Code
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="max-w-md w-full mx-auto lg:mx-0 text-xs text-dark-muted pt-6 border-t border-dark-border">
                    Clinicore Clinical OS v1.0 • Secure Medical Workspace
                </div>
            </div>

            {/* Right Side: Themed Clinical Panel */}
            <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-primary-600 via-primary-700 to-teal-900 text-white relative overflow-hidden">
                {/* Subtle dot-grid background texture */}
                <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:18px_18px]"></div>

                {/* Small decorative "+" marks in corners */}
                <div className="absolute top-8 right-10 text-white/25 font-mono text-3xl select-none pointer-events-none">+</div>
                <div className="absolute bottom-8 left-10 text-white/25 font-mono text-3xl select-none pointer-events-none">+</div>

                {/* Right Panel Main Content matching reference structure */}
                <div className="relative z-10 max-w-lg pt-4 pb-8">
                    {/* Two side-by-side pill eyebrow badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-primary-100 tracking-wider uppercase shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-primary-300 animate-pulse"></span>
                            AI-POWERED
                        </div>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-primary-100 tracking-wider uppercase shadow-sm">
                            Multi-Tenant Clinic Management SaaS
                        </div>
                    </div>

                    {/* Bold large heading */}
                    <h2 className="text-4xl font-extrabold tracking-tight mb-3 leading-tight text-white">
                        Smart Clinic Management.
                    </h2>

                    {/* One bold accent highlight line below it */}
                    <p className="text-2xl font-bold text-primary-200 mb-6 tracking-tight">
                        24/7 Always On.
                    </p>

                    {/* Short paragraph */}
                    <p className="text-primary-100 text-base leading-relaxed mb-10">
                        Automate patient calls, bookings & reminders — so your staff can focus on care.
                    </p>

                    {/* 3-item feature checklist */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-primary-200 shrink-0 shadow-sm">
                                <Activity size={18} />
                            </div>
                            <span className="text-white font-medium text-base">Answers every patient call</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-primary-200 shrink-0 shadow-sm">
                                <Calendar size={18} />
                            </div>
                            <span className="text-white font-medium text-base">Books appointments instantly</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-primary-200 shrink-0 shadow-sm">
                                <Bell size={18} />
                            </div>
                            <span className="text-white font-medium text-base">Sends smart reminders</span>
                        </div>
                    </div>
                </div>

                {/* Footer: PHI compliance badge */}
                <div className="relative z-10 pt-6 border-t border-white/10 flex items-center gap-2.5 text-xs text-primary-200">
                    <Shield size={14} className="text-primary-200" />
                    <span>Protected Health Information (PHI) compliant architecture</span>
                </div>
            </div>
        </div>
    );
}

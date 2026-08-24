import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../lib/api';
import { setTokens, setUser } from '../lib/auth';
import { useToast } from '../components/ui/Toast';
import Spinner from '../components/ui/Spinner';

type Step = 'register' | 'otp';

export default function Register() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [step, setStep] = useState<Step>('register');
    const [userId, setUserId] = useState('');
    const [name, setName] = useState('');
    const [clinicName, setClinicName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    // ─── Step 1: Register ────────────────────────────────────────────────────
    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (password.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await authApi.register({
                name,
                clinicName,
                email,
                password,
            });
            const { userId: uid, message } = res.data.data;
            setUserId(uid);
            setStep('otp');
            showToast(message || 'Verification code sent to your email', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Registration failed', 'error');
        } finally {
            setLoading(false);
        }
    }

    // ─── Step 2: Verify OTP ──────────────────────────────────────────────────
    async function handleOtp(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await authApi.verifyOtp(userId, otp);
            const { accessToken, refreshToken, user } = res.data.data;

            setTokens(accessToken, refreshToken);
            setUser(user);

            showToast('Account verified and logged in successfully!', 'success');
            navigate('/dashboard');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Invalid verification code', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600/20 rounded-2xl mb-4">
                        <span className="text-2xl">🏥</span>
                    </div>
                    <h1 className="text-2xl font-bold text-dark-text">Clinicore</h1>
                    <p className="text-dark-muted text-sm mt-1">AI-Powered Clinic Management</p>
                </div>

                <div className="card">
                    {step === 'register' ? (
                        <>
                            <h2 className="text-lg font-semibold text-dark-text mb-1">Register Your Clinic</h2>
                            <p className="text-xs text-dark-muted mb-6">
                                Create a primary account for your clinic. Doctors and staff can be added later from your clinic dashboard.
                            </p>
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-dark-muted mb-1.5">Owner / Admin Full Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Dr. John Doe"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-dark-muted mb-1.5">Clinic Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="City Health Clinic"
                                        value={clinicName}
                                        onChange={e => setClinicName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-dark-muted mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        className="input"
                                        placeholder="owner@clinic.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-dark-muted mb-1.5">Password</label>
                                    <input
                                        type="password"
                                        className="input"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-dark-muted mb-1.5">Confirm Password</label>
                                    <input
                                        type="password"
                                        className="input"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
                                >
                                    {loading ? <Spinner size="sm" /> : null}
                                    {loading ? 'Creating account...' : 'Sign Up'}
                                </button>
                            </form>

                            <p className="text-center text-sm text-dark-muted mt-6">
                                Already have an account?{' '}
                                <Link to="/login" className="text-primary-500 hover:underline font-medium">
                                    Sign In
                                </Link>
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 mb-6">
                                <button
                                    onClick={() => { setStep('register'); setOtp(''); }}
                                    className="text-dark-muted hover:text-dark-text transition-colors"
                                >
                                    ←
                                </button>
                                <div>
                                    <h2 className="text-lg font-semibold text-dark-text">Verify Email</h2>
                                    <p className="text-sm text-dark-muted">Code sent to {email}</p>
                                </div>
                            </div>

                            <form onSubmit={handleOtp} className="space-y-4">
                                <input
                                    type="text"
                                    className="input text-center text-2xl tracking-[0.5em] font-bold"
                                    placeholder="000000"
                                    maxLength={6}
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                    required
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
                                >
                                    {loading ? <Spinner size="sm" /> : null}
                                    {loading ? 'Verifying...' : 'Verify & Complete'}
                                </button>
                            </form>

                            <p className="text-center text-sm text-dark-muted mt-4">
                                Didn't receive code?{' '}
                                <button
                                    onClick={() => handleRegister({ preventDefault: () => { } } as any)}
                                    className="text-primary-500 hover:underline"
                                >
                                    Resend
                                </button>
                            </p>
                        </>
                    )}
                </div>

                <p className="text-center text-xs text-dark-muted mt-6">
                    Clinicore Clinic OS v1.0
                </p>
            </div>
        </div>
    );
}

import { useState, useEffect, useCallback } from 'react';
import {
    Settings, Stethoscope, Wifi, WifiOff,
    Plus, Edit2, X, Check, RefreshCw,
    Phone, Mail, Clock, Building2,
    ChevronDown, ChevronUp, AlertCircle,
    Calendar, MessageSquare, Brain, Zap,
} from 'lucide-react';
import api from '../lib/api';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HealthCheck {
    name: string;
    key: string;
    status: 'ok' | 'error' | 'unknown';
    message: string;
    icon: React.ReactNode;
}

// ─── Health Status Dot ────────────────────────────────────────────────────────
function StatusDot({ status }: { status: 'ok' | 'error' | 'unknown' }) {
    return (
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${status === 'ok' ? 'bg-green-400' :
            status === 'error' ? 'bg-red-400' :
                'bg-yellow-400'
            }`} />
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Setup() {
    const { showToast } = useToast();


    // Health
    const [health, setHealth] = useState<Record<string, any> | null>(null);
    const [healthLoad, setHealthLoad] = useState(true);

    // Clinic settings
    const [clinic, setClinic] = useState<any>(null);
    const [editingClinic, setEditingClinic] = useState(false);
    const [clinicForm, setClinicForm] = useState({
        name: '', phone: '', address: '', apptDurationMins: 30,
    });
    const [savingClinic, setSavingClinic] = useState(false);

    // Jobs
    const [jobRunning, setJobRunning] = useState<string | null>(null);


    // ─── Fetch health ─────────────────────────────────────────────────────────
    const fetchHealth = useCallback(async () => {
        setHealthLoad(true);
        try {
            const res = await api.get('/clinics/health');
            setHealth(res.data.data);
        } catch { /* ignore */ }
        finally { setHealthLoad(false); }
    }, []);

    // ─── Fetch clinic ─────────────────────────────────────────────────────────
    const fetchClinic = useCallback(async () => {
        try {
            const res = await api.get('/clinics/me');
            setClinic(res.data.data);
            setClinicForm({
                name: res.data.data.name || '',
                phone: res.data.data.phone || '',
                address: res.data.data.address || '',
                apptDurationMins: res.data.data.apptDurationMins || 30,
            });
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {

        fetchHealth();
        fetchClinic();
    }, [fetchHealth, fetchClinic]);


    async function saveClinic(e: React.FormEvent) {
        e.preventDefault();
        setSavingClinic(true);
        try {
            await api.put('/clinics/me', clinicForm);
            setClinic((p: any) => ({ ...p, ...clinicForm }));
            setEditingClinic(false);
            showToast('Clinic settings saved', 'success');
        } catch {
            showToast('Failed to save', 'error');
        } finally {
            setSavingClinic(false);
        }
    }

    async function triggerJob(jobName: string) {
        setJobRunning(jobName);
        try {
            const res = await api.post(`/jobs/trigger/${jobName}`);
            const msg = res.data.message || `${jobName} complete`;
            showToast(msg, 'success');
        } catch {
            showToast(`${jobName} failed`, 'error');
        } finally {
            setJobRunning(null);
        }
    }

    // ─── Health checks list ───────────────────────────────────────────────────
    const healthChecks: HealthCheck[] = [
        {
            name: 'Database',
            key: 'database',
            status: health?.checks?.database === true ? 'ok' : health?.checks?.database ? 'error' : 'unknown',
            message: health?.checks?.database === true ? 'Connected' : 'Connection issue',
            icon: <Zap size={15} />,
        },
        {
            name: 'Retell AI',
            key: 'retell',
            status: health?.checks?.retell === true ? 'ok' : 'error',
            message: health?.checks?.retell === true ? 'Connected' : 'API key missing',
            icon: <Phone size={15} />,
        },
        {
            name: 'Retell Agent',
            key: 'retellAgentId',
            status: health?.checks?.retellAgentId ? 'ok' : 'error',
            message: health?.checks?.retellAgentId ? 'Agent configured' : 'No agent ID',
            icon: <Brain size={15} />,
        },
        {
            name: 'OpenRouter AI',
            key: 'openRouterKey',
            status: health?.checks?.openRouterKey ? 'ok' : 'error',
            message: health?.checks?.openRouterKey ? 'API key set' : 'Missing API key',
            icon: <Brain size={15} />,
        },
        {
            name: 'Twilio SMS',
            key: 'twilioConfigured',
            status: health?.checks?.twilioConfigured ? 'ok' : 'error',
            message: health?.checks?.twilioConfigured ? 'Configured' : 'Not configured',
            icon: <MessageSquare size={15} />,
        },
        {
            name: 'Webhook Secret',
            key: 'webhookSecret',
            status: health?.checks?.webhookSecret ? 'ok' : 'error',
            message: health?.checks?.webhookSecret ? 'Set' : 'Missing',
            icon: <Settings size={15} />,
        },
    ];

    const healthyCount = healthChecks.filter(h => h.status === 'ok').length;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">

            {/* ─── System Health ──────────────────────────────────────────────── */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-dark-text flex items-center gap-2">
                            <Wifi size={16} className="text-primary-400" />
                            System Health
                        </h3>
                        <p className="text-xs text-dark-muted mt-0.5">
                            {healthLoad ? 'Checking...' : `${healthyCount}/${healthChecks.length} services healthy`}
                        </p>
                    </div>
                    <button
                        onClick={fetchHealth}
                        disabled={healthLoad}
                        className="btn-secondary p-2"
                    >
                        <RefreshCw size={14} className={healthLoad ? 'animate-spin' : ''} />
                    </button>
                </div>

                {healthLoad ? (
                    <div className="flex justify-center py-6"><Spinner /></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {healthChecks.map(check => (
                            <div
                                key={check.key}
                                className={`flex items-center gap-3 p-3 rounded-xl border ${check.status === 'ok'
                                    ? 'border-green-500/20 bg-green-500/5'
                                    : 'border-red-500/20 bg-red-500/5'
                                    }`}
                            >
                                <StatusDot status={check.status} />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-dark-text">{check.name}</p>
                                    <p className="text-xs text-dark-muted truncate">{check.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Setup instructions */}
                {!healthLoad && healthyCount < healthChecks.length && (
                    <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                        <p className="text-xs text-yellow-400 flex items-center gap-1.5 mb-1">
                            <AlertCircle size={12} /> Setup Required
                        </p>
                        <p className="text-xs text-dark-muted">
                            Add missing API keys to your <code className="text-primary-400">.env</code> file
                            and restart the server.
                        </p>
                    </div>
                )}
            </div>

            {/* ─── Clinic Settings ────────────────────────────────────────────── */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-dark-text flex items-center gap-2">
                        <Building2 size={16} className="text-primary-400" />
                        Clinic Settings
                    </h3>
                    {!editingClinic && (
                        <button
                            onClick={() => setEditingClinic(true)}
                            className="btn-secondary flex items-center gap-2 text-xs"
                        >
                            <Edit2 size={13} /> Edit
                        </button>
                    )}
                </div>

                {editingClinic ? (
                    <form onSubmit={saveClinic} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-dark-muted mb-1.5">Clinic Name</label>
                                <input
                                    className="input"
                                    value={clinicForm.name}
                                    onChange={e => setClinicForm(p => ({ ...p, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-dark-muted mb-1.5">Phone</label>
                                <input
                                    className="input"
                                    placeholder="+923001234567"
                                    value={clinicForm.phone}
                                    onChange={e => setClinicForm(p => ({ ...p, phone: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-dark-muted mb-1.5">Address</label>
                                <input
                                    className="input"
                                    placeholder="123 Medical St, Karachi"
                                    value={clinicForm.address}
                                    onChange={e => setClinicForm(p => ({ ...p, address: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-dark-muted mb-1.5">
                                    Default Appointment Duration
                                </label>
                                <select
                                    className="input"
                                    value={clinicForm.apptDurationMins}
                                    onChange={e => setClinicForm(p => ({ ...p, apptDurationMins: parseInt(e.target.value) }))}
                                >
                                    <option value={10}>10 minutes</option>
                                    <option value={15}>15 minutes</option>
                                    <option value={20}>20 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={45}>45 minutes</option>
                                    <option value={60}>1 hour</option>
                                    <option value={90}>1.5 hours</option>
                                    <option value={120}>2 hours</option>
                                    <option value={180}>3 hours</option>
                                    <option value={240}>4 hours</option>
                                    <option value={360}>6 hours</option>
                                    <option value={480}>8 hours</option>
                                    <option value={720}>12 hours</option>
                                    <option value={1440}>24 hours</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setEditingClinic(false)} className="btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" disabled={savingClinic} className="btn-primary flex items-center gap-2">
                                {savingClinic && <Spinner size="sm" />}
                                Save Settings
                            </button>
                        </div>
                    </form>
                ) : clinic ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        {[
                            { label: 'Clinic Name', value: clinic.name || '—', icon: <Building2 size={13} /> },
                            { label: 'Phone', value: clinic.phone || '—', icon: <Phone size={13} /> },
                            { label: 'Address', value: clinic.address || '—', icon: <Mail size={13} /> },
                            { label: 'Slot Duration', value: `${clinic.apptDurationMins || 30} min`, icon: <Clock size={13} /> },
                        ].map(({ label, value, icon }) => (
                            <div key={label}>
                                <p className="text-xs text-dark-muted flex items-center gap-1 mb-1">
                                    {icon} {label}
                                </p>
                                <p className="text-dark-text font-medium truncate">{value}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex justify-center py-4"><Spinner /></div>
                )}
            </div>


            {/* ─── Manual Jobs ────────────────────────────────────────────────── */}
            <div className="card">
                <h3 className="font-semibold text-dark-text flex items-center gap-2 mb-4">
                    <Zap size={16} className="text-primary-400" />
                    Background Jobs
                </h3>
                <p className="text-xs text-dark-muted mb-4">
                    Manually trigger scheduled jobs for testing
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { key: 'reminders', label: 'Send Reminders', icon: Phone, desc: '24h appointment reminders' },
                        { key: 'mood-report', label: 'Mood Report', icon: Brain, desc: 'Daily mood summary + alerts' },
                        { key: 'recall', label: 'Send Recalls', icon: MessageSquare, desc: 'Follow-up patient recalls' },
                    ].map(({ key, label, icon: Icon, desc }) => (
                        <button
                            key={key}
                            onClick={() => triggerJob(key)}
                            disabled={!!jobRunning}
                            className="flex items-center gap-3 p-4 rounded-xl border border-dark-border
                         hover:border-primary-600/40 hover:bg-primary-600/5 transition-all
                         text-left disabled:opacity-50"
                        >
                            <div className="p-2 bg-primary-600/10 rounded-lg flex-shrink-0">
                                {jobRunning === key
                                    ? <Spinner size="sm" />
                                    : <Icon size={16} className="text-primary-400" />
                                }
                            </div>
                            <div>
                                <p className="text-sm font-medium text-dark-text">{label}</p>
                                <p className="text-xs text-dark-muted">{desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── Retell Agent ───────────────────────────────────────────────── */}
            <div className="card">
                <h3 className="font-semibold text-dark-text flex items-center gap-2 mb-4">
                    <Phone size={16} className="text-primary-400" />
                    Retell AI Agent
                </h3>

                <div className="space-y-3">
                    <p className="text-xs text-dark-muted">
                        Create or view your AI phone agent. The agent handles inbound calls,
                        identifies patients via CRM, and adjusts tone based on mood.
                    </p>

                    <div className="flex gap-3 flex-wrap">
                        <button
                            onClick={async () => {
                                try {
                                    const res = await api.get('/clinics/agent');
                                    showToast(`Agent: ${res.data.data.agentId}`, 'success');
                                } catch {
                                    showToast('No agent configured yet', 'warning');
                                }
                            }}
                            className="btn-secondary flex items-center gap-2 text-sm"
                        >
                            <Phone size={14} /> View Agent
                        </button>

                        <button
                            onClick={async () => {
                                try {
                                    const res = await api.post('/clinics/create-agent', {
                                        agentName: 'Clinicore Assistant',
                                        voiceId: '11labs-Adrian',
                                    });
                                    showToast(`Agent created: ${res.data.data.agentId}`, 'success');
                                } catch (err: any) {
                                    showToast(err.response?.data?.error || 'Failed', 'error');
                                }
                            }}
                            className="btn-primary flex items-center gap-2 text-sm"
                        >
                            <Plus size={14} /> Create Agent
                        </button>
                    </div>

                    <div className="p-3 bg-dark-bg/50 rounded-xl border border-dark-border">
                        <p className="text-xs text-dark-muted">
                            After creating agent, add to <code className="text-primary-400">.env</code>:
                        </p>
                        <code className="text-xs text-green-400 block mt-1.5">
                            RETELL_AGENT_ID=agent_xxxxxxxxxx
                        </code>
                    </div>
                </div>
            </div>
        </div>
    );
}
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Phone, Mail, Calendar, Clock,
    Edit2, Save, X, Plus, Activity,
    FileText, Brain, MessageSquare, User,
    AlertTriangle, Stethoscope,
} from 'lucide-react';
import { patientsApi, crmApi, callsApi, doctorsApi } from '../lib/api';
import MoodBadge from '../components/ui/MoodBadge';
import StatusBadge from '../components/ui/StatusBadge';
import TagBadge from '../components/ui/TagBadge';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { format, formatDistanceToNow } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Patient {
    id: string; name: string; phone: string; email: string | null;
    gender: string | null; dateOfBirth: string | null;
    totalVisits: number; lastVisitDate: string | null;
    lastComplaint: string | null; lastMood: string | null;
    crmTags: string[]; preferredTimeSlot: string | null; notes: string | null;
    preferredDoctor: { id: string; name: string; specialty: string | null } | null;
    createdAt: string; updatedAt: string;
}

interface Visit {
    id: string; visitDate: string; chiefComplaint: string | null;
    diagnosis: string | null; treatmentNotes: string | null;
    followUpDays: number | null;
    doctor: { id: string; name: string; specialty: string | null } | null;
    appointment: { id: string; status: string; type: string } | null;
}

interface Call {
    id: string; direction: string; status: string;
    duration: number | null; dominantMood: string | null;
    avgIntensity: number | null; fromNumber: string | null;
    startedAt: string | null; endedAt: string | null; createdAt: string;
}

interface MoodEvent {
    id: string; detectedMood: string; intensity: number;
    timestampOffset: number; aiActionTaken: string | null;
    createdAt: string;
}

type Tab = 'overview' | 'visits' | 'calls' | 'mood';

// ─── Visit Timeline Item ──────────────────────────────────────────────────────
function VisitCard({ visit }: { visit: Visit }) {
    return (
        <div className="relative pl-8">
            {/* Timeline dot */}
            <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-primary-600 border-2 border-dark-bg" />
            {/* Line */}
            <div className="absolute left-1.5 top-4 bottom-0 w-px bg-dark-border" />

            <div className="card-sm mb-4">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <p className="text-sm font-semibold text-dark-text">
                            {visit.chiefComplaint || 'General Visit'}
                        </p>
                        <p className="text-xs text-dark-muted mt-0.5">
                            {format(new Date(visit.visitDate), 'EEEE, MMM d yyyy • h:mm a')}
                        </p>
                    </div>
                    {visit.doctor && (
                        <span className="text-xs text-primary-400 bg-primary-600/10 px-2 py-0.5 rounded-md">
                            Dr. {visit.doctor.name}
                        </span>
                    )}
                </div>

                {visit.diagnosis && (
                    <div className="mt-2 pt-2 border-t border-dark-border/50">
                        <p className="text-xs text-dark-muted">
                            <span className="font-medium text-dark-text/70">Diagnosis: </span>
                            {visit.diagnosis}
                        </p>
                    </div>
                )}

                {visit.treatmentNotes && (
                    <p className="text-xs text-dark-muted mt-1">
                        <span className="font-medium text-dark-text/70">Notes: </span>
                        {visit.treatmentNotes}
                    </p>
                )}

                {visit.followUpDays && (
                    <div className="mt-2 flex items-center gap-1.5">
                        <Clock size={11} className="text-orange-400" />
                        <span className="text-xs text-orange-400">
                            Follow-up in {visit.followUpDays} days
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Edit Patient Modal ───────────────────────────────────────────────────────
interface EditPatientProps {
    patient: Patient;
    doctors: Array<{ id: string; name: string; specialty: string | null }>;
    onSave: (updated: Patient) => void;
    onCancel: () => void;
}

function EditPatientForm({ patient, doctors, onSave, onCancel }: EditPatientProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: patient.name,
        phone: patient.phone,
        email: patient.email || '',
        gender: patient.gender || '',
        preferredDoctorId: patient.preferredDoctor?.id || '',
        preferredTimeSlot: patient.preferredTimeSlot || '',
        notes: patient.notes || '',
        crmTags: [...patient.crmTags],
    });
    const [tagInput, setTagInput] = useState('');

    function set(key: string, value: string) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await patientsApi.update(patient.id, {
                ...form,
                email: form.email || null,
                preferredDoctorId: form.preferredDoctorId || null,
                preferredTimeSlot: form.preferredTimeSlot || null,
                notes: form.notes || null,
                gender: form.gender || null,
            });
            showToast('Patient updated', 'success');
            onSave(res.data.data);
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Update failed', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-dark-muted mb-1.5">Name</label>
                    <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
                <div>
                    <label className="block text-xs text-dark-muted mb-1.5">Phone</label>
                    <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} required />
                </div>
                <div>
                    <label className="block text-xs text-dark-muted mb-1.5">Email</label>
                    <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs text-dark-muted mb-1.5">Gender</label>
                    <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                        <option value="">Select...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-dark-muted mb-1.5">Preferred Doctor</label>
                    <select className="input" value={form.preferredDoctorId} onChange={e => set('preferredDoctorId', e.target.value)}>
                        <option value="">No preference</option>
                        {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-dark-muted mb-1.5">Preferred Time</label>
                    <select className="input" value={form.preferredTimeSlot} onChange={e => set('preferredTimeSlot', e.target.value)}>
                        <option value="">Any</option>
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="evening">Evening</option>
                    </select>
                </div>
            </div>

            {/* Tags */}
            <div>
                <label className="block text-xs text-dark-muted mb-1.5">CRM Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.crmTags.map(tag => (
                        <span key={tag} className="badge bg-primary-600/20 text-primary-400 gap-1">
                            {tag}
                            <button type="button" onClick={() => setForm(p => ({ ...p, crmTags: p.crmTags.filter(t => t !== tag) }))}>
                                <X size={10} />
                            </button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        className="input"
                        placeholder="Add tag..."
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const t = tagInput.trim();
                                if (t && !form.crmTags.includes(t)) setForm(p => ({ ...p, crmTags: [...p.crmTags, t] }));
                                setTagInput('');
                            }
                        }}
                    />
                    <button type="button" className="btn-secondary px-3" onClick={() => {
                        const t = tagInput.trim();
                        if (t && !form.crmTags.includes(t)) setForm(p => ({ ...p, crmTags: [...p.crmTags, t] }));
                        setTagInput('');
                    }}>Add</button>
                </div>
            </div>

            <div>
                <label className="block text-xs text-dark-muted mb-1.5">Notes</label>
                <textarea className="input resize-none" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                    {loading && <Spinner size="sm" />}
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PatientCRM() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [patient, setPatient] = useState<Patient | null>(null);
    const [visits, setVisits] = useState<Visit[]>([]);
    const [calls, setCalls] = useState<Call[]>([]);
    const [moods, setMoods] = useState<MoodEvent[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>('overview');
    const [showEdit, setShowEdit] = useState(false);

    const fetchAll = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [patRes, visRes, docRes] = await Promise.all([
                patientsApi.getById(id),
                crmApi.getHistory(id),
                doctorsApi.active(),
            ]);
            setPatient(patRes.data.data);
            setVisits(visRes.data.data.data || []);
            setDoctors(docRes.data.data);

            // Calls + Moods — optional
            try {
                const callRes = await callsApi.list({ patientId: id, limit: 20 });
                setCalls(callRes.data.data || []);
            } catch { /* ignore */ }

            try {
                const moodRes = await crmApi.getMoodLog(id);
                setMoods(moodRes.data.data.data || []);
            } catch { /* ignore */ }

        } catch (err) {
            showToast('Failed to load patient', 'error');
            navigate('/patients');
        } finally {
            setLoading(false);
        }
    }, [id, navigate, showToast]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!patient) return null;

    const TABS = [
        { key: 'overview', label: 'Overview', icon: User },
        { key: 'visits', label: `Visits (${visits.length})`, icon: Stethoscope },
        { key: 'calls', label: `Calls (${calls.length})`, icon: Phone },
        { key: 'mood', label: `Mood (${moods.length})`, icon: Brain },
    ] as const;

    return (
        <div className="space-y-5 max-w-5xl mx-auto">

            {/* ─── Back + Header ──────────────────────────────────────────────── */}
            <div className="flex items-start gap-4">
                <button
                    onClick={() => navigate('/patients')}
                    className="p-2 hover:bg-dark-hover rounded-lg transition-colors text-dark-muted
                     hover:text-dark-text mt-0.5"
                >
                    <ArrowLeft size={18} />
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-2xl bg-primary-600/20 flex items-center
                            justify-center flex-shrink-0">
                            <span className="text-lg font-bold text-primary-400">
                                {patient.name.charAt(0)}
                            </span>
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-xl font-bold text-dark-text">{patient.name}</h2>
                                {patient.crmTags.filter(t => t !== 'deleted').map(tag => (
                                    <TagBadge key={tag} tag={tag} />
                                ))}
                            </div>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="text-sm text-dark-muted flex items-center gap-1">
                                    <Phone size={12} /> {patient.phone}
                                </span>
                                {patient.email && (
                                    <span className="text-sm text-dark-muted flex items-center gap-1">
                                        <Mail size={12} /> {patient.email}
                                    </span>
                                )}
                                {patient.gender && (
                                    <span className="text-sm text-dark-muted capitalize">{patient.gender}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setShowEdit(true)}
                    className="btn-secondary flex items-center gap-2 flex-shrink-0"
                >
                    <Edit2 size={14} /> Edit
                </button>
            </div>

            {/* ─── Quick Stats ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="card-sm text-center">
                    <p className="text-2xl font-bold text-dark-text">{patient.totalVisits}</p>
                    <p className="text-xs text-dark-muted mt-0.5">Total Visits</p>
                </div>
                <div className="card-sm text-center">
                    <div className="flex justify-center">
                        <MoodBadge mood={patient.lastMood} size="md" />
                    </div>
                    <p className="text-xs text-dark-muted mt-1">Last Mood</p>
                </div>
                <div className="card-sm text-center">
                    <p className="text-sm font-semibold text-dark-text">
                        {patient.lastVisitDate
                            ? format(new Date(patient.lastVisitDate), 'MMM d')
                            : '—'
                        }
                    </p>
                    <p className="text-xs text-dark-muted mt-0.5">Last Visit</p>
                </div>
                <div className="card-sm text-center">
                    <p className="text-sm font-semibold text-dark-text capitalize">
                        {patient.preferredTimeSlot || '—'}
                    </p>
                    <p className="text-xs text-dark-muted mt-0.5">Preferred Time</p>
                </div>
            </div>

            {/* ─── Tabs ────────────────────────────────────────────────────────── */}
            <div className="flex gap-1 bg-dark-card border border-dark-border rounded-xl p-1">
                {TABS.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`
              flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg
              text-sm font-medium transition-colors
              ${tab === key
                                ? 'bg-primary-600/20 text-primary-400'
                                : 'text-dark-muted hover:text-dark-text'
                            }
            `}
                    >
                        <Icon size={15} />
                        <span className="hidden sm:inline">{label}</span>
                    </button>
                ))}
            </div>

            {/* ─── Tab Content ─────────────────────────────────────────────────── */}

            {/* Overview */}
            {tab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Patient info card */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="card">
                            <h3 className="font-semibold text-dark-text mb-4 flex items-center gap-2">
                                <User size={16} /> Patient Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {[
                                    { label: 'Full Name', value: patient.name },
                                    { label: 'Phone', value: patient.phone },
                                    { label: 'Email', value: patient.email || '—' },
                                    { label: 'Gender', value: patient.gender || '—' },
                                    { label: 'Date of Birth', value: patient.dateOfBirth ? format(new Date(patient.dateOfBirth), 'MMM d, yyyy') : '—' },
                                    { label: 'Pref. Time', value: patient.preferredTimeSlot || '—' },
                                    { label: 'Pref. Doctor', value: patient.preferredDoctor ? `Dr. ${patient.preferredDoctor.name}` : '—' },
                                    { label: 'Patient Since', value: format(new Date(patient.createdAt), 'MMM d, yyyy') },
                                ].map(({ label, value }) => (
                                    <div key={label}>
                                        <p className="text-xs text-dark-muted">{label}</p>
                                        <p className="text-dark-text font-medium mt-0.5 truncate">{value}</p>
                                    </div>
                                ))}
                            </div>

                            {patient.notes && (
                                <div className="mt-4 pt-4 border-t border-dark-border">
                                    <p className="text-xs text-dark-muted mb-1">Notes</p>
                                    <p className="text-sm text-dark-text">{patient.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Last complaint */}
                        {patient.lastComplaint && (
                            <div className="card-sm flex items-start gap-3">
                                <div className="p-2 bg-orange-500/10 rounded-lg">
                                    <AlertTriangle size={16} className="text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-dark-muted">Last Chief Complaint</p>
                                    <p className="text-sm font-medium text-dark-text mt-0.5">
                                        {patient.lastComplaint}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Recent visits sidebar */}
                    <div>
                        <h3 className="font-semibold text-dark-text mb-3 text-sm">
                            Recent Visits
                        </h3>
                        {visits.length > 0 ? (
                            <div className="space-y-0">
                                {visits.slice(0, 3).map(v => (
                                    <VisitCard key={v.id} visit={v} />
                                ))}
                                {visits.length > 3 && (
                                    <button
                                        onClick={() => setTab('visits')}
                                        className="text-xs text-primary-400 hover:underline pl-8"
                                    >
                                        View all {visits.length} visits →
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="card-sm text-center py-6">
                                <Stethoscope size={24} className="text-dark-border mx-auto mb-2" />
                                <p className="text-xs text-dark-muted">No visits yet</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Visits Tab */}
            {tab === 'visits' && (
                <div>
                    {visits.length === 0 ? (
                        <div className="card text-center py-12">
                            <Stethoscope size={32} className="text-dark-border mx-auto mb-3" />
                            <p className="text-dark-muted">No visit history yet</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {visits.map(v => <VisitCard key={v.id} visit={v} />)}
                        </div>
                    )}
                </div>
            )}

            {/* Calls Tab */}
            {tab === 'calls' && (
                <div className="card p-0 overflow-hidden">
                    {calls.length === 0 ? (
                        <div className="text-center py-12">
                            <Phone size={32} className="text-dark-border mx-auto mb-3" />
                            <p className="text-dark-muted">No calls recorded</p>
                        </div>
                    ) : (
                        calls.map((call, i) => (
                            <div
                                key={call.id}
                                className={`flex items-center gap-4 px-4 py-3.5
                            ${i < calls.length - 1 ? 'border-b border-dark-border/50' : ''}`}
                            >
                                {/* Direction indicator */}
                                <div className={`p-2 rounded-lg ${call.direction === 'inbound'
                                        ? 'bg-green-500/10 text-green-400'
                                        : 'bg-blue-500/10 text-blue-400'
                                    }`}>
                                    <Phone size={14} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-medium text-dark-text capitalize">
                                            {call.direction} call
                                        </p>
                                        <StatusBadge status={call.status} />
                                        {call.dominantMood && <MoodBadge mood={call.dominantMood} />}
                                    </div>
                                    <p className="text-xs text-dark-muted mt-0.5">
                                        {call.startedAt
                                            ? format(new Date(call.startedAt), 'MMM d, yyyy • h:mm a')
                                            : format(new Date(call.createdAt), 'MMM d, yyyy')
                                        }
                                        {call.duration && ` • ${Math.floor(call.duration / 60)}m ${call.duration % 60}s`}
                                    </p>
                                </div>

                                {call.avgIntensity != null && (
                                    <div className="text-right">
                                        <p className="text-xs text-dark-muted">Intensity</p>
                                        <p className={`text-sm font-bold ${call.avgIntensity > 0.6 ? 'text-red-400' :
                                                call.avgIntensity > 0.3 ? 'text-orange-400' : 'text-green-400'
                                            }`}>
                                            {Math.round(call.avgIntensity * 100)}%
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Mood Tab */}
            {tab === 'mood' && (
                <div className="space-y-3">
                    {moods.length === 0 ? (
                        <div className="card text-center py-12">
                            <Brain size={32} className="text-dark-border mx-auto mb-3" />
                            <p className="text-dark-muted">No mood events recorded</p>
                        </div>
                    ) : (
                        <>
                            {/* Mood summary */}
                            <div className="card">
                                <h3 className="font-semibold text-dark-text mb-3 text-sm">Mood History Summary</h3>
                                <div className="flex flex-wrap gap-3">
                                    {Object.entries(
                                        moods.reduce((acc, m) => {
                                            acc[m.detectedMood] = (acc[m.detectedMood] || 0) + 1;
                                            return acc;
                                        }, {} as Record<string, number>)
                                    ).sort(([, a], [, b]) => b - a).map(([mood, count]) => (
                                        <div key={mood} className="flex items-center gap-2">
                                            <MoodBadge mood={mood} />
                                            <span className="text-xs text-dark-muted">×{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Mood events list */}
                            <div className="card p-0 overflow-hidden">
                                {moods.slice(0, 30).map((m, i) => (
                                    <div
                                        key={m.id}
                                        className={`flex items-center gap-4 px-4 py-3
                                ${i < moods.length - 1 ? 'border-b border-dark-border/50' : ''}`}
                                    >
                                        <MoodBadge mood={m.detectedMood} />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-dark-border rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${m.intensity > 0.6 ? 'bg-red-400' :
                                                                m.intensity > 0.3 ? 'bg-orange-400' : 'bg-green-400'
                                                            }`}
                                                        style={{ width: `${m.intensity * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-dark-muted w-8 text-right">
                                                    {Math.round(m.intensity * 100)}%
                                                </span>
                                            </div>
                                            {m.aiActionTaken && (
                                                <p className="text-[10px] text-primary-400 mt-0.5">
                                                    Action: {m.aiActionTaken}
                                                </p>
                                            )}
                                        </div>

                                        <p className="text-xs text-dark-muted whitespace-nowrap">
                                            {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ─── Edit Modal ───────────────────────────────────────────────────── */}
            <Modal
                open={showEdit}
                onClose={() => setShowEdit(false)}
                title={`Edit — ${patient.name}`}
                size="md"
            >
                <EditPatientForm
                    patient={patient}
                    doctors={doctors}
                    onSave={(updated) => {
                        setPatient(updated);
                        setShowEdit(false);
                    }}
                    onCancel={() => setShowEdit(false)}
                />
            </Modal>
        </div>
    );
}
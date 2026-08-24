import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Filter, X,
    Phone, Tag, User,
} from 'lucide-react';
import { patientsApi, doctorsApi } from '../lib/api';
import MoodBadge from '../components/ui/MoodBadge';
import StatusBadge from '../components/ui/StatusBadge';
import Spinner from '../components/ui/Spinner';
import Empty from '../components/ui/Empty';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { format } from 'date-fns';
import { PatientRowSkeleton } from '../components/ui/Skeleton';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Patient {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    gender: string | null;
    totalVisits: number;
    lastVisitDate: string | null;
    lastComplaint: string | null;
    lastMood: string | null;
    crmTags: string[];
    preferredTimeSlot: string | null;
    preferredDoctor: { id: string; name: string; specialty: string | null } | null;
    createdAt: string;
}

interface Doctor {
    id: string;
    name: string;
    specialty: string | null;
}

const TAG_COLORS: Record<string, string> = {
    'VIP': 'bg-yellow-500/20 text-yellow-400',
    'anxious': 'bg-purple-500/20 text-purple-400',
    'high-risk': 'bg-red-500/20 text-red-400',
    'chronic-pain': 'bg-orange-500/20 text-orange-400',
    'needs-followup': 'bg-blue-500/20 text-blue-400',
    'needs-attention': 'bg-pink-500/20 text-pink-400',
    'new-patient': 'bg-green-500/20 text-green-400',
};

function TagBadge({ tag }: { tag: string }) {
    const color = TAG_COLORS[tag] || 'bg-slate-500/20 text-slate-400';
    return <span className={`badge text-[10px] ${color}`}>{tag}</span>;
}

// ─── Add Patient Form ─────────────────────────────────────────────────────────
interface AddPatientFormProps {
    doctors: Doctor[];
    onSave: () => void;
    onCancel: () => void;
}

function AddPatientForm({ doctors, onSave, onCancel }: AddPatientFormProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        gender: '',
        dateOfBirth: '',
        preferredDoctorId: '',
        preferredTimeSlot: '',
        notes: '',
        crmTags: [] as string[],
    });
    const [tagInput, setTagInput] = useState('');

    function set(key: string, value: string) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    function addTag() {
        const t = tagInput.trim();
        if (t && !form.crmTags.includes(t)) {
            setForm(prev => ({ ...prev, crmTags: [...prev.crmTags, t] }));
        }
        setTagInput('');
    }

    function removeTag(tag: string) {
        setForm(prev => ({ ...prev, crmTags: prev.crmTags.filter(t => t !== tag) }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await patientsApi.create({
                ...form,
                email: form.email || undefined,
                dateOfBirth: form.dateOfBirth || undefined,
                preferredDoctorId: form.preferredDoctorId || undefined,
                preferredTimeSlot: form.preferredTimeSlot || undefined,
                notes: form.notes || undefined,
                gender: form.gender || undefined,
            });
            showToast('Patient created successfully', 'success');
            onSave();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Failed to create patient', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-dark-muted mb-1.5">Full Name *</label>
                    <input
                        className="input"
                        placeholder="Ahmed Khan"
                        value={form.name}
                        onChange={e => set('name', e.target.value)}
                        required
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-xs text-dark-muted mb-1.5">Phone *</label>
                    <input
                        className="input"
                        placeholder="+923001234567"
                        value={form.phone}
                        onChange={e => set('phone', e.target.value)}
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-dark-muted mb-1.5">Email</label>
                    <input
                        className="input"
                        type="email"
                        placeholder="patient@email.com"
                        value={form.email}
                        onChange={e => set('email', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs text-dark-muted mb-1.5">Gender</label>
                    <select
                        className="input"
                        value={form.gender}
                        onChange={e => set('gender', e.target.value)}
                    >
                        <option value="">Select...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-dark-muted mb-1.5">Date of Birth</label>
                    <input
                        className="input"
                        type="date"
                        value={form.dateOfBirth}
                        onChange={e => set('dateOfBirth', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs text-dark-muted mb-1.5">Preferred Time</label>
                    <select
                        className="input"
                        value={form.preferredTimeSlot}
                        onChange={e => set('preferredTimeSlot', e.target.value)}
                    >
                        <option value="">Any time</option>
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="evening">Evening</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs text-dark-muted mb-1.5">Preferred Doctor</label>
                <select
                    className="input"
                    value={form.preferredDoctorId}
                    onChange={e => set('preferredDoctorId', e.target.value)}
                >
                    <option value="">No preference</option>
                    {doctors.map(d => (
                        <option key={d.id} value={d.id}>
                            {d.name}{d.specialty ? ` — ${d.specialty}` : ''}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs text-dark-muted mb-1.5">CRM Tags</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                    {form.crmTags.map(tag => (
                        <span key={tag} className="badge bg-primary-600/20 text-primary-400 gap-1">
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)}>
                                <X size={10} />
                            </button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        className="input"
                        placeholder="Add tag... (e.g. VIP)"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    />
                    <button type="button" onClick={addTag} className="btn-secondary px-3">
                        Add
                    </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {['VIP', 'chronic-pain', 'anxious', 'new-patient'].map(t => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => { if (!form.crmTags.includes(t)) setForm(p => ({ ...p, crmTags: [...p.crmTags, t] })); }}
                            className="text-[10px] text-dark-muted hover:text-dark-text border border-dark-border
                         rounded px-2 py-0.5 transition-colors"
                        >
                            + {t}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs text-dark-muted mb-1.5">Notes</label>
                <textarea
                    className="input resize-none"
                    rows={2}
                    placeholder="Any special notes..."
                    value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onCancel} className="btn-secondary">
                    Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                    {loading && <Spinner size="sm" />}
                    {loading ? 'Creating...' : 'Create Patient'}
                </button>
            </div>
        </form>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Patients() {
    const navigate = useNavigate();

    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [tagFilter, setTagFilter] = useState('');
    const [moodFilter, setMoodFilter] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const LIMIT = 20;

    const fetchPatients = useCallback(async () => {
        setLoading(true);
        try {
            const res = await patientsApi.list({
                page,
                limit: LIMIT,
                search: search || undefined,
                tag: tagFilter || undefined,
                mood: moodFilter || undefined,
            });
            setPatients(res.data.data);
            setTotal(res.data.total);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, search, tagFilter, moodFilter]);

    useEffect(() => { fetchPatients(); }, [fetchPatients]);

    useEffect(() => {
        doctorsApi.active().then(r => setDoctors(r.data.data)).catch(() => { });
    }, []);

    // Reset page on filter change
    useEffect(() => { setPage(1); }, [search, tagFilter, moodFilter]);

    function clearFilters() {
        setSearch('');
        setTagFilter('');
        setMoodFilter('');
    }

    const hasFilters = search || tagFilter || moodFilter;

    return (
        <div className="space-y-5">

            {/* ─── Toolbar ──────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3">

                {/* Search */}
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
                    <input
                        className="input pl-9"
                        placeholder="Search by name, phone, or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Tag filter */}
                <select
                    className="input w-full sm:w-40"
                    value={tagFilter}
                    onChange={e => setTagFilter(e.target.value)}
                >
                    <option value="">All Tags</option>
                    <option value="VIP">VIP</option>
                    <option value="anxious">Anxious</option>
                    <option value="high-risk">High Risk</option>
                    <option value="chronic-pain">Chronic Pain</option>
                    <option value="needs-followup">Needs Followup</option>
                    <option value="new-patient">New Patient</option>
                </select>

                {/* Mood filter */}
                <select
                    className="input w-full sm:w-36"
                    value={moodFilter}
                    onChange={e => setMoodFilter(e.target.value)}
                >
                    <option value="">All Moods</option>
                    <option value="calm">Calm</option>
                    <option value="happy">Happy</option>
                    <option value="frustrated">Frustrated</option>
                    <option value="anxious">Anxious</option>
                    <option value="angry">Angry</option>
                </select>

                {/* Clear filters */}
                {hasFilters && (
                    <button onClick={clearFilters} className="btn-secondary flex items-center gap-1.5">
                        <X size={14} /> Clear
                    </button>
                )}

                {/* Add patient */}
                <button
                    onClick={() => setShowAdd(true)}
                    className="btn-primary flex items-center gap-2 whitespace-nowrap"
                >
                    <Plus size={16} /> New Patient
                </button>
            </div>

            {/* ─── Stats bar ────────────────────────────────────────────────── */}
            <div className="flex items-center gap-4 text-sm">
                <span className="text-dark-muted">
                    <span className="text-dark-text font-medium">{total}</span> patients
                    {hasFilters && ' found'}
                </span>
                {hasFilters && (
                    <span className="text-xs text-primary-400 flex items-center gap-1">
                        <Filter size={12} /> Filtered
                    </span>
                )}
            </div>

            {/* ─── Table ────────────────────────────────────────────────────── */}
            <div className="card p-0 overflow-hidden">
                {loading ? (
                    <>
                        <div>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <PatientRowSkeleton key={i} />
                            ))}
                        </div>
                        <div className="flex items-center justify-center py-16">
                            <Spinner />
                        </div>
                    </>
                ) : patients.length === 0 ? (
                    <Empty
                        icon={User}
                        title="No patients found"
                        message={hasFilters ? 'Try clearing your filters' : 'Add your first patient to get started'}
                        action={
                            !hasFilters ? (
                                <button onClick={() => setShowAdd(true)} className="btn-primary">
                                    Add Patient
                                </button>
                            ) : (
                                <button onClick={clearFilters} className="btn-secondary">
                                    Clear Filters
                                </button>
                            )
                        }
                    />
                ) : (
                    <>
                        {/* Table header */}
                        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-dark-border
                            text-xs font-medium text-dark-muted uppercase tracking-wide">
                            <div className="col-span-3">Patient</div>
                            <div className="col-span-2">Phone</div>
                            <div className="col-span-1 text-center">Visits</div>
                            <div className="col-span-2">Last Visit</div>
                            <div className="col-span-2">Mood</div>
                            <div className="col-span-2">Tags</div>
                        </div>

                        {/* Table rows */}
                        {patients.map(patient => (
                            <div
                                key={patient.id}
                                onClick={() => navigate(`/patients/${patient.id}`)}
                                className="grid grid-cols-12 gap-2 px-4 py-3.5 border-b border-dark-border/50
                           last:border-0 cursor-pointer hover:bg-dark-hover/50 transition-colors
                           items-center"
                            >
                                {/* Name + Doctor */}
                                <div className="col-span-3 min-w-0">
                                    <p className="text-sm font-medium text-dark-text truncate">{patient.name}</p>
                                    {patient.preferredDoctor && (
                                        <p className="text-xs text-dark-muted truncate">
                                            Dr. {patient.preferredDoctor.name}
                                        </p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div className="col-span-2">
                                    <p className="text-sm text-dark-muted flex items-center gap-1">
                                        <Phone size={11} /> {patient.phone}
                                    </p>
                                </div>

                                {/* Visits */}
                                <div className="col-span-1 text-center">
                                    <span className={`
                    inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
                    ${patient.totalVisits > 0
                                            ? 'bg-primary-600/20 text-primary-400'
                                            : 'bg-dark-border text-dark-muted'
                                        }
                  `}>
                                        {patient.totalVisits}
                                    </span>
                                </div>

                                {/* Last Visit */}
                                <div className="col-span-2">
                                    <p className="text-xs text-dark-muted">
                                        {patient.lastVisitDate
                                            ? format(new Date(patient.lastVisitDate), 'MMM d, yyyy')
                                            : '—'
                                        }
                                    </p>
                                    {patient.lastComplaint && (
                                        <p className="text-[10px] text-dark-muted/70 truncate">
                                            {patient.lastComplaint}
                                        </p>
                                    )}
                                </div>

                                {/* Mood */}
                                <div className="col-span-2">
                                    <MoodBadge mood={patient.lastMood} />
                                </div>

                                {/* Tags */}
                                <div className="col-span-2 flex flex-wrap gap-1">
                                    {patient.crmTags
                                        .filter(t => t !== 'deleted')
                                        .slice(0, 2)
                                        .map(tag => <TagBadge key={tag} tag={tag} />)
                                    }
                                    {patient.crmTags.filter(t => t !== 'deleted').length > 2 && (
                                        <span className="badge bg-dark-border text-dark-muted text-[10px]">
                                            +{patient.crmTags.filter(t => t !== 'deleted').length - 2}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
                        <div className="px-4 pb-4">
                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                total={total}
                                limit={LIMIT}
                                onPage={setPage}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* ─── Add Patient Modal ─────────────────────────────────────────── */}
            <Modal
                open={showAdd}
                onClose={() => setShowAdd(false)}
                title="Add New Patient"
                size="md"
            >
                <AddPatientForm
                    doctors={doctors}
                    onSave={() => { setShowAdd(false); fetchPatients(); }}
                    onCancel={() => setShowAdd(false)}
                />
            </Modal>
        </div>
    );
}
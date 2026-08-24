import { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, Calendar, Clock,
    Check, X, UserX, ChevronRight,
    Filter, Phone, Stethoscope, User,
} from 'lucide-react';
import { appointmentsApi, patientsApi, doctorsApi } from '../lib/api';
import StatusBadge from '../components/ui/StatusBadge';
import MoodBadge from '../components/ui/MoodBadge';
import Spinner from '../components/ui/Spinner';
import Empty from '../components/ui/Empty';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { useToast } from '../components/ui/Toast';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Appointment {
    id: string;
    appointmentDate: string;
    duration: number;
    status: string;
    type: string;
    notes: string | null;
    reminderSent: boolean;
    createdAt: string;
    patient: { id: string; name: string; phone: string };
    doctor: { id: string; name: string; specialty: string | null } | null;
}

interface Patient { id: string; name: string; phone: string; }
interface Doctor { id: string; name: string; specialty: string | null; }

// ─── Date label helper ────────────────────────────────────────────────────────
function dateLabel(dateStr: string): string {
    const d = new Date(dateStr);
    if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`;
    if (isTomorrow(d)) return `Tomorrow, ${format(d, 'h:mm a')}`;
    return format(d, 'EEE, MMM d • h:mm a');
}

// ─── Add Appointment Form ─────────────────────────────────────────────────────
function AddAppointmentForm({
    patients, doctors, onSave, onCancel,
}: {
    patients: Patient[]; doctors: Doctor[];
    onSave: () => void; onCancel: () => void;
}) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [patSearch, setPatSearch] = useState('');
    const [form, setForm] = useState({
        patientId: '',
        doctorId: '',
        appointmentDate: '',
        appointmentTime: '09:00',
        duration: 30,
        type: 'general',
        notes: '',
    });

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(patSearch.toLowerCase()) ||
        p.phone.includes(patSearch)
    );

    function set(key: string, value: any) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.patientId) { showToast('Select a patient', 'error'); return; }
        if (!form.appointmentDate) { showToast('Select a date', 'error'); return; }

        setLoading(true);
        try {
            const datetime = `${form.appointmentDate}T${form.appointmentTime}:00.000Z`;
            await appointmentsApi.create({
                patientId: form.patientId,
                doctorId: form.doctorId || undefined,
                appointmentDate: datetime,
                duration: form.duration,
                type: form.type,
                notes: form.notes || undefined,
            });
            showToast('Appointment created! SMS sent.', 'success');
            onSave();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Failed to create', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Patient search */}
            <div>
                <label className="block text-xs text-dark-muted mb-1.5">Patient *</label>
                <input
                    className="input mb-2"
                    placeholder="Search patient..."
                    value={patSearch}
                    onChange={e => setPatSearch(e.target.value)}
                />
                {form.patientId ? (
                    <div className="flex items-center justify-between p-2 bg-primary-600/10
                          border border-primary-600/30 rounded-lg">
                        <p className="text-sm text-primary-400">
                            {patients.find(p => p.id === form.patientId)?.name}
                        </p>
                        <button type="button" onClick={() => set('patientId', '')}
                            className="text-dark-muted hover:text-dark-text">
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="max-h-36 overflow-y-auto border border-dark-border rounded-lg">
                        {filteredPatients.slice(0, 8).map(p => (
                            <button
                                key={p.id} type="button"
                                onClick={() => { set('patientId', p.id); setPatSearch(p.name); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-dark-hover
                           transition-colors text-left border-b border-dark-border/50 last:border-0"
                            >
                                <div className="w-7 h-7 rounded-full bg-primary-600/20 flex items-center
                                justify-center flex-shrink-0">
                                    <span className="text-xs font-bold text-primary-400">
                                        {p.name.charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-dark-text">{p.name}</p>
                                    <p className="text-xs text-dark-muted">{p.phone}</p>
                                </div>
                            </button>
                        ))}
                        {filteredPatients.length === 0 && (
                            <p className="text-xs text-dark-muted px-3 py-4 text-center">No patients found</p>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-dark-muted mb-1.5">Date *</label>
                    <input
                        type="date"
                        className="input"
                        value={form.appointmentDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => set('appointmentDate', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs text-dark-muted mb-1.5">Time *</label>
                    <input
                        type="time"
                        className="input"
                        value={form.appointmentTime}
                        onChange={e => set('appointmentTime', e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-dark-muted mb-1.5">Doctor</label>
                    <select className="input" value={form.doctorId} onChange={e => set('doctorId', e.target.value)}>
                        <option value="">Any doctor</option>
                        {doctors.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-dark-muted mb-1.5">Type</label>
                    <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                        <option value="general">General</option>
                        <option value="follow_up">Follow-up</option>
                        <option value="new_patient">New Patient</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs text-dark-muted mb-1.5">Duration</label>
                <div className="flex gap-2">
                    {[15, 30, 45, 60].map(d => (
                        <button
                            key={d} type="button"
                            onClick={() => set('duration', d)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                ${form.duration === d
                                    ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                                    : 'border border-dark-border text-dark-muted hover:border-dark-hover'
                                }`}
                        >
                            {d}m
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs text-dark-muted mb-1.5">Notes</label>
                <textarea
                    className="input resize-none" rows={2}
                    value={form.notes} onChange={e => set('notes', e.target.value)}
                    placeholder="Optional notes..."
                />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                    {loading && <Spinner size="sm" />}
                    {loading ? 'Creating...' : 'Book Appointment'}
                </button>
            </div>
        </form>
    );
}

// ─── Appointment Detail Panel ─────────────────────────────────────────────────
function AppointmentPanel({
    appt, onClose, onStatusChange,
}: {
    appt: Appointment; onClose: () => void;
    onStatusChange: (id: string, status: string) => void;
}) {
    const { showToast } = useToast();
    const [updating, setUpdating] = useState<string | null>(null);

    async function changeStatus(status: string) {
        setUpdating(status);
        try {
            await appointmentsApi.update(appt.id, { status });
            onStatusChange(appt.id, status);
            showToast(`Appointment ${status}`, 'success');
        } catch {
            showToast('Failed to update status', 'error');
        } finally {
            setUpdating(null);
        }
    }

    const isPastAppt = isPast(new Date(appt.appointmentDate));
    const isActive = ['scheduled', 'confirmed'].includes(appt.status);

    return (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-dark-card border-l
                    border-dark-border z-40 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border">
                <h3 className="font-semibold text-dark-text">Appointment Details</h3>
                <button onClick={onClose} className="text-dark-muted hover:text-dark-text">
                    <X size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Status + Type */}
                <div className="flex items-center gap-2">
                    <StatusBadge status={appt.status} />
                    <span className="badge bg-dark-border text-dark-muted capitalize">
                        {appt.type.replace('_', ' ')}
                    </span>
                    {appt.reminderSent && (
                        <span className="badge bg-green-500/10 text-green-400 text-[10px]">
                            Reminder sent
                        </span>
                    )}
                </div>

                {/* Date/Time */}
                <div className="card-sm flex items-center gap-3">
                    <div className="p-2 bg-primary-600/10 rounded-lg">
                        <Calendar size={18} className="text-primary-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-dark-text">
                            {format(new Date(appt.appointmentDate), 'EEEE, MMMM d yyyy')}
                        </p>
                        <p className="text-xs text-dark-muted">
                            {format(new Date(appt.appointmentDate), 'h:mm a')} • {appt.duration} min
                        </p>
                    </div>
                </div>

                {/* Patient */}
                <div>
                    <p className="text-xs text-dark-muted mb-2">Patient</p>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-600/20 flex items-center
                            justify-center">
                            <span className="text-sm font-bold text-primary-400">
                                {appt.patient.name.charAt(0)}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-dark-text">{appt.patient.name}</p>
                            <p className="text-xs text-dark-muted flex items-center gap-1">
                                <Phone size={10} /> {appt.patient.phone}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Doctor */}
                {appt.doctor && (
                    <div>
                        <p className="text-xs text-dark-muted mb-2">Doctor</p>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center
                              justify-center">
                                <Stethoscope size={16} className="text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-dark-text">Dr. {appt.doctor.name}</p>
                                {appt.doctor.specialty && (
                                    <p className="text-xs text-dark-muted">{appt.doctor.specialty}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Notes */}
                {appt.notes && (
                    <div>
                        <p className="text-xs text-dark-muted mb-1.5">Notes</p>
                        <p className="text-sm text-dark-text bg-dark-bg/50 rounded-lg p-3">
                            {appt.notes}
                        </p>
                    </div>
                )}

                {/* Actions */}
                {isActive && (
                    <div>
                        <p className="text-xs text-dark-muted mb-2">Actions</p>
                        <div className="space-y-2">
                            {appt.status === 'scheduled' && (
                                <button
                                    onClick={() => changeStatus('confirmed')}
                                    disabled={!!updating}
                                    className="w-full flex items-center gap-2 justify-center py-2.5 rounded-lg
                             bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors
                             text-sm font-medium border border-green-500/20"
                                >
                                    {updating === 'confirmed' ? <Spinner size="sm" /> : <Check size={15} />}
                                    Confirm
                                </button>
                            )}
                            {appt.status === 'confirmed' && (
                                <button
                                    onClick={() => changeStatus('completed')}
                                    disabled={!!updating}
                                    className="w-full flex items-center gap-2 justify-center py-2.5 rounded-lg
                             bg-primary-600/10 text-primary-400 hover:bg-primary-600/20 transition-colors
                             text-sm font-medium border border-primary-600/20"
                                >
                                    {updating === 'completed' ? <Spinner size="sm" /> : <Check size={15} />}
                                    Mark Completed
                                </button>
                            )}
                            <button
                                onClick={() => changeStatus('no_show')}
                                disabled={!!updating}
                                className="w-full flex items-center gap-2 justify-center py-2.5 rounded-lg
                           bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors
                           text-sm font-medium border border-orange-500/20"
                            >
                                {updating === 'no_show' ? <Spinner size="sm" /> : <UserX size={15} />}
                                No Show
                            </button>
                            <button
                                onClick={() => changeStatus('cancelled')}
                                disabled={!!updating}
                                className="w-full flex items-center gap-2 justify-center py-2.5 rounded-lg
                           bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors
                           text-sm font-medium border border-red-500/20"
                            >
                                {updating === 'cancelled' ? <Spinner size="sm" /> : <X size={15} />}
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Appointments() {
    const { showToast } = useToast();

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [selected, setSelected] = useState<Appointment | null>(null);

    // Filters
    const [range, setRange] = useState<'today' | '7days' | '30days' | 'all'>('7days');
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const LIMIT = 25;

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await appointmentsApi.list({
                range,
                status: statusFilter || undefined,
                page,
                limit: LIMIT,
            });
            setAppointments(res.data.data);
            setTotal(res.data.total || 0);
            setTotalPages(res.data.totalPages || 1);
        } catch {
            showToast('Failed to load appointments', 'error');
        } finally {
            setLoading(false);
        }
    }, [range, statusFilter, page]);

    useEffect(() => { fetchAppointments(); }, [fetchAppointments]);
    useEffect(() => {
        patientsApi.list({ limit: 200 }).then(r => setPatients(r.data.data)).catch(() => { });
        doctorsApi.active().then(r => setDoctors(r.data.data)).catch(() => { });
    }, []);
    useEffect(() => { setPage(1); }, [range, statusFilter]);

    // Filter by search client-side
    const filtered = search
        ? appointments.filter(a =>
            a.patient.name.toLowerCase().includes(search.toLowerCase()) ||
            a.patient.phone.includes(search)
        )
        : appointments;

    function handleStatusChange(id: string, status: string) {
        setAppointments(prev =>
            prev.map(a => a.id === id ? { ...a, status } : a)
        );
        if (selected?.id === id) {
            setSelected(prev => prev ? { ...prev, status } : null);
        }
    }

    return (
        <div className="space-y-5">

            {/* Overlay for panel on mobile */}
            {selected && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 sm:hidden"
                    onClick={() => setSelected(null)}
                />
            )}

            {/* ─── Toolbar ──────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
                    <input
                        className="input pl-9"
                        placeholder="Search patient..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Range tabs */}
                <div className="flex bg-dark-card border border-dark-border rounded-lg p-1 gap-0.5">
                    {([
                        ['today', 'Today'],
                        ['7days', '7 Days'],
                        ['30days', '30 Days'],
                        ['all', 'All'],
                    ] as const).map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => setRange(val)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${range === val
                                    ? 'bg-primary-600/20 text-primary-400'
                                    : 'text-dark-muted hover:text-dark-text'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Status filter */}
                <select
                    className="input w-full sm:w-36"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                </select>

                <button
                    onClick={() => setShowAdd(true)}
                    className="btn-primary flex items-center gap-2 whitespace-nowrap"
                >
                    <Plus size={16} /> New
                </button>
            </div>

            {/* ─── Stats ────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 text-sm">
                <span className="text-dark-muted">
                    <span className="text-dark-text font-medium">{total}</span> appointments
                </span>
                {/* Quick counts */}
                {['scheduled', 'confirmed', 'completed', 'cancelled'].map(s => {
                    const count = appointments.filter(a => a.status === s).length;
                    if (!count) return null;
                    return (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s === statusFilter ? '' : s)}
                            className="text-xs"
                        >
                            <StatusBadge status={s} />
                            <span className="ml-1 text-dark-muted">{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* ─── List ─────────────────────────────────────────────────────── */}
            <div className={`card p-0 overflow-hidden transition-all ${selected ? 'mr-0 sm:mr-96' : ''}`}>
                {loading ? (
                    <div className="flex items-center justify-center py-16"><Spinner /></div>
                ) : filtered.length === 0 ? (
                    <Empty
                        icon={Calendar}
                        title="No appointments found"
                        action={
                            <button onClick={() => setShowAdd(true)} className="btn-primary">
                                Book Appointment
                            </button>
                        }
                    />
                ) : (
                    <>
                        {/* Header */}
                        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-dark-border
                            text-xs font-medium text-dark-muted uppercase tracking-wide">
                            <div className="col-span-3">Patient</div>
                            <div className="col-span-3">Date & Time</div>
                            <div className="col-span-2">Doctor</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2">Type</div>
                        </div>

                        {filtered.map(appt => {
                            const isSelected = selected?.id === appt.id;
                            const isPastAppt = isPast(new Date(appt.appointmentDate)) &&
                                !['completed', 'cancelled', 'no_show'].includes(appt.status);

                            return (
                                <div
                                    key={appt.id}
                                    onClick={() => setSelected(isSelected ? null : appt)}
                                    className={`
                    grid grid-cols-12 gap-2 px-4 py-3.5 border-b border-dark-border/50
                    last:border-0 cursor-pointer transition-colors items-center
                    ${isSelected ? 'bg-primary-600/5 border-l-2 border-l-primary-600' : 'hover:bg-dark-hover/50'}
                    ${isPastAppt ? 'opacity-60' : ''}
                  `}
                                >
                                    {/* Patient */}
                                    <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center
                                    justify-center flex-shrink-0">
                                            <span className="text-xs font-bold text-primary-400">
                                                {appt.patient.name.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-dark-text truncate">
                                                {appt.patient.name}
                                            </p>
                                            <p className="text-xs text-dark-muted flex items-center gap-1">
                                                <Phone size={9} /> {appt.patient.phone}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="col-span-3">
                                        <p className={`text-sm font-medium ${isToday(new Date(appt.appointmentDate))
                                            ? 'text-primary-400'
                                            : 'text-dark-text'
                                            }`}>
                                            {dateLabel(appt.appointmentDate)}
                                        </p>
                                        <p className="text-xs text-dark-muted">{appt.duration} min</p>
                                    </div>

                                    {/* Doctor */}
                                    <div className="col-span-2">
                                        <p className="text-sm text-dark-muted truncate">
                                            {appt.doctor ? `Dr. ${appt.doctor.name}` : '—'}
                                        </p>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2">
                                        <StatusBadge status={appt.status} />
                                    </div>

                                    {/* Type */}
                                    <div className="col-span-2 flex items-center justify-between">
                                        <span className="text-xs text-dark-muted capitalize">
                                            {appt.type.replace('_', ' ')}
                                        </span>
                                        <ChevronRight size={14} className="text-dark-border" />
                                    </div>
                                </div>
                            );
                        })}

                        {/* Pagination */}
                        <div className="px-4 pb-4">
                            <Pagination
                                page={page} totalPages={totalPages}
                                total={total} limit={LIMIT} onPage={setPage}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* ─── Slide-out Panel ──────────────────────────────────────────── */}
            {selected && (
                <AppointmentPanel
                    appt={selected}
                    onClose={() => setSelected(null)}
                    onStatusChange={handleStatusChange}
                />
            )}

            {/* ─── Add Modal ────────────────────────────────────────────────── */}
            <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Book Appointment" size="md">
                <AddAppointmentForm
                    patients={patients}
                    doctors={doctors}
                    onSave={() => { setShowAdd(false); fetchAppointments(); }}
                    onCancel={() => setShowAdd(false)}
                />
            </Modal>
        </div>
    );
}
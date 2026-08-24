import { useState, useEffect, useCallback } from 'react';
import {
    Stethoscope, Plus, Edit2, X, Calendar,
} from 'lucide-react';
import { doctorsApi } from '../lib/api';
import api from '../lib/api';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

interface Doctor {
    id: string;
    name: string;
    specialty: string | null;
    isActive: boolean;
    createdAt: string;
}

// ─── Doctor Form ──────────────────────────────────────────────────────────────
function DoctorForm({
    initial, onSave, onCancel,
}: { initial?: Doctor; onSave: () => void; onCancel: () => void }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: initial?.name || '',
        specialty: initial?.specialty || '',
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            if (initial) {
                await doctorsApi.update(initial.id, form);
                showToast('Doctor updated', 'success');
            } else {
                await doctorsApi.create(form);
                showToast('Doctor added', 'success');
            }
            onSave();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Failed', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs text-dark-muted mb-1.5">Full Name *</label>
                <input
                    className="input"
                    placeholder="Dr. Ahmed Khan"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    required
                    autoFocus
                />
            </div>
            <div>
                <label className="block text-xs text-dark-muted mb-1.5">Specialty</label>
                <input
                    className="input"
                    placeholder="General, Cardiology..."
                    value={form.specialty}
                    onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))}
                />
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                    {loading && <Spinner size="sm" />}
                    {initial ? 'Save Changes' : 'Add Doctor'}
                </button>
            </div>
        </form>
    );
}

// ─── Availability Manager ─────────────────────────────────────────────────────
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface AvailRow {
    id: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDurationMinutes: number;
}

function AvailabilityManager({ doctorId }: { doctorId: string }) {
    const { showToast } = useToast();
    const [avails, setAvails] = useState<AvailRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newRow, setNewRow] = useState({
        dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30,
    });

    useEffect(() => {
        api.get(`/doctors/${doctorId}/availability`)
            .then(r => setAvails(r.data.data || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [doctorId]);

    // AvailabilityManager function ke andar addAvail() mein yeh line change karo:

    async function addAvail() {
        try {
            await api.post('/doctors/availability', {
                doctorId: doctorId,           // ← parseInt hataya, seedha string
                dayOfWeek: newRow.dayOfWeek,
                startTime: newRow.startTime + ':00',
                endTime: newRow.endTime + ':00',
                slotDurationMinutes: newRow.slotDurationMinutes,
            });
            const r = await api.get(`/doctors/${doctorId}/availability`);
            setAvails(r.data.data || []);
            setAdding(false);
            showToast('Availability added', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Failed', 'error');
        }
    }

    async function deleteAvail(id: number) {
        try {
            await api.delete(`/doctors/availability/${id}`);
            setAvails(p => p.filter(a => a.id !== id));
            showToast('Removed', 'success');
        } catch {
            showToast('Failed to remove', 'error');
        }
    }

    if (loading) return <div className="py-4 flex justify-center"><Spinner size="sm" /></div>;

    return (
        <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-xs text-dark-muted font-medium uppercase tracking-wide">
                    Weekly Schedule
                </p>
                <button
                    onClick={() => setAdding(p => !p)}
                    className="text-xs text-primary-400 hover:underline flex items-center gap-1"
                >
                    <Plus size={12} /> Add Slot
                </button>
            </div>

            {adding && (
                <div className="p-3 bg-dark-bg/50 rounded-lg border border-dark-border space-y-2">
                    <div className="grid grid-cols-4 gap-2">
                        <select
                            className="input text-xs col-span-1"
                            value={newRow.dayOfWeek}
                            onChange={e => setNewRow(p => ({ ...p, dayOfWeek: parseInt(e.target.value) }))}
                        >
                            {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                        </select>
                        <input
                            type="time" className="input text-xs"
                            value={newRow.startTime}
                            onChange={e => setNewRow(p => ({ ...p, startTime: e.target.value }))}
                        />
                        <input
                            type="time" className="input text-xs"
                            value={newRow.endTime}
                            onChange={e => setNewRow(p => ({ ...p, endTime: e.target.value }))}
                        />
                        <select
                            className="input text-xs"
                            value={newRow.slotDurationMinutes}
                            onChange={e => setNewRow(p => ({ ...p, slotDurationMinutes: parseInt(e.target.value) }))}
                        >
                            <option value={15}>15m</option>
                            <option value={30}>30m</option>
                            <option value={45}>45m</option>
                            <option value={60}>60m</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setAdding(false)} className="btn-secondary py-1 px-3 text-xs">Cancel</button>
                        <button onClick={addAvail} className="btn-primary py-1 px-3 text-xs">Save</button>
                    </div>
                </div>
            )}

            {avails.length === 0 ? (
                <p className="text-xs text-dark-muted py-2 text-center">No schedule set</p>
            ) : (
                <div className="space-y-1">
                    {avails.map(a => (
                        <div key={a.id}
                            className="flex items-center justify-between py-1.5 px-3 rounded-lg
                         bg-dark-bg/30 text-xs">
                            <span className="text-dark-text font-medium w-8">{DAY_NAMES[a.dayOfWeek]}</span>
                            <span className="text-dark-muted">
                                {a.startTime.slice(0, 5)} — {a.endTime.slice(0, 5)}
                            </span>
                            <span className="text-primary-400">{a.slotDurationMinutes}m slots</span>
                            <button
                                onClick={() => deleteAvail(a.id)}
                                className="text-dark-muted hover:text-red-400 transition-colors"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Doctor Card ──────────────────────────────────────────────────────────────
function DoctorCard({
    doctor, onEdit, onDeactivate,
}: {
    doctor: Doctor;
    onEdit: (d: Doctor) => void;
    onDeactivate: (id: string) => void;
}) {
    const [showAvail, setShowAvail] = useState(false);

    return (
        <div className={`card-sm ${!doctor.isActive ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center
                          justify-center flex-shrink-0">
                        <Stethoscope size={18} className="text-green-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-dark-text">{doctor.name}</p>
                        <p className="text-xs text-dark-muted">
                            {doctor.specialty || 'General'} •{' '}
                            <span className={doctor.isActive ? 'text-green-400' : 'text-dark-muted'}>
                                {doctor.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowAvail(p => !p)}
                        className="p-1.5 text-dark-muted hover:text-dark-text rounded-lg hover:bg-dark-hover"
                        title="Schedule"
                    >
                        <Calendar size={15} />
                    </button>
                    <button
                        onClick={() => onEdit(doctor)}
                        className="p-1.5 text-dark-muted hover:text-dark-text rounded-lg hover:bg-dark-hover"
                        title="Edit"
                    >
                        <Edit2 size={15} />
                    </button>
                    {doctor.isActive && (
                        <button
                            onClick={() => onDeactivate(doctor.id)}
                            className="p-1.5 text-dark-muted hover:text-red-400 rounded-lg hover:bg-red-500/10"
                            title="Deactivate"
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>
            </div>

            {showAvail && <AvailabilityManager doctorId={doctor.id} />}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Doctors() {
    const { showToast } = useToast();

    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editDoc, setEditDoc] = useState<Doctor | null>(null);

    const fetchDoctors = useCallback(async () => {
        setLoading(true);
        try {
            const res = await doctorsApi.list();
            setDoctors(res.data.data || []);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

    async function handleDeactivate(id: string) {
        try {
            await doctorsApi.deactivate(id);
            fetchDoctors();
            showToast('Doctor deactivated', 'success');
        } catch {
            showToast('Failed', 'error');
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-dark-text flex items-center gap-2">
                        <Stethoscope size={18} className="text-primary-400" />
                        Doctors
                    </h2>
                    <p className="text-sm text-dark-muted mt-0.5">
                        {doctors.filter(d => d.isActive).length} active • {doctors.length} total
                    </p>
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={15} /> Add Doctor
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : doctors.length === 0 ? (
                <div className="card text-center py-12">
                    <Stethoscope size={32} className="text-dark-border mx-auto mb-3" />
                    <p className="text-dark-muted">No doctors added yet</p>
                    <button onClick={() => setShowAdd(true)} className="btn-primary mt-4">
                        Add First Doctor
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {doctors.map(doc => (
                        <DoctorCard
                            key={doc.id}
                            doctor={doc}
                            onEdit={d => setEditDoc(d)}
                            onDeactivate={handleDeactivate}
                        />
                    ))}
                </div>
            )}

            <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Doctor" size="sm">
                <DoctorForm
                    onSave={() => { setShowAdd(false); fetchDoctors(); }}
                    onCancel={() => setShowAdd(false)}
                />
            </Modal>

            <Modal
                open={!!editDoc}
                onClose={() => setEditDoc(null)}
                title={`Edit — ${editDoc?.name}`}
                size="sm"
            >
                {editDoc && (
                    <DoctorForm
                        initial={editDoc}
                        onSave={() => { setEditDoc(null); fetchDoctors(); }}
                        onCancel={() => setEditDoc(null)}
                    />
                )}
            </Modal>
        </div>
    );
}
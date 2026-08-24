import { useState, useEffect, useCallback } from 'react';
import {
    Users, Phone, Calendar,
    UserCheck, Brain, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { dashboardApi } from '../lib/api';
import StatCard from '../components/ui/StatCard';
import Spinner from '../components/ui/Spinner';
import MoodBadge from '../components/ui/MoodBadge';
import { format } from 'date-fns';

interface DashboardData {
    stats: {
        totalPatients: number;
        newPatientsThisMonth: number;
        callsToday: number;
        appointmentsToday: number;
        returningRate: number;
        avgMoodToday: string;
        activeDoctors: number;
    };
    appointmentBreakdown: {
        scheduled: number;
        confirmed: number;
        completed: number;
        cancelled: number;
        no_show: number;
    };
}

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
}

export default function Dashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await dashboardApi.overview();
            setData(res.data.data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Dashboard fetch failed:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => {
        const t = setInterval(() => fetchData(true), 120_000);
        return () => clearInterval(t);
    }, [fetchData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertTriangle size={32} className="text-red-400 mx-auto mb-2" />
                    <p className="text-dark-muted">Failed to load dashboard</p>
                    <button onClick={() => fetchData()} className="btn-primary mt-3">Retry</button>
                </div>
            </div>
        );
    }

    const bd = data.appointmentBreakdown;
    const totalAppts = Object.values(bd).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-6">

            {/* ─── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-dark-text">
                        Good {getGreeting()} 👋
                    </h2>
                    <p className="text-sm text-dark-muted mt-0.5">
                        {format(new Date(), 'EEEE, MMMM d yyyy')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <p className="text-xs text-dark-muted hidden sm:block">
                        Updated {format(lastUpdated, 'h:mm a')}
                    </p>
                    <button
                        onClick={() => fetchData(true)}
                        disabled={refreshing}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* ─── Stat Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <StatCard
                    title="Total Patients"
                    value={data.stats.totalPatients.toLocaleString()}
                    icon={Users}
                    color="blue"
                    sub={`+${data.stats.newPatientsThisMonth} this month`}
                />
                <StatCard
                    title="Calls Today"
                    value={data.stats.callsToday}
                    icon={Phone}
                    color="purple"
                />
                <StatCard
                    title="Appointments"
                    value={data.stats.appointmentsToday}
                    icon={Calendar}
                    color="green"
                    sub="Today"
                />
                <StatCard
                    title="Active Doctors"
                    value={data.stats.activeDoctors}
                    icon={UserCheck}
                    color="cyan"
                />
            </div>

            {/* ─── Quick Info Row ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* Mood */}
                <div className="card-sm">
                    <p className="text-xs text-dark-muted mb-2">Today's Avg Mood</p>
                    <MoodBadge mood={data.stats.avgMoodToday} size="md" />
                </div>

                {/* Retention */}
                <div className="card-sm">
                    <p className="text-xs text-dark-muted mb-2">Patient Retention</p>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-dark-border rounded-full h-2">
                            <div
                                className="bg-primary-500 h-2 rounded-full"
                                style={{ width: `${Math.min(data.stats.returningRate, 100)}%` }}
                            />
                        </div>
                        <span className="text-sm font-bold text-dark-text">
                            {data.stats.returningRate}%
                        </span>
                    </div>
                </div>

                {/* New patients */}
                <div className="card-sm">
                    <p className="text-xs text-dark-muted mb-2">New This Month</p>
                    <p className="text-2xl font-bold text-dark-text">
                        {data.stats.newPatientsThisMonth}
                        <span className="text-sm font-normal text-dark-muted ml-1">patients</span>
                    </p>
                </div>
            </div>

            {/* ─── Appointment Breakdown ───────────────────────────────────── */}
            <div className="card">
                <h3 className="font-semibold text-dark-text mb-4">
                    This Month — Appointments
                </h3>
                {totalAppts === 0 ? (
                    <p className="text-sm text-dark-muted text-center py-4">
                        No appointments this month
                    </p>
                ) : (
                    <div className="space-y-3">
                        {[
                            { key: 'scheduled', label: 'Scheduled', color: 'bg-blue-400' },
                            { key: 'confirmed', label: 'Confirmed', color: 'bg-green-400' },
                            { key: 'completed', label: 'Completed', color: 'bg-slate-400' },
                            { key: 'cancelled', label: 'Cancelled', color: 'bg-red-400' },
                            { key: 'no_show', label: 'No Show', color: 'bg-orange-400' },
                        ].map(({ key, label, color }) => {
                            const count = bd[key as keyof typeof bd];
                            const pct = totalAppts > 0 ? Math.round((count / totalAppts) * 100) : 0;
                            return (
                                <div key={key} className="flex items-center gap-3">
                                    <p className="text-xs text-dark-muted w-20">{label}</p>
                                    <div className="flex-1 bg-dark-border rounded-full h-2">
                                        <div
                                            className={`${color} h-2 rounded-full transition-all`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-dark-text font-medium w-8 text-right">
                                        {count}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
}
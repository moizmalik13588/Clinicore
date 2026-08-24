import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie,
    Cell, Legend, BarChart, Bar,
} from 'recharts';
import { dashboardApi, revenueApi } from '../lib/api';
import Spinner from '../components/ui/Spinner';

const MOOD_COLORS: Record<string, string> = {
    calm: '#22c55e',
    happy: '#06b6d4',
    frustrated: '#f97316',
    anxious: '#a855f7',
    angry: '#ef4444',
};

const APPT_COLORS: Record<string, string> = {
    scheduled: '#6366f1',
    confirmed: '#22c55e',
    completed: '#94a3b8',
    cancelled: '#ef4444',
    no_show: '#f97316',
};

export default function Analytics() {
    const [overview, setOverview] = useState<any>(null);
    const [revenue, setRevenue] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [revenueRange, setRevenueRange] = useState('30d');

    const fetchAll = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const [ovRes, revRes] = await Promise.all([
                dashboardApi.overview(),
                revenueApi.stats(revenueRange),
            ]);
            setOverview(ovRes.data.data);
            setRevenue(revRes.data.data);
        } catch (err) {
            console.error('Analytics fetch failed:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [revenueRange]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    // Mood pie
    const moodPie = overview?.moodDistribution
        ? Object.entries(overview.moodDistribution)
            .filter(([k, v]) => k !== 'total' && Number(v) > 0)
            .map(([k, v]) => ({
                name: k.charAt(0).toUpperCase() + k.slice(1),
                value: Number(v),
                color: MOOD_COLORS[k] || '#94a3b8',
            }))
        : [];

    // Appointment pie
    const apptPie = overview?.appointmentBreakdown
        ? Object.entries(overview.appointmentBreakdown)
            .filter(([, v]) => Number(v) > 0)
            .map(([k, v]) => ({
                name: k.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
                value: Number(v),
                color: APPT_COLORS[k] || '#94a3b8',
            }))
        : [];

    const tooltipStyle = {
        background: '#1a1a2e', border: '1px solid #2a2a3e',
        borderRadius: '8px', color: '#e2e8f0', fontSize: '12px',
    };

    return (
        <div className="space-y-6">

            {/* ─── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-dark-text">Analytics</h2>
                    <p className="text-sm text-dark-muted mt-0.5">
                        Revenue, mood, and activity charts
                    </p>
                </div>
                <button
                    onClick={() => fetchAll(true)}
                    disabled={refreshing}
                    className="btn-secondary flex items-center gap-2"
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* ─── Revenue Chart ───────────────────────────────────────────── */}
            <div className="card">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div>
                        <h3 className="font-semibold text-dark-text">Revenue</h3>
                        <p className="text-xs text-dark-muted mt-0.5">
                            This month:{' '}
                            <span className="text-green-400 font-medium">
                                Rs. {(revenue?.totalThisMonth || 0).toLocaleString()}
                            </span>
                            {' '}· Total:{' '}
                            <span className="text-dark-text font-medium">
                                Rs. {(revenue?.totalAllTime || 0).toLocaleString()}
                            </span>
                        </p>
                    </div>

                    {/* Range selector */}
                    <div className="flex bg-dark-bg border border-dark-border rounded-lg p-1 gap-0.5">
                        {(['7d', '30d', '90d', '1y'] as const).map(r => (
                            <button
                                key={r}
                                onClick={() => setRevenueRange(r)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${revenueRange === r
                                        ? 'bg-primary-600/20 text-primary-400'
                                        : 'text-dark-muted hover:text-dark-text'
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                {revenue?.byMonth?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={revenue.byMonth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                            <XAxis
                                dataKey="label"
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                axisLine={false} tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                axisLine={false} tickLine={false}
                                tickFormatter={v => `Rs.${v}`}
                            />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                formatter={((v: any) => [`Rs. ${Number(v || 0).toLocaleString()}`, 'Revenue']) as any}
                            />
                            <Line
                                type="monotone" dataKey="total"
                                stroke="#6366f1" strokeWidth={2.5}
                                dot={{ fill: '#6366f1', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-48 flex items-center justify-center text-dark-muted text-sm">
                        No revenue data yet
                    </div>
                )}
            </div>

            {/* ─── Mood + Appointments Row ─────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Today's Mood */}
                <div className="card">
                    <h3 className="font-semibold text-dark-text mb-1">Today's Mood</h3>
                    <p className="text-xs text-dark-muted mb-4">
                        {overview?.moodDistribution?.total || 0} events today
                    </p>

                    {moodPie.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={moodPie}
                                    cx="50%" cy="50%"
                                    innerRadius={55} outerRadius={80}
                                    paddingAngle={3} dataKey="value"
                                >
                                    {moodPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend
                                    iconType="circle" iconSize={8}
                                    formatter={v => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-44 flex items-center justify-center">
                            <p className="text-xs text-dark-muted">No mood data today</p>
                        </div>
                    )}
                </div>

                {/* This Month Appointments */}
                <div className="card">
                    <h3 className="font-semibold text-dark-text mb-1">This Month</h3>
                    <p className="text-xs text-dark-muted mb-4">Appointment breakdown</p>

                    {apptPie.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={150}>
                                <PieChart>
                                    <Pie
                                        data={apptPie}
                                        cx="50%" cy="50%"
                                        outerRadius={60}
                                        paddingAngle={2} dataKey="value"
                                    >
                                        {apptPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-1.5 mt-2">
                                {apptPie.map(item => (
                                    <div key={item.name} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                                            <span className="text-dark-muted">{item.name}</span>
                                        </div>
                                        <span className="text-dark-text font-medium">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-44 flex items-center justify-center">
                            <p className="text-xs text-dark-muted">No appointments this month</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Today's Activity (Hourly) ───────────────────────────────── */}
            <div className="card">
                <h3 className="font-semibold text-dark-text mb-4">Today's Activity</h3>
                {overview?.timeline?.slots?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                            data={overview.timeline.slots}
                            margin={{ left: -20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                            <XAxis
                                dataKey="hour"
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                axisLine={false} tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                axisLine={false} tickLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend
                                iconSize={8}
                                formatter={v => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>}
                            />
                            <Bar dataKey="appointments" name="Appointments" fill="#6366f1" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="calls" name="Calls" fill="#22c55e" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-44 flex items-center justify-center">
                        <p className="text-xs text-dark-muted">No activity data today</p>
                    </div>
                )}
            </div>

        </div>
    );
}
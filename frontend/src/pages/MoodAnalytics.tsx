import { useState, useEffect, useCallback } from 'react';
import {
    Brain, TrendingUp, TrendingDown,
    AlertTriangle, Users, BarChart2,
    Calendar, RefreshCw,
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts';
import { moodApi, patientsApi } from '../lib/api';
import MoodBadge from '../components/ui/MoodBadge';
import Spinner from '../components/ui/Spinner';
import { format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TrendPoint {
    date: string;
    calm: number;
    frustrated: number;
    angry: number;
    anxious: number;
    happy: number;
    total: number;
}

interface TrendsData {
    range: string;
    data: TrendPoint[];
    summary: {
        dominantMood: string;
        calmRate: number;
        angryRate: number;
        totalEvents: number;
    };
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const MOOD_COLORS = {
    calm: '#22c55e',
    happy: '#06b6d4',
    frustrated: '#f97316',
    anxious: '#a855f7',
    angry: '#ef4444',
};

const MOOD_LINES = [
    { key: 'calm', color: '#22c55e', label: 'Calm' },
    { key: 'happy', color: '#06b6d4', label: 'Happy' },
    { key: 'frustrated', color: '#f97316', label: 'Frustrated' },
    { key: 'anxious', color: '#a855f7', label: 'Anxious' },
    { key: 'angry', color: '#ef4444', label: 'Angry' },
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-3 shadow-xl text-xs">
            <p className="text-dark-muted mb-2 font-medium">{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        <span className="text-dark-muted capitalize">{p.dataKey}</span>
                    </div>
                    <span className="font-bold text-dark-text">{p.value}%</span>
                </div>
            ))}
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function MoodStatCard({
    label, value, sub, color = 'text-dark-text', trend,
}: {
    label: string; value: string | number; sub?: string;
    color?: string; trend?: 'up' | 'down' | 'neutral';
}) {
    return (
        <div className="card-sm">
            <p className="text-xs text-dark-muted">{label}</p>
            <div className="flex items-end gap-2 mt-1.5">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                {trend && (
                    <div className="mb-0.5">
                        {trend === 'up' && <TrendingUp size={14} className="text-red-400" />}
                        {trend === 'down' && <TrendingDown size={14} className="text-green-400" />}
                    </div>
                )}
            </div>
            {sub && <p className="text-xs text-dark-muted mt-0.5">{sub}</p>}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MoodAnalytics() {
    const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
    const [trends, setTrends] = useState<TrendsData | null>(null);
    const [topAnxious, setTopAnxious] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAll = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const [trendsRes, patientsRes] = await Promise.all([
                moodApi.trends(range),
                patientsApi.list({ tag: 'anxious', limit: 10 }),
            ]);
            setTrends(trendsRes.data.data);
            setTopAnxious(patientsRes.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [range]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    // ─── Prepare chart data ─────────────────────────────────────────────────────
    const chartData = trends?.data.map(d => ({
        ...d,
        label: format(new Date(d.date), 'MMM d'),
    })) || [];

    // ─── Mood distribution pie ──────────────────────────────────────────────────
    const pieData = trends?.data.reduce((acc, d) => {
        acc.calm = (acc.calm || 0) + d.calm;
        acc.happy = (acc.happy || 0) + d.happy;
        acc.frustrated = (acc.frustrated || 0) + d.frustrated;
        acc.anxious = (acc.anxious || 0) + d.anxious;
        acc.angry = (acc.angry || 0) + d.angry;
        return acc;
    }, {} as Record<string, number>) || {};

    const pieChartData = Object.entries(pieData)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: Math.round(value / (trends?.data.length || 1)),
            color: MOOD_COLORS[key as keyof typeof MOOD_COLORS] || '#94a3b8',
        }))
        .sort((a, b) => b.value - a.value);

    // ─── Worst days (highest angry%) ───────────────────────────────────────────
    const worstDays = [...(trends?.data || [])]
        .sort((a, b) => b.angry - a.angry)
        .slice(0, 5);

    // ─── Best days (highest calm%) ─────────────────────────────────────────────
    const bestDays = [...(trends?.data || [])]
        .filter(d => d.total > 0)
        .sort((a, b) => b.calm - a.calm)
        .slice(0, 5);

    const summary = trends?.summary;

    return (
        <div className="space-y-6">

            {/* ─── Header ─────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-dark-text">Mood Analytics</h2>
                    <p className="text-sm text-dark-muted mt-0.5">
                        Patient emotion trends and insights
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Range selector */}
                    <div className="flex bg-dark-card border border-dark-border rounded-lg p-1 gap-0.5">
                        {(['7d', '30d', '90d'] as const).map(r => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${range === r
                                        ? 'bg-primary-600/20 text-primary-400'
                                        : 'text-dark-muted hover:text-dark-text'
                                    }`}
                            >
                                {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => fetchAll(true)}
                        disabled={refreshing}
                        className="btn-secondary p-2"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* ─── Summary Cards ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MoodStatCard
                    label="Total Events"
                    value={(summary?.totalEvents || 0).toLocaleString()}
                    sub={`Last ${range}`}
                />
                <MoodStatCard
                    label="Dominant Mood"
                    value={summary?.dominantMood || 'N/A'}
                    color={summary?.dominantMood === 'calm' || summary?.dominantMood === 'happy'
                        ? 'text-green-400' : 'text-orange-400'}
                />
                <MoodStatCard
                    label="Calm Rate"
                    value={`${summary?.calmRate || 0}%`}
                    color="text-green-400"
                    trend={
                        (summary?.calmRate || 0) > 60 ? 'down' :
                            (summary?.calmRate || 0) < 40 ? 'up' : 'neutral'
                    }
                />
                <MoodStatCard
                    label="Anger Rate"
                    value={`${summary?.angryRate || 0}%`}
                    color={(summary?.angryRate || 0) > 30 ? 'text-red-400' : 'text-dark-text'}
                    trend={(summary?.angryRate || 0) > 30 ? 'up' : 'neutral'}
                    sub={(summary?.angryRate || 0) > 30 ? '⚠️ Above threshold' : undefined}
                />
            </div>

            {/* ─── Alert banner ───────────────────────────────────────────────── */}
            {(summary?.angryRate || 0) > 30 && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30
                        rounded-xl">
                    <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-red-400">High Anger Rate Detected</p>
                        <p className="text-xs text-dark-muted mt-0.5">
                            Anger rate is at {summary?.angryRate}% — above the 30% alert threshold.
                            Review call logs and consider staff training.
                        </p>
                    </div>
                </div>
            )}

            {/* ─── Main trend chart ───────────────────────────────────────────── */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-dark-text">Mood Trends Over Time</h3>
                    <span className="text-xs text-dark-muted">
                        {chartData.length} data points
                    </span>
                </div>

                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={chartData} margin={{ left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                            <XAxis
                                dataKey="label"
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={v => `${v}%`}
                                domain={[0, 100]}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                iconType="circle"
                                iconSize={8}
                                formatter={v => (
                                    <span style={{ color: '#94a3b8', fontSize: 11 }}>
                                        {v.charAt(0).toUpperCase() + v.slice(1)}
                                    </span>
                                )}
                            />
                            {MOOD_LINES.map(({ key, color, label }) => (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={color}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4, fill: color }}
                                    name={label}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-52 flex items-center justify-center">
                        <p className="text-dark-muted text-sm">No trend data available</p>
                    </div>
                )}
            </div>

            {/* ─── Row 2: Distribution + Best/Worst ───────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Mood distribution pie */}
                <div className="card">
                    <h3 className="font-semibold text-dark-text mb-1">Average Distribution</h3>
                    <p className="text-xs text-dark-muted mb-4">Across {range}</p>

                    {pieChartData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%" cy="50%"
                                        innerRadius={45}
                                        outerRadius={70}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {pieChartData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: '#1a1a2e', border: '1px solid #2a2a3e',
                                            borderRadius: '8px', fontSize: '12px',
                                        }}
                                        formatter={((v: any) => [`${v}%`, '']) as any}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-1.5 mt-2">
                                {pieChartData.map(item => (
                                    <div key={item.name} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                                            <span className="text-dark-muted">{item.name}</span>
                                        </div>
                                        <span className="text-dark-text font-medium">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-44 flex items-center justify-center">
                            <p className="text-xs text-dark-muted">No data</p>
                        </div>
                    )}
                </div>

                {/* Worst days */}
                <div className="card">
                    <h3 className="font-semibold text-dark-text mb-1 flex items-center gap-2">
                        <TrendingUp size={15} className="text-red-400" />
                        Most Challenging Days
                    </h3>
                    <p className="text-xs text-dark-muted mb-4">Highest anger rate</p>

                    {worstDays.filter(d => d.angry > 0).length > 0 ? (
                        <div className="space-y-3">
                            {worstDays.filter(d => d.angry > 0).map(d => (
                                <div key={d.date} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-dark-text">
                                            {format(new Date(d.date), 'EEE, MMM d')}
                                        </p>
                                        <p className="text-xs text-dark-muted">{d.total} events</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 bg-dark-border rounded-full h-1.5">
                                            <div
                                                className="bg-red-400 h-1.5 rounded-full"
                                                style={{ width: `${d.angry}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-red-400 font-bold w-8 text-right">
                                            {d.angry}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32">
                            <p className="text-xs text-dark-muted">No angry events 🎉</p>
                        </div>
                    )}
                </div>

                {/* Best days */}
                <div className="card">
                    <h3 className="font-semibold text-dark-text mb-1 flex items-center gap-2">
                        <TrendingDown size={15} className="text-green-400" />
                        Best Days
                    </h3>
                    <p className="text-xs text-dark-muted mb-4">Highest calm rate</p>

                    {bestDays.length > 0 ? (
                        <div className="space-y-3">
                            {bestDays.map(d => (
                                <div key={d.date} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-dark-text">
                                            {format(new Date(d.date), 'EEE, MMM d')}
                                        </p>
                                        <p className="text-xs text-dark-muted">{d.total} events</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 bg-dark-border rounded-full h-1.5">
                                            <div
                                                className="bg-green-400 h-1.5 rounded-full"
                                                style={{ width: `${d.calm}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-green-400 font-bold w-8 text-right">
                                            {d.calm}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32">
                            <p className="text-xs text-dark-muted">No data yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Row 3: Daily breakdown bar chart ───────────────────────────── */}
            {chartData.length > 0 && (
                <div className="card">
                    <h3 className="font-semibold text-dark-text mb-4">Daily Event Volume</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={chartData} margin={{ left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                            <XAxis
                                dataKey="label"
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#1a1a2e', border: '1px solid #2a2a3e',
                                    borderRadius: '8px', fontSize: '12px',
                                }}
                                formatter={((v: any) => [v, 'Events']) as any}
                            />
                            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                {chartData.map((d, i) => (
                                    <Cell
                                        key={i}
                                        fill={
                                            d.angry > 30 ? '#ef4444' :
                                                d.calm > 60 ? '#22c55e' : '#6366f1'
                                        }
                                        fillOpacity={0.8}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-dark-muted mt-2 text-center">
                        🟢 Calm day &nbsp; 🔵 Normal &nbsp; 🔴 High anger
                    </p>
                </div>
            )}

            {/* ─── Row 4: Top anxious patients ────────────────────────────────── */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-dark-text flex items-center gap-2">
                        <Users size={16} className="text-purple-400" />
                        Anxious Patients
                    </h3>
                    <span className="text-xs text-dark-muted">
                        Auto-tagged patients
                    </span>
                </div>

                {topAnxious.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {topAnxious.map(p => (
                            <div key={p.id} className="card-sm flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center
                                justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-purple-400">
                                        {p.name.charAt(0)}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-dark-text truncate">{p.name}</p>
                                    <p className="text-xs text-dark-muted">{p.phone}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {p.crmTags.slice(0, 2).map((tag: string) => (
                                            <MoodBadge key={tag} mood={tag === 'anxious' ? 'anxious' : null} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Brain size={28} className="text-dark-border mx-auto mb-2" />
                        <p className="text-sm text-dark-muted">No anxious patients tagged yet</p>
                        <p className="text-xs text-dark-muted mt-1">
                            Patients with 3+ anxious calls are auto-tagged
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
import { useState, useEffect, useCallback } from 'react';
import {
    Phone, PhoneIncoming, PhoneOutgoing,
    Clock, Brain, ChevronDown, ChevronUp,
    Download, Search, Filter, X, FileText,
} from 'lucide-react';
import { callsApi } from '../lib/api';
import MoodBadge from '../components/ui/MoodBadge';
import StatusBadge from '../components/ui/StatusBadge';
import Spinner from '../components/ui/Spinner';
import Empty from '../components/ui/Empty';
import Pagination from '../components/ui/Pagination';
import { useToast } from '../components/ui/Toast';
import { format, formatDistanceToNow } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Call {
    id: string;
    direction: string;
    status: string;
    duration: number | null;
    dominantMood: string | null;
    avgIntensity: number | null;
    fromNumber: string | null;
    toNumber: string | null;
    startedAt: string | null;
    endedAt: string | null;
    createdAt: string;
    patient: { id: string; name: string; phone: string } | null;
}

interface CallDetail extends Call {
    transcript: string | null;
    moodTimeline: Array<{
        timestampOffset: number;
        mood: string;
        intensity: number;
        aiActionTaken: string | null;
        escalated: boolean;
    }>;
    moodSummary: {
        dominantMood: string;
        avgIntensity: number;
        totalEvents: number;
        escalated: boolean;
        calmPercent: number;
        angryPercent: number;
        anxiousPercent: number;
    };
}

// ─── Mood Timeline Bar ────────────────────────────────────────────────────────
const MOOD_BAR_COLORS: Record<string, string> = {
    calm: '#22c55e',
    happy: '#06b6d4',
    frustrated: '#f97316',
    anxious: '#a855f7',
    angry: '#ef4444',
};

function MoodTimelineBar({
    events, duration,
}: {
    events: CallDetail['moodTimeline'];
    duration: number;
}) {
    if (!events.length || !duration) return null;

    return (
        <div>
            <p className="text-xs text-dark-muted mb-2">Mood Timeline</p>
            <div className="relative h-6 bg-dark-border rounded-full overflow-hidden">
                {events.map((e, i) => {
                    const left = (e.timestampOffset / duration) * 100;
                    const width = i < events.length - 1
                        ? ((events[i + 1].timestampOffset - e.timestampOffset) / duration) * 100
                        : 100 - left;

                    return (
                        <div
                            key={i}
                            className="absolute top-0 h-full transition-all"
                            style={{
                                left: `${left}%`,
                                width: `${Math.max(width, 1)}%`,
                                backgroundColor: MOOD_BAR_COLORS[e.mood] || '#94a3b8',
                                opacity: 0.3 + e.intensity * 0.7,
                            }}
                            title={`${e.mood} (${Math.round(e.intensity * 100)}%) @ ${e.timestampOffset}s`}
                        />
                    );
                })}

                {/* Markers */}
                {events.map((e, i) => (
                    <div
                        key={i}
                        className="absolute top-0 h-full w-0.5 bg-dark-bg/50"
                        style={{ left: `${(e.timestampOffset / duration) * 100}%` }}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-2">
                {events.map((e, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: MOOD_BAR_COLORS[e.mood] }}
                        />
                        <span className="text-dark-muted">
                            {e.timestampOffset}s: <span className="text-dark-text">{e.mood}</span>
                            {e.aiActionTaken && (
                                <span className="text-primary-400 ml-1">→ {e.aiActionTaken}</span>
                            )}
                            {e.escalated && <span className="text-red-400 ml-1">⚠️</span>}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Transcript View ──────────────────────────────────────────────────────────
function TranscriptView({ transcript }: { transcript: string }) {
    const lines = transcript
        .split('\n')
        .filter(Boolean)
        .map(line => {
            const isAgent = line.toLowerCase().startsWith('agent:');
            const isUser = line.toLowerCase().startsWith('user:');
            const text = line.replace(/^(agent:|user:)\s*/i, '');
            return { isAgent, isUser, text, raw: line };
        });

    return (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {lines.map((line, i) => (
                <div
                    key={i}
                    className={`flex ${line.isAgent ? 'justify-start' : 'justify-end'}`}
                >
                    <div className={`
            max-w-[80%] px-3 py-2 rounded-xl text-sm
            ${line.isAgent
                            ? 'bg-dark-border text-dark-text rounded-tl-none'
                            : 'bg-primary-600/20 text-primary-300 rounded-tr-none'
                        }
          `}>
                        <p className="text-[10px] font-medium mb-0.5 opacity-60">
                            {line.isAgent ? '🤖 AI' : '👤 Patient'}
                        </p>
                        {line.text || line.raw}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Call Row (expandable) ────────────────────────────────────────────────────
function CallRow({ call }: { call: Call }) {
    const [expanded, setExpanded] = useState(false);
    const [detail, setDetail] = useState<CallDetail | null>(null);
    const [loading, setLoading] = useState(false);

    async function loadDetail() {
        if (detail) return;
        setLoading(true);
        try {
            const res = await callsApi.getMoodTimeline(call.id);
            setDetail(res.data.data);
        } catch {
            // Fallback — basic call data
            setDetail({
                ...call, transcript: null, moodTimeline: [], moodSummary: {
                    dominantMood: call.dominantMood || 'N/A',
                    avgIntensity: call.avgIntensity || 0,
                    totalEvents: 0, escalated: false,
                    calmPercent: 0, angryPercent: 0, anxiousPercent: 0,
                }
            });
        } finally {
            setLoading(false);
        }
    }

    function handleExpand() {
        setExpanded(p => !p);
        if (!expanded) loadDetail();
    }

    const durationStr = call.duration
        ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s`
        : '—';

    return (
        <div className="border-b border-dark-border/50 last:border-0">
            {/* Main row */}
            <div
                className="flex items-center gap-4 px-4 py-3.5 cursor-pointer
                   hover:bg-dark-hover/50 transition-colors"
                onClick={handleExpand}
            >
                {/* Direction icon */}
                <div className={`p-2 rounded-lg flex-shrink-0 ${call.direction === 'inbound'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                    {call.direction === 'inbound'
                        ? <PhoneIncoming size={15} />
                        : <PhoneOutgoing size={15} />
                    }
                </div>

                {/* Patient */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-dark-text">
                            {call.patient?.name || call.fromNumber || 'Unknown'}
                        </p>
                        <StatusBadge status={call.status} />
                        {call.dominantMood && <MoodBadge mood={call.dominantMood} />}
                        {call.avgIntensity != null && call.avgIntensity > 0.6 && (
                            <span className="badge bg-red-500/10 text-red-400 text-[10px]">
                                High intensity
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-dark-muted mt-0.5">
                        {call.patient?.phone || call.fromNumber || '—'}
                        {call.startedAt && (
                            <> • {format(new Date(call.startedAt), 'MMM d, h:mm a')}</>
                        )}
                    </p>
                </div>

                {/* Duration */}
                <div className="text-right flex-shrink-0">
                    <p className="text-sm text-dark-text flex items-center gap-1 justify-end">
                        <Clock size={12} className="text-dark-muted" />
                        {durationStr}
                    </p>
                    {call.avgIntensity != null && (
                        <p className={`text-xs mt-0.5 ${call.avgIntensity > 0.6 ? 'text-red-400' :
                                call.avgIntensity > 0.3 ? 'text-orange-400' : 'text-green-400'
                            }`}>
                            {Math.round(call.avgIntensity * 100)}% intensity
                        </p>
                    )}
                </div>

                {/* Expand icon */}
                <div className="text-dark-muted flex-shrink-0">
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>

            {/* Expanded content */}
            {expanded && (
                <div className="px-4 pb-5 space-y-4 bg-dark-bg/30">
                    {loading ? (
                        <div className="flex justify-center py-6"><Spinner /></div>
                    ) : detail ? (
                        <>
                            {/* Mood Summary */}
                            {detail.moodSummary.totalEvents > 0 && (
                                <div className="grid grid-cols-4 gap-3 pt-3">
                                    {[
                                        { label: 'Dominant Mood', value: <MoodBadge mood={detail.moodSummary.dominantMood} /> },
                                        { label: 'Mood Events', value: detail.moodSummary.totalEvents },
                                        { label: 'Avg Intensity', value: `${Math.round(detail.moodSummary.avgIntensity * 100)}%` },
                                        { label: 'Escalated', value: detail.moodSummary.escalated ? '⚠️ Yes' : 'No' },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="card-sm text-center">
                                            <p className="text-xs text-dark-muted mb-1">{label}</p>
                                            <div className="text-sm font-medium text-dark-text">{value}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Mood timeline bar */}
                            {detail.moodTimeline.length > 0 && detail.duration && (
                                <MoodTimelineBar
                                    events={detail.moodTimeline}
                                    duration={detail.duration}
                                />
                            )}

                            {/* Transcript */}
                            {detail.transcript ? (
                                <div>
                                    <p className="text-xs text-dark-muted mb-2 flex items-center gap-1">
                                        <FileText size={11} /> Call Transcript
                                    </p>
                                    <TranscriptView transcript={detail.transcript} />
                                </div>
                            ) : (
                                <p className="text-xs text-dark-muted text-center py-3">
                                    No transcript available
                                </p>
                            )}
                        </>
                    ) : null}
                </div>
            )}
        </div>
    );
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportCSV(calls: Call[]) {
    const headers = [
        'Date', 'Patient', 'Phone', 'Direction',
        'Status', 'Duration (s)', 'Mood', 'Intensity',
    ];

    const rows = calls.map(c => [
        c.startedAt ? format(new Date(c.startedAt), 'yyyy-MM-dd HH:mm') : '',
        c.patient?.name || 'Unknown',
        c.patient?.phone || c.fromNumber || '',
        c.direction,
        c.status,
        c.duration || '',
        c.dominantMood || '',
        c.avgIntensity != null ? Math.round(c.avgIntensity * 100) + '%' : '',
    ]);

    const csv = [headers, ...rows]
        .map(row => row.map(v => `"${v}"`).join(','))
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calls_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Calls() {
    const [calls, setCalls] = useState<Call[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusF, setStatusF] = useState('');
    const [dirF, setDirF] = useState('');
    const [moodF, setMoodF] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPgs, setTotalPgs] = useState(1);
    const LIMIT = 20;

    const fetchCalls = useCallback(async () => {
        setLoading(true);
        try {
            const res = await callsApi.list({
                page,
                limit: LIMIT,
                status: statusF || undefined,
                direction: dirF || undefined,
            });
            setCalls(res.data.data || []);
            setTotal(res.data.total || 0);
            setTotalPgs(res.data.totalPages || 1);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, [page, statusF, dirF]);

    useEffect(() => { fetchCalls(); }, [fetchCalls]);
    useEffect(() => { setPage(1); }, [statusF, dirF, search]);

    // Client-side search + mood filter
    const filtered = calls.filter(c => {
        const matchSearch = !search ||
            c.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.patient?.phone?.includes(search) ||
            c.fromNumber?.includes(search);

        const matchMood = !moodF || c.dominantMood === moodF;

        return matchSearch && matchMood;
    });

    const hasFilters = search || statusF || dirF || moodF;

    return (
        <div className="space-y-5">

            {/* ─── Toolbar ──────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
                    <input
                        className="input pl-9"
                        placeholder="Search patient or phone..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <select className="input w-full sm:w-32" value={statusF}
                    onChange={e => setStatusF(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="failed">Failed</option>
                </select>

                <select className="input w-full sm:w-32" value={dirF}
                    onChange={e => setDirF(e.target.value)}>
                    <option value="">All Direction</option>
                    <option value="inbound">Inbound</option>
                    <option value="outbound">Outbound</option>
                </select>

                <select className="input w-full sm:w-32" value={moodF}
                    onChange={e => setMoodF(e.target.value)}>
                    <option value="">All Moods</option>
                    <option value="calm">Calm</option>
                    <option value="happy">Happy</option>
                    <option value="frustrated">Frustrated</option>
                    <option value="anxious">Anxious</option>
                    <option value="angry">Angry</option>
                </select>

                {hasFilters && (
                    <button
                        onClick={() => { setSearch(''); setStatusF(''); setDirF(''); setMoodF(''); }}
                        className="btn-secondary flex items-center gap-1.5"
                    >
                        <X size={14} /> Clear
                    </button>
                )}

                <button
                    onClick={() => exportCSV(filtered)}
                    className="btn-secondary flex items-center gap-2 whitespace-nowrap"
                    disabled={filtered.length === 0}
                >
                    <Download size={14} /> Export
                </button>
            </div>

            {/* ─── Stats bar ────────────────────────────────────────────────── */}
            <div className="flex items-center gap-4 text-sm flex-wrap">
                <span className="text-dark-muted">
                    <span className="text-dark-text font-medium">{total}</span> total calls
                </span>
                <span className="text-dark-muted">
                    Showing <span className="text-dark-text">{filtered.length}</span>
                </span>
                {calls.filter(c => c.dominantMood === 'angry').length > 0 && (
                    <span className="badge bg-red-500/10 text-red-400">
                        ⚠️ {calls.filter(c => c.dominantMood === 'angry').length} angry calls
                    </span>
                )}
            </div>

            {/* ─── Calls list ───────────────────────────────────────────────── */}
            <div className="card p-0 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16"><Spinner /></div>
                ) : filtered.length === 0 ? (
                    <Empty
                        icon={Phone}
                        title="No calls found"
                        message={hasFilters ? 'Try clearing filters' : 'Calls will appear here after your AI agent receives them'}
                    />
                ) : (
                    <>
                        {filtered.map(call => <CallRow key={call.id} call={call} />)}

                        <div className="px-4 pb-4">
                            <Pagination
                                page={page} totalPages={totalPgs}
                                total={total} limit={LIMIT} onPage={setPage}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
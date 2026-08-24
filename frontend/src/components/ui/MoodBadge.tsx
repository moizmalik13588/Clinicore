interface MoodBadgeProps {
    mood: string | null;
    size?: 'sm' | 'md';
}

const MOOD_CONFIG: Record<string, { color: string; emoji: string }> = {
    calm: { color: 'bg-green-500/20 text-green-400', emoji: '😊' },
    happy: { color: 'bg-cyan-500/20 text-cyan-400', emoji: '😄' },
    frustrated: { color: 'bg-orange-500/20 text-orange-400', emoji: '😤' },
    anxious: { color: 'bg-purple-500/20 text-purple-400', emoji: '😰' },
    angry: { color: 'bg-red-500/20 text-red-400', emoji: '😡' },
};

export default function MoodBadge({ mood, size = 'sm' }: MoodBadgeProps) {
    if (!mood) return <span className="badge bg-slate-500/20 text-slate-400">N/A</span>;

    const config = MOOD_CONFIG[mood.toLowerCase()] || {
        color: 'bg-slate-500/20 text-slate-400', emoji: '😐',
    };

    return (
        <span className={`badge ${config.color} ${size === 'md' ? 'px-3 py-1 text-sm' : ''}`}>
            {config.emoji} {mood.charAt(0).toUpperCase() + mood.slice(1)}
        </span>
    );
}
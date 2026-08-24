const TAG_COLORS: Record<string, string> = {
    'VIP': 'bg-yellow-500/20 text-yellow-400',
    'anxious': 'bg-purple-500/20 text-purple-400',
    'high-risk': 'bg-red-500/20 text-red-400',
    'chronic-pain': 'bg-orange-500/20 text-orange-400',
    'needs-followup': 'bg-blue-500/20 text-blue-400',
    'needs-attention': 'bg-pink-500/20 text-pink-400',
    'new-patient': 'bg-green-500/20 text-green-400',
};

export default function TagBadge({ tag }: { tag: string }) {
    const color = TAG_COLORS[tag] || 'bg-slate-500/20 text-slate-400';
    return (
        <span className={`badge text-[10px] ${color}`}>{tag}</span>
    );
}
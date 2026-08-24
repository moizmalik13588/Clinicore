interface StatusBadgeProps {
    status: string;
}

const STATUS_CONFIG: Record<string, string> = {
    // Appointments
    scheduled: 'bg-blue-500/20 text-blue-400',
    confirmed: 'bg-green-500/20 text-green-400',
    completed: 'bg-slate-500/20 text-slate-400',
    cancelled: 'bg-red-500/20 text-red-400',
    no_show: 'bg-orange-500/20 text-orange-400',
    // Calls
    in_progress: 'bg-yellow-500/20 text-yellow-400',
    failed: 'bg-red-500/20 text-red-400',
    // Doctors
    active: 'bg-green-500/20 text-green-400',
    inactive: 'bg-slate-500/20 text-slate-400',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    const color = STATUS_CONFIG[status.toLowerCase()] || 'bg-slate-500/20 text-slate-400';
    const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return <span className={`badge ${color}`}>{label}</span>;
}
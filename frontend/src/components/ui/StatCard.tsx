import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan';
    change?: string;
    sub?: string;
}

const COLORS = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    purple: 'bg-purple-500/10 text-purple-400',
    orange: 'bg-orange-500/10 text-orange-400',
    red: 'bg-red-500/10 text-red-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
};

export default function StatCard({
    title, value, icon: Icon,
    color = 'blue', change, sub,
}: StatCardProps) {
    return (
        <div className="card hover:border-dark-hover transition-colors">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-dark-muted font-medium uppercase tracking-wide">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-dark-text mt-1.5">{value}</p>
                    {sub && <p className="text-xs text-dark-muted mt-0.5">{sub}</p>}
                    {change && (
                        <p className="text-xs text-green-400 mt-1">{change}</p>
                    )}
                </div>
                <div className={`p-2.5 rounded-xl ${COLORS[color]}`}>
                    <Icon size={20} />
                </div>
            </div>
        </div>
    );
}
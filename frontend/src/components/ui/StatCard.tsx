import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    change?: string;
    sub?: string;
}

export default function StatCard({
    title, value, icon: Icon, change, sub,
}: StatCardProps) {
    return (
        <div className="card hover:border-dark-hover transition-colors">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-dark-muted font-medium uppercase tracking-wider">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-dark-text mt-1.5">{value}</p>
                    {sub && <p className="text-xs text-dark-muted mt-0.5">{sub}</p>}
                    {change && (
                        <p className="text-xs text-primary-600 font-medium mt-1">{change}</p>
                    )}
                </div>
                <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-600">
                    <Icon size={20} />
                </div>
            </div>
        </div>
    );
}

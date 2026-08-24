import type { LucideIcon } from 'lucide-react';

interface EmptyProps {
    icon?: LucideIcon;
    title: string;
    message?: string;
    action?: React.ReactNode;
}

export default function Empty({ icon: Icon, title, message, action }: EmptyProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            {Icon && (
                <div className="w-14 h-14 bg-dark-border rounded-2xl flex items-center
                        justify-center mb-4">
                    <Icon size={24} className="text-dark-muted" />
                </div>
            )}
            <p className="text-dark-text font-medium">{title}</p>
            {message && <p className="text-sm text-dark-muted mt-1 max-w-xs">{message}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
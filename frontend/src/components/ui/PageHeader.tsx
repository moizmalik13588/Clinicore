import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    back?: string;       // back button route
    actions?: ReactNode;
    badge?: ReactNode;
}

export default function PageHeader({
    title, subtitle, back, actions, badge,
}: PageHeaderProps) {
    const navigate = useNavigate();

    return (
        <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
                {back && (
                    <button
                        onClick={() => navigate(back)}
                        className="p-2 hover:bg-dark-hover rounded-lg transition-colors
                       text-dark-muted hover:text-dark-text flex-shrink-0"
                    >
                        <ArrowLeft size={18} />
                    </button>
                )}
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-lg font-bold text-dark-text">{title}</h1>
                        {badge}
                    </div>
                    {subtitle && (
                        <p className="text-sm text-dark-muted mt-0.5">{subtitle}</p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex items-center gap-2 flex-wrap">{actions}</div>
            )}
        </div>
    );
}
import { Menu, Bell, RefreshCw } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/patients': 'Patients',
    '/appointments': 'Appointments',
    '/calls': 'Call Logs',
    '/mood': 'Mood Analytics',
    '/setup': 'Setup',
};

interface HeaderProps {
    onMenuClick: () => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export default function Header({ onMenuClick, onRefresh, isRefreshing }: HeaderProps) {
    const { pathname } = useLocation();

    const title = Object.entries(PAGE_TITLES).find(([path]) =>
        pathname.startsWith(path)
    )?.[1] || 'Clinicore';

    return (
        <header className="h-14 bg-dark-card border-b border-dark-border flex items-center
                       justify-between px-4 lg:px-6 sticky top-0 z-10">

            {/* Left */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden text-dark-muted hover:text-dark-text"
                >
                    <Menu size={20} />
                </button>
                <h1 className="text-base font-semibold text-dark-text">{title}</h1>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="p-2 text-dark-muted hover:text-dark-text rounded-lg
                       hover:bg-dark-hover transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                )}
                <button className="p-2 text-dark-muted hover:text-dark-text rounded-lg hover:bg-dark-hover">
                    <Bell size={16} />
                </button>
            </div>
        </header>
    );
}
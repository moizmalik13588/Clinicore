import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
    Users, Calendar, Phone, Brain,
    FileText, Search, WifiOff,
} from 'lucide-react';

interface EmptyStateProps {
    type?: 'patients' | 'appointments' | 'calls' | 'mood' | 'search' | 'offline' | 'generic';
    title?: string;
    message?: string;
    action?: ReactNode;
    icon?: LucideIcon;
}

const PRESETS = {
    patients: {
        icon: Users,
        title: 'No patients yet',
        message: 'Add your first patient to get started',
    },
    appointments: {
        icon: Calendar,
        title: 'No appointments found',
        message: 'Book an appointment to see it here',
    },
    calls: {
        icon: Phone,
        title: 'No calls recorded',
        message: 'Calls will appear here once your AI agent is active',
    },
    mood: {
        icon: Brain,
        title: 'No mood data',
        message: 'Mood events are recorded during live calls',
    },
    search: {
        icon: Search,
        title: 'No results found',
        message: 'Try a different search term or clear filters',
    },
    offline: {
        icon: WifiOff,
        title: 'Connection lost',
        message: 'Check your internet connection and try again',
    },
    generic: {
        icon: FileText,
        title: 'Nothing here yet',
        message: 'Data will appear here once available',
    },
};

export default function EmptyState({
    type = 'generic', title, message, action, icon: CustomIcon,
}: EmptyStateProps) {
    const preset = PRESETS[type];
    const Icon = CustomIcon || preset.icon;

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-dark-border/50 rounded-2xl flex items-center
                      justify-center mb-4">
                <Icon size={28} className="text-dark-muted" />
            </div>
            <h3 className="text-dark-text font-semibold mb-1.5">
                {title || preset.title}
            </h3>
            <p className="text-sm text-dark-muted max-w-xs">
                {message || preset.message}
            </p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
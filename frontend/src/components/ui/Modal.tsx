import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
};

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
    // ESC key
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative w-full ${SIZES[size]} bg-dark-card border border-dark-border
                       rounded-2xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border sticky top-0 bg-dark-card">
                    <h3 className="font-semibold text-dark-text">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-dark-muted hover:text-dark-text rounded-lg p-1
                       hover:bg-dark-hover transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
}
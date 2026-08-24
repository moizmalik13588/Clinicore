import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
}

const CONFIG = {
    success: { icon: CheckCircle, color: 'border-green-500 bg-green-500/10 text-green-400' },
    error: { icon: XCircle, color: 'border-red-500 bg-red-500/10 text-red-400' },
    warning: { icon: AlertCircle, color: 'border-yellow-500 bg-yellow-500/10 text-yellow-400' },
};

export function Toast({ message, type, onClose }: ToastProps) {
    const { icon: Icon, color } = CONFIG[type];

    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${color} shadow-lg max-w-sm`}>
            <Icon size={18} />
            <p className="text-sm flex-1">{message}</p>
            <button onClick={onClose} className="opacity-60 hover:opacity-100">
                <X size={16} />
            </button>
        </div>
    );
}

// ─── Toast Context ────────────────────────────────────────────────────────────
import { createContext, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => { } });

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const remove = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map(t => (
                    <Toast key={t.id} message={t.message} type={t.type} onClose={() => remove(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);




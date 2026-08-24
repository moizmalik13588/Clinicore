import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Spinner from './Spinner';

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
    loading?: boolean;
}

export default function ConfirmDialog({
    open, onClose, onConfirm, title, message,
    confirmLabel = 'Confirm', danger = false, loading,
}: ConfirmDialogProps) {
    return (
        <Modal open={open} onClose={onClose} title={title} size="sm">
            <div className="space-y-4">
                {danger && (
                    <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-xl border
                          border-red-500/20">
                        <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
                        <p className="text-sm text-red-400">{message}</p>
                    </div>
                )}
                {!danger && (
                    <p className="text-sm text-dark-muted">{message}</p>
                )}
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="btn-secondary" disabled={loading}>
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`${danger ? 'btn-danger' : 'btn-primary'} flex items-center gap-2`}
                    >
                        {loading && <Spinner size="sm" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
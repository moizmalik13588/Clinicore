import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
    onPage: (page: number) => void;
}

export default function Pagination({
    page, totalPages, total, limit, onPage,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);

    return (
        <div className="flex items-center justify-between pt-4 border-t border-dark-border">
            <p className="text-xs text-dark-muted">
                Showing {from}–{to} of {total}
            </p>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPage(page - 1)}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg text-dark-muted hover:bg-dark-hover
                     disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 5) {
                        p = i + 1;
                    } else if (page <= 3) {
                        p = i + 1;
                    } else if (page >= totalPages - 2) {
                        p = totalPages - 4 + i;
                    } else {
                        p = page - 2 + i;
                    }
                    return (
                        <button
                            key={p}
                            onClick={() => onPage(p)}
                            className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors
                ${p === page
                                    ? 'bg-primary-600 text-white'
                                    : 'text-dark-muted hover:bg-dark-hover'
                                }`}
                        >
                            {p}
                        </button>
                    );
                })}

                <button
                    onClick={() => onPage(page + 1)}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg text-dark-muted hover:bg-dark-hover
                     disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
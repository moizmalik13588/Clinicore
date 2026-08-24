import { ReactNode } from 'react';
import Spinner from './Spinner';
import Empty from './Empty';
import { TableIcon } from 'lucide-react';

interface Column<T> {
    key: string;
    label: string;
    render?: (row: T) => ReactNode;
    width?: string;
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    keyField: keyof T;
    onRowClick?: (row: T) => void;
    emptyText?: string;
}

export default function Table<T>({
    columns, data, loading, keyField, onRowClick, emptyText,
}: TableProps<T>) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-dark-border">
                        {columns.map(col => (
                            <th
                                key={col.key}
                                className="text-left py-3 px-4 text-xs font-medium text-dark-muted
                           uppercase tracking-wide"
                                style={{ width: col.width }}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={columns.length} className="text-center py-12">
                                <div className="flex justify-center">
                                    <Spinner />
                                </div>
                            </td>
                        </tr>
                    ) : data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length}>
                                <Empty
                                    icon={TableIcon}
                                    title={emptyText || 'No data found'}
                                />
                            </td>
                        </tr>
                    ) : (
                        data.map(row => (
                            <tr
                                key={String(row[keyField])}
                                onClick={() => onRowClick?.(row)}
                                className={`
                  border-b border-dark-border/50 last:border-0
                  ${onRowClick ? 'cursor-pointer hover:bg-dark-hover/50' : ''}
                  transition-colors
                `}
                            >
                                {columns.map(col => (
                                    <td key={col.key} className="py-3 px-4 text-dark-text">
                                        {col.render
                                            ? col.render(row)
                                            : String((row as any)[col.key] ?? '—')
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
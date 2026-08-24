import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary]', error, info);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
                    <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center
                          justify-center mb-4">
                        <AlertTriangle size={24} className="text-red-400" />
                    </div>
                    <h3 className="text-dark-text font-semibold mb-2">Something went wrong</h3>
                    <p className="text-dark-muted text-sm text-center max-w-sm mb-6">
                        {this.state.error?.message || 'An unexpected error occurred.'}
                    </p>
                    <button
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            window.location.reload();
                        }}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <RefreshCw size={14} /> Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
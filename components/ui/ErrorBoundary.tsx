'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: React.ReactNode;
    /** Optional label shown in the fallback UI (e.g. "Options Signal") */
    name?: string;
    /** Optional callback when user clicks Retry */
    onRetry?: () => void;
}

interface State {
    hasError: boolean;
    errorMessage: string;
}

/**
 * React Error Boundary — wraps any widget to prevent the full dashboard from
 * crashing when an individual component throws during render.
 *
 * Usage:
 *   <ErrorBoundary name="Options Signal">
 *     <OptionsSignal ... />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, errorMessage: '' };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, errorMessage: error.message };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error(`[ErrorBoundary] ${this.props.name || 'Widget'} crashed:`, error, info.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, errorMessage: '' });
        this.props.onRetry?.();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-gray-800/60 border border-red-500/20 text-center min-h-[80px]">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-red-400">
                            {this.props.name || 'Widget'} unavailable
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-mono max-w-xs truncate">
                            {this.state.errorMessage || 'An unexpected error occurred'}
                        </p>
                    </div>
                    <button
                        onClick={this.handleRetry}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Retry
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

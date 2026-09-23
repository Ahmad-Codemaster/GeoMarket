import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShoppingBag } from 'lucide-react';
import { Button } from '../ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/stores';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-slate-600 text-sm mb-6">
              We encountered an unexpected error while loading this page. Please try refreshing or return to browse nearby stores.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                onClick={this.handleReload}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </Button>

              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl py-2.5 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Explore Stores
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

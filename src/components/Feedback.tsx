import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ message?: string; className?: string }> = ({
  message = 'Loading...',
  className = 'py-12',
}) => (
  <div className={`flex flex-col items-center justify-center gap-3 text-slate-500 ${className}`}>
    <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
    <span className="text-sm font-medium">{message}</span>
  </div>
);

export const ErrorBanner: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({ title = 'An error occurred', message, onRetry }) => (
  <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-900 mb-6">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h4 className="text-sm font-semibold">{title}</h4>
        <p className="text-sm mt-0.5 text-rose-700">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 text-xs font-medium px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

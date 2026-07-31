'use client';

import { AlertTriangle } from 'lucide-react';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/**
 * Reusable empty state component shown when a list/table has no data.
 */
export default function EmptyState({
  title = 'Nothing here yet',
  message = 'No records to display at this time.',
  onRetry,
}: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-8 text-center rounded-2xl"
      style={{ border: '1px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)' }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <AlertTriangle size={24} style={{ color: 'var(--text-muted)' }} />
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
        {title}
      </h3>
      <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 btn-outline text-sm px-5 py-2"
          style={{ color: 'var(--text-secondary)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

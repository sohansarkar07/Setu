'use client';

/**
 * Skeleton loader card for invoice list items — prevents layout shift while loading.
 */
export function InvoiceSkeleton() {
  return (
    <div className="card p-5 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-6 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>
      <div className="h-3 w-48 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="flex gap-3">
        <div className="h-8 w-24 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="h-8 w-24 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for stat cards on dashboard/market pages.
 */
export function StatSkeleton() {
  return (
    <div className="card p-5 space-y-3 animate-pulse">
      <div className="h-3 w-20 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="h-7 w-28 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="h-2 w-16 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
    </div>
  );
}

/**
 * Full-page skeleton loader grid.
 */
export function PageSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4`}>
        {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
      </div>
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => <InvoiceSkeleton key={i} />)}
      </div>
    </div>
  );
}

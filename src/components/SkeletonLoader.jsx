/**
 * Shared skeleton loader components for use across all pages.
 * Uses Tailwind's animate-pulse for a smooth shimmer effect.
 */

/** Single shimmer block */
function Shimmer({ className = '' }) {
  return <div className={`bg-slate-200 rounded animate-pulse ${className}`} />;
}

/** ─── POS / Product Grid Skeleton ─────────────────────────── */
export function CardSkeleton({ count = 12 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-3 rounded-xl border border-slate-100 bg-white space-y-2">
          <Shimmer className="w-full h-20 rounded-lg" />
          <Shimmer className="h-3 w-3/4" />
          <Shimmer className="h-3 w-1/2" />
          <Shimmer className="h-4 w-1/3" />
        </div>
      ))}
    </>
  );
}

/** ─── Table Rows Skeleton (Sales, Suppliers, etc.) ─────────── */
export function TableSkeleton({ rows = 8, cols = 6 }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, j) => (
            <Shimmer
              key={j}
              className={`h-4 flex-1 ${j === 0 ? 'max-w-[100px]' : ''} ${j === cols - 1 ? 'max-w-[80px]' : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** ─── Stat Cards Skeleton (Dashboard) ──────────────────────── */
export function StatSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card">
          <Shimmer className="w-12 h-12 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-3 w-24" />
            <Shimmer className="h-6 w-32" />
            <Shimmer className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** ─── Chart Skeleton ────────────────────────────────────────── */
export function ChartSkeleton() {
  return (
    <div className="card space-y-3">
      <Shimmer className="h-4 w-40" />
      <Shimmer className="w-full h-[240px] rounded-xl" />
    </div>
  );
}

/** ─── Generic inline spinner (non-blocking) ─────────────────── */
export function InlineSpinner({ size = 18 }) {
  return (
    <div
      className="border-2 border-slate-300 border-t-primary-600 rounded-full animate-spin shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

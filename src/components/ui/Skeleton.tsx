interface SkeletonProps {
  className?: string;
}

/** Generic pulsing placeholder block — pass a Tailwind width/height via className */
export function Skeleton({ className = 'h-4 w-full' }: SkeletonProps) {
  return <div role="status" aria-label="Loading" className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

/** Preset: a single task-card-shaped skeleton, for board loading states */
export function SkeletonCard() {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
      <Skeleton className="h-4 w-3/4" />
      <div className="mt-3 flex justify-between">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

/** Preset: a table-shaped skeleton, for DataTable loading states */
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: columns }).map((__, c) => (
            <Skeleton key={c} className="h-6 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

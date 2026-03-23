export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-9 w-56 animate-pulse rounded-lg bg-surface" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl border border-border bg-surface-raised" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl border border-border bg-surface-raised" />
    </div>
  )
}

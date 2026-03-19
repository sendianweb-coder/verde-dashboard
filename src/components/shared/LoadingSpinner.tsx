export function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2 text-sm text-text-secondary" role="status" aria-live="polite">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-brand-600" />
      Loading...
    </div>
  )
}

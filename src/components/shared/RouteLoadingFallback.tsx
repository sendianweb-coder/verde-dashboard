import { RefreshCw } from 'lucide-react'

interface RouteLoadingFallbackProps {
  label?: string
}

export function RouteLoadingFallback({ label = 'Loading page...' }: RouteLoadingFallbackProps) {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-3 text-sm text-text-secondary">
        <RefreshCw className="size-4 animate-spin text-brand-600" />
        {label}
      </div>
    </div>
  )
}

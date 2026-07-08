import { AlertTriangle, ArrowLeft, Home, RotateCcw } from 'lucide-react'
import { useMemo } from 'react'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { reportFrontendError } from '@/services/errorReportingService'

function getRouteErrorMessage(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return error.statusText || error.data?.message || `Route failed with status ${error.status}`
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'The requested page could not be rendered safely.'
}

export function RouteErrorFallback() {
  const error = useRouteError()
  const navigate = useNavigate()
  const report = useMemo(() => reportFrontendError({ error, source: 'router-error-element' }), [error])

  return (
    <section className="flex min-h-[420px] items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-xl border border-border bg-surface p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <AlertTriangle className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-text-primary">Page failed to load</h1>
            <p className="mt-1 text-sm text-text-secondary">{getRouteErrorMessage(error)}</p>
            <p className="mt-3 rounded-lg border border-border bg-background px-3 py-2 text-xs text-text-muted">
              Error reference: <span className="font-mono text-text-secondary">{report.id}</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" onClick={() => window.location.reload()}>
                <RotateCcw className="size-4" />
                Reload
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                <ArrowLeft className="size-4" />
                Go back
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/')}>
                <Home className="size-4" />
                Go home
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import { AlertTriangle, Home, RotateCcw } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { reportFrontendError } from '@/services/errorReportingService'

interface AppErrorBoundaryProps {
  children: ReactNode
  fallbackTitle?: string
  fallbackMessage?: string
  resetKey?: string
}

interface AppErrorBoundaryState {
  hasError: boolean
  errorReportId?: string
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    const report = reportFrontendError({
      error,
      source: 'react-error-boundary',
      componentStack: errorInfo.componentStack ?? undefined,
    })

    this.setState({ errorReportId: report.id })
  }

  componentDidUpdate(previousProps: AppErrorBoundaryProps) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, errorReportId: undefined })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorReportId: undefined })
  }

  handleGoHome = () => {
    window.location.assign('/')
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <section className="flex min-h-[420px] items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl rounded-xl border border-border bg-surface p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <AlertTriangle className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-text-primary">
                {this.props.fallbackTitle ?? 'Something went wrong'}
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                {this.props.fallbackMessage ??
                  'This section could not be rendered safely. The error was captured so the team can investigate.'}
              </p>
              {this.state.errorReportId ? (
                <p className="mt-3 rounded-lg border border-border bg-background px-3 py-2 text-xs text-text-muted">
                  Error reference: <span className="font-mono text-text-secondary">{this.state.errorReportId}</span>
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" onClick={this.handleRetry}>
                  <RotateCcw className="size-4" />
                  Try again
                </Button>
                <Button type="button" variant="secondary" onClick={this.handleGoHome}>
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
}

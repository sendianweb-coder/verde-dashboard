import { useEffect } from 'react'

import { reportFrontendError } from '@/services/errorReportingService'

export function FrontendErrorListeners() {
  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      reportFrontendError({
        error: event.error ?? event.message,
        source: 'window-error',
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportFrontendError({
        error: event.reason,
        source: 'unhandled-rejection',
      })
    }

    window.addEventListener('error', handleWindowError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleWindowError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null
}

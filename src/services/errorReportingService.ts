import { useAuthStore } from '@/store/authStore'
import type { FrontendRuntimeErrorReport, ReportFrontendErrorInput } from '@/types/frontendError'

const FRONTEND_ERROR_STORAGE_KEY = 'verde-frontend-error-reports'
const MAX_STORED_ERROR_REPORTS = 20

interface NormalizedError {
  message: string
  name?: string
  stack?: string
}

function createErrorId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `frontend-error-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    return {
      message: error.message || 'Unknown frontend error',
      name: error.name,
      stack: error.stack,
    }
  }

  if (typeof error === 'string') {
    return { message: error }
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? 'Unknown frontend error')

    return { message }
  }

  return { message: 'Unknown frontend error' }
}

function getCurrentRoute() {
  if (typeof window === 'undefined') {
    return 'server-render'
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

function getUserAgent() {
  if (typeof navigator === 'undefined') {
    return 'unknown'
  }

  return navigator.userAgent
}

function getAppVersion() {
  return import.meta.env.VITE_APP_VERSION as string | undefined
}

function sanitizeStack(stack: string | undefined) {
  if (!stack) {
    return undefined
  }

  return stack.slice(0, 8_000)
}

function persistReportLocally(report: FrontendRuntimeErrorReport) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const previousReports = JSON.parse(window.localStorage.getItem(FRONTEND_ERROR_STORAGE_KEY) ?? '[]') as FrontendRuntimeErrorReport[]
    const nextReports = [report, ...previousReports].slice(0, MAX_STORED_ERROR_REPORTS)
    window.localStorage.setItem(FRONTEND_ERROR_STORAGE_KEY, JSON.stringify(nextReports))
  } catch {
    // localStorage may be unavailable in private mode or blocked contexts.
  }
}

function sendReportToEndpoint(report: FrontendRuntimeErrorReport) {
  const endpoint = import.meta.env.VITE_FRONTEND_ERROR_ENDPOINT as string | undefined

  if (!endpoint || typeof window === 'undefined') {
    return
  }

  const body = JSON.stringify(report)

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }))
      return
    }

    void fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'include',
    })
  } catch {
    // Reporting must never crash the app or fallback UI.
  }
}

export function buildFrontendErrorReport({ error, source, componentStack }: ReportFrontendErrorInput): FrontendRuntimeErrorReport {
  const normalizedError = normalizeError(error)
  const authState = useAuthStore.getState()
  const route = getCurrentRoute()

  return {
    id: createErrorId(),
    timestamp: new Date().toISOString(),
    message: normalizedError.message,
    name: normalizedError.name,
    stack: sanitizeStack(normalizedError.stack),
    componentStack: sanitizeStack(componentStack),
    route,
    userAgent: getUserAgent(),
    userId: authState.user?.id,
    userRole: authState.user?.role,
    appVersion: getAppVersion(),
    source,
    stateSummary: {
      authenticated: authState.isAuthenticated,
      currentPath: route,
    },
  }
}

export function reportFrontendError(input: ReportFrontendErrorInput) {
  const report = buildFrontendErrorReport(input)

  if (import.meta.env.DEV) {
    console.error('Frontend runtime error captured', report)
  }

  persistReportLocally(report)
  sendReportToEndpoint(report)

  return report
}

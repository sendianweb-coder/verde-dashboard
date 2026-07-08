import type { UserRole } from '@/types/auth'

export type FrontendRuntimeErrorSource =
  | 'react-error-boundary'
  | 'router-error-element'
  | 'window-error'
  | 'unhandled-rejection'

export interface FrontendRuntimeStateSummary {
  authenticated: boolean
  currentPath: string
}

export interface FrontendRuntimeErrorReport {
  id: string
  timestamp: string
  message: string
  name?: string
  stack?: string
  componentStack?: string
  route: string
  userAgent: string
  userId?: string
  userRole?: UserRole
  appVersion?: string
  source: FrontendRuntimeErrorSource
  stateSummary: FrontendRuntimeStateSummary
}

export interface ReportFrontendErrorInput {
  error: unknown
  source: FrontendRuntimeErrorSource
  componentStack?: string
}

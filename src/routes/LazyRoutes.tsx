import { lazy, Suspense } from 'react'
import { useLocation } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { AppErrorBoundary } from '@/components/shared/AppErrorBoundary'
import { RouteLoadingFallback } from '@/components/shared/RouteLoadingFallback'

const InventoryGridPage = lazy(() =>
  import('@/pages/shared/InventoryGridPage').then((module) => ({
    default: module.InventoryGridPage,
  })),
)

export function AppShellErrorBoundaryRoute() {
  const location = useLocation()

  return (
    <AppErrorBoundary resetKey={location.pathname}>
      <AppShell />
    </AppErrorBoundary>
  )
}

export function LazyInventoryGridRoute() {
  return (
    <Suspense fallback={<RouteLoadingFallback label="Loading inventory grid..." />}>
      <InventoryGridPage />
    </Suspense>
  )
}

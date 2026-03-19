import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/auth'

import { roleRoutes } from './roleRoutes'

interface ProtectedRouteProps {
  allowRoles: UserRole[]
}

export function ProtectedRoute({ allowRoles }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const canAccess =
    allowRoles.includes(user.role) || (user.role === 'ADMIN' && allowRoles.includes('STORE_KEEPER'))

  if (!canAccess) {
    return <Navigate to={roleRoutes[user.role]} replace />
  }

  return <Outlet />
}

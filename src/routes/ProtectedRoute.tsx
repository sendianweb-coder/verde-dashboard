import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useCurrentUser } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/auth'

import { roleRoutes } from './roleRoutes'

interface ProtectedRouteProps {
  allowRoles: UserRole[]
}

export function ProtectedRoute({ allowRoles }: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const location = useLocation()
  const { data: me, isPending } = useCurrentUser()

  useEffect(() => {
    if (me) {
      setUser(me)
    }
  }, [me, setUser])

  const currentUser = me ?? user

  if (isPending && !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page text-text-secondary">
        Checking your session...
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const canAccess =
    allowRoles.includes(currentUser.role) ||
    (currentUser.role === 'ADMIN' && allowRoles.includes('STORE_KEEPER'))

  if (!canAccess) {
    return <Navigate to={roleRoutes[currentUser.role]} replace />
  }

  return <Outlet />
}

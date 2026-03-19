import { useMutation, useQuery } from '@tanstack/react-query'

import { changePassword, getMe, login, logout as logoutApi } from '@/api/auth.api'
import { roleRoutes } from '@/routes/roleRoutes'
import { useAuthStore } from '@/store/authStore'
import type { AuthUser, ChangePasswordPayload, LoginPayload } from '@/types/auth'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMe,
    staleTime: 30_000,
  })
}

export function useLogin() {
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (response) => {
      setUser(response.user)
    },
  })
}

export function useLogout() {
  const clearAuth = useAuthStore((state) => state.logout)

  return useMutation({
    mutationFn: () => logoutApi(),
    onSuccess: clearAuth,
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
  })
}

export function getDefaultRouteForRole(role: AuthUser['role']) {
  return roleRoutes[role]
}

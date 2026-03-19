import { useMutation, useQuery } from '@tanstack/react-query'

import { apiClient } from '@/api/client'
import { roleRoutes } from '@/routes/roleRoutes'
import { useAuthStore } from '@/store/authStore'
import type { AuthUser, LoginPayload } from '@/types/auth'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await apiClient.get<AuthUser>('/auth/me')
      return data
    },
    staleTime: 30_000,
  })
}

export function useLogin() {
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await apiClient.post<AuthUser>('/auth/login', payload)
      return data
    },
    onSuccess: (user) => {
      setUser(user)
    },
  })
}

export function useLogout() {
  const logout = useAuthStore((state) => state.logout)

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout')
    },
    onSuccess: logout,
  })
}

export function getDefaultRouteForRole(role: AuthUser['role']) {
  return roleRoutes[role]
}

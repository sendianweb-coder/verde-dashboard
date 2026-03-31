import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { AuthUser } from '@/types/auth'

interface AuthStoreState {
  user: AuthUser | null
  role: AuthUser['role'] | null
  isAuthenticated: boolean
  accessToken: string | null
  authMode: 'cookie' | 'bearer' | null
  setUser: (user: AuthUser) => void
  setSession: (user: AuthUser, token?: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      isAuthenticated: false,
      accessToken: null,
      authMode: null,
      setUser: (user) =>
        set((state) => ({
          user,
          role: user.role,
          isAuthenticated: true,
          accessToken: state.accessToken,
          authMode: state.accessToken ? 'bearer' : state.authMode,
        })),
      setSession: (user, token) =>
        set({
          user,
          role: user.role,
          isAuthenticated: true,
          accessToken: token ?? null,
          authMode: token ? 'bearer' : 'cookie',
        }),
      clearAuth: () => set({ user: null, role: null, isAuthenticated: false, accessToken: null, authMode: null }),
    }),
    {
      name: 'verde-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        authMode: state.authMode,
      }),
    },
  ),
)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { AuthUser } from '@/types/auth'

interface AuthStoreState {
  user: AuthUser | null
  role: AuthUser['role'] | null
  isAuthenticated: boolean
  setUser: (user: AuthUser) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, role: user.role, isAuthenticated: true }),
      clearAuth: () => set({ user: null, role: null, isAuthenticated: false }),
    }),
    {
      name: 'verde-auth',
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

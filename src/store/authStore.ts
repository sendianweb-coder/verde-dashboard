import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { AuthUser } from '@/types/auth'

interface AuthStoreState {
  user: AuthUser | null
  isAuthenticated: boolean
  setUser: (user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'verde-auth',
    },
  ),
)

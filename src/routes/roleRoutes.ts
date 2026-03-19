import type { UserRole } from '@/types/auth'

export const roleRoutes: Record<UserRole, string> = {
  ADMIN: '/admin/dashboard',
  STORE_KEEPER: '/store-keeper/dashboard',
  EMPLOYEE: '/employee/dashboard',
}

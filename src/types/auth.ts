export type UserRole = 'ADMIN' | 'STORE_KEEPER' | 'EMPLOYEE'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ChangePasswordPayload {
  oldPassword: string
  newPassword: string
}

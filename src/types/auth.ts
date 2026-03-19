export type UserRole = 'ADMIN' | 'STORE_KEEPER' | 'EMPLOYEE'

export interface AuthUser {
  id: string
  fullName: string
  email: string
  role: UserRole
}

export interface LoginPayload {
  email: string
  password: string
}

import type { UserRole } from '@/types/auth'
import type { PaginationMeta } from '@/types/common'
import type { ApprovalEvent, RequestStatus } from '@/types/request'
import type { AuditLogEntry } from '@/types/audit'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UserRequestActivity {
  id: string
  status: RequestStatus
  notes: string | null
  itemCount: number
  project: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

export interface UserOrderActivity {
  id: string
  status: string
  totalAmount: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface UserActivityProfile {
  profile: User
  requests: UserRequestActivity[]
  approvals: ApprovalEvent[]
  orders: UserOrderActivity[]
  auditLogs: {
    data: AuditLogEntry[]
    pagination: PaginationMeta
  }
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: UserRole
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  password?: string
  role?: UserRole
  isActive?: boolean
}

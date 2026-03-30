import type { OrderStatus } from '@/types/order'
import type { PaginationMeta } from '@/types/common'
import type { InternalRequest, RequestStatus } from '@/types/request'

type StatusTotals<TStatus extends string> = Partial<Record<TStatus, number>>

type RecentActivityAction = Extract<RequestStatus, 'APPROVED' | 'PICKED_UP'>

export interface RecentActivityItem {
  id: string
  action: RecentActivityAction
  occurredAt: string
  comment: string | null
  request: {
    id: string
    status: RequestStatus
  }
  performedBy: {
    id: string
    name: string
    role: string
  }
  requestedBy: {
    id: string
    name: string
    email: string
  }
  source: {
    projectId: string
    projectName: string
  }
}

export interface AdminDashboardOverview {
  users: {
    total: number
    active: number
    inactive: number
  }
  products: {
    total: number
    active: number
    inactive: number
  }
  projects: {
    active: number
  }
  requests: {
    total: number
    byStatus: StatusTotals<RequestStatus>
  }
  orders: {
    total: number
    byStatus: StatusTotals<OrderStatus>
  }
  lowStockProducts: Array<{
    name: string
    currentAvailability: number
  }>
  recentActivities: {
    summary: {
      total: number
      approvals: number
      pickups: number
    }
    items: RecentActivityItem[]
  }
}

export interface AdminRequestQueueParams {
  status?: 'PENDING' | 'APPROVED' | 'PICKED_UP'
  projectId?: string
  requesterId?: string
  page?: number
  limit?: number
}

export interface AdminRequestQueueResponse {
  data: InternalRequest[]
  pagination: PaginationMeta
}

export interface BulkRequestStatusPayload {
  requestIds: string[]
  status: Extract<RequestStatus, 'APPROVED' | 'REJECTED' | 'PICKED_UP' | 'COMPLETED'>
  comment?: string
}

export interface BulkRequestStatusResultItem {
  requestId: string
  success: boolean
  error?: string
  code?: string
}

export interface BulkRequestStatusResult {
  status: BulkRequestStatusPayload['status']
  total: number
  successCount: number
  failureCount: number
  results: BulkRequestStatusResultItem[]
}

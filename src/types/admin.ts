import type { OrderStatus } from '@/types/order'
import type { PaginationMeta } from '@/types/common'
import type { InternalRequest, RequestStatus } from '@/types/request'

type StatusTotals<TStatus extends string> = Partial<Record<TStatus, number>>

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
  status: Extract<RequestStatus, 'APPROVED' | 'REJECTED' | 'COMPLETED'>
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

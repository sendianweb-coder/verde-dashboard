import type { OrderStatus } from '@/types/order'
import type { PaginationMeta } from '@/types/common'
import type { InternalRequest, RequestStatus } from '@/types/request'

type StatusTotals<TStatus extends string> = Partial<Record<TStatus, number>>

export type AdminRecentActivityEvent = 'approved' | 'pickedUp'

export interface AdminRecentActivityItem {
  event: AdminRecentActivityEvent
  at: string
  requestId: string
  projectName: string
  performedBy: string
  requestedBy: string
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
    total: number
    items: AdminRecentActivityItem[]
  }
}

export type AdminOrderAnalyticsPeriod = 'week' | 'month' | 'year'
export interface AdminOrderAnalyticsParams { period?: AdminOrderAnalyticsPeriod }
export interface AdminOrderAnalytics {
  period: { key: AdminOrderAnalyticsPeriod; from: string; to: string; granularity: 'day' | 'month' }
  totals: { orderCount: number; netOrderCount: number; netRevenue: number; averageOrderValue: number; unpricedInternalRequestCount: number }
  revenueSeries: Array<{ date: string; orderCount: number; netRevenue: number }>
  topProducts: Array<{ productId: string; name: string; quantity: number; netRevenue: number }>
}

export interface AdminRequestQueueParams {
  status?: RequestStatus
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

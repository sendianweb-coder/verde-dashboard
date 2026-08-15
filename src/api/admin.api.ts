import { apiClient } from '@/api/client'
import type { ApiSuccessResponse } from '@/types/common'
import type {
  AdminDashboardOverview,
  AdminOrderAnalytics,
  AdminOrderAnalyticsParams,
  AdminRequestQueueParams,
  AdminRequestQueueResponse,
  BulkRequestStatusPayload,
  BulkRequestStatusResult,
} from '@/types/admin'

export async function getAdminDashboardOverview(): Promise<AdminDashboardOverview> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminDashboardOverview>>('/admin/dashboard/overview')
  return data.data
}

export async function getAdminOrderAnalytics(params?: AdminOrderAnalyticsParams): Promise<AdminOrderAnalytics> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminOrderAnalytics>>('/admin/dashboard/order-analytics', { params })
  return data.data
}

export async function getAdminRequestQueue(params?: AdminRequestQueueParams): Promise<AdminRequestQueueResponse> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminRequestQueueResponse['data']> & { pagination: AdminRequestQueueResponse['pagination'] }>('/admin/requests/queue', {
    params,
  })

  return {
    data: data.data,
    pagination: data.pagination,
  }
}

export async function bulkUpdateRequestStatus(payload: BulkRequestStatusPayload): Promise<BulkRequestStatusResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<BulkRequestStatusResult>>('/admin/requests/bulk-status', payload)
  return data.data
}

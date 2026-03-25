import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { bulkUpdateRequestStatus, getAdminDashboardOverview, getAdminRequestQueue } from '@/api/admin.api'
import { requestsQueryKeys } from '@/hooks/useRequests'
import type { AdminRequestQueueParams, BulkRequestStatusPayload } from '@/types/admin'

const ADMIN_DASHBOARD_STALE_TIME = 60_000

export const adminQueryKeys = {
  all: ['admin'] as const,
  dashboardOverview: () => ['admin', 'dashboard', 'overview'] as const,
  requestQueue: (params?: AdminRequestQueueParams) => ['admin', 'requests', 'queue', params] as const,
}

export function useAdminDashboardOverview() {
  return useQuery({
    queryKey: adminQueryKeys.dashboardOverview(),
    queryFn: getAdminDashboardOverview,
    staleTime: ADMIN_DASHBOARD_STALE_TIME,
  })
}

export function useAdminRequestQueue(params?: AdminRequestQueueParams) {
  return useQuery({
    queryKey: adminQueryKeys.requestQueue(params),
    queryFn: () => getAdminRequestQueue(params),
    staleTime: ADMIN_DASHBOARD_STALE_TIME,
  })
}

export function useBulkUpdateRequestStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BulkRequestStatusPayload) => bulkUpdateRequestStatus(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: requestsQueryKeys.all })
    },
  })
}

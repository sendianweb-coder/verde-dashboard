import { apiClient } from '@/api/client'
import type { AuditLogEntry } from '@/types/audit'
import type { PaginatedResponse } from '@/types/common'

export interface GetAuditLogsParams {
  page?: number
  limit?: number
  actorId?: string
  entity?: string
  from?: string
  to?: string
}

export async function getAuditLogs(params?: GetAuditLogsParams): Promise<PaginatedResponse<AuditLogEntry>> {
  const { data } = await apiClient.get<PaginatedResponse<AuditLogEntry>>('/audit', { params })
  return data
}

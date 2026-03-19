import { apiClient } from '@/api/client'
import type { AuditLogEntry } from '@/types/audit'
import type { PaginatedResponse } from '@/types/common'

export async function getAuditLogs(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<AuditLogEntry>> {
  const { data } = await apiClient.get<PaginatedResponse<AuditLogEntry>>('/audit', { params })
  return data
}

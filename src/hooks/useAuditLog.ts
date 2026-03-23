import { useQuery } from '@tanstack/react-query'

import { getAuditLogs, type GetAuditLogsParams } from '@/api/audit.api'

const AUDIT_LOG_LIST_STALE_TIME = 60_000

export const auditLogQueryKeys = {
  all: ['audit-log'] as const,
  list: (params?: GetAuditLogsParams) => ['audit-log', 'list', params] as const,
}

export function useAuditLog(params?: GetAuditLogsParams) {
  return useQuery({
    queryKey: auditLogQueryKeys.list(params),
    queryFn: () => getAuditLogs(params),
    staleTime: AUDIT_LOG_LIST_STALE_TIME,
  })
}

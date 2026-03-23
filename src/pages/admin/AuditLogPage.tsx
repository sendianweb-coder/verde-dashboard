import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { useAuditLog } from '@/hooks/useAuditLog'
import type { AuditLogEntry } from '@/types/audit'

export function AdminAuditLogPage() {
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const auditLogQuery = useAuditLog({ page, limit })

  const columns = useMemo<Array<ColumnDef<AuditLogEntry>>>(
    () => [
      { accessorKey: 'actorId', header: 'Actor' },
      { accessorKey: 'action', header: 'Action' },
      { accessorKey: 'entity', header: 'Entity' },
      { accessorKey: 'entityId', header: 'Entity ID' },
      {
        accessorKey: 'createdAt',
        header: 'Timestamp',
        cell: ({ row }) => <span>{new Date(row.original.createdAt).toLocaleString()}</span>,
      },
    ],
    [],
  )

  const entries = auditLogQuery.data?.data ?? []
  const totalPages = auditLogQuery.data?.pagination.totalPages ?? 1

  return (
    <section className="space-y-6">
      <PageHeader title="Audit Log" subtitle="System activity trail with actor and entity details" />

      <DataTable
        data={entries}
        columns={columns}
        isLoading={auditLogQuery.isLoading}
        emptyTitle="No audit entries"
        emptyDescription="Audit events will appear here as actions are performed."
      />

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
          Previous Page
        </Button>
        <p className="text-sm text-text-secondary">Page {page} of {totalPages}</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Next Page
        </Button>
      </div>
    </section>
  )
}

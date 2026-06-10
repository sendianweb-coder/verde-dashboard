import type { ColumnDef } from '@tanstack/react-table'
import { Filter } from 'lucide-react'
import { useMemo, useState } from 'react'

import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuditLog } from '@/hooks/useAuditLog'
import { getErrorMessage } from '@/lib/errors'
import type { AuditLogEntry } from '@/types/audit'

export function AdminAuditLogPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [actorId, setActorId] = useState('')
  const [entity, setEntity] = useState('')
  const auditLogQuery = useAuditLog({
    page,
    limit,
    actorId: actorId.trim() || undefined,
    entity: entity.trim() || undefined,
  })

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
  const pagination = auditLogQuery.data?.pagination
  const totalPages = pagination?.totalPages ?? 1
  const hasActiveFilters = actorId.trim() !== '' || entity.trim() !== ''

  const updateActorId = (value: string) => {
    setActorId(value)
    setPage(1)
  }

  const updateEntity = (value: string) => {
    setEntity(value)
    setPage(1)
  }

  const clearFilters = () => {
    setActorId('')
    setEntity('')
    setPage(1)
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Audit Log" subtitle="System activity trail with actor and entity details" />

      <DataTable
        data={entries}
        columns={columns}
        title="Audit Entries"
        description="Review server-side audit events by actor, action, entity, and timestamp."
        resultsLabel="entries"
        enableSearch={false}
        manualPagination
        pageIndex={page - 1}
        pageSize={limit}
        pageCount={totalPages}
        totalResults={pagination?.total ?? 0}
        onPageChange={(nextPageIndex) => setPage(nextPageIndex + 1)}
        onPageSizeChange={(nextLimit) => {
          setLimit(nextLimit)
          setPage(1)
        }}
        filters={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="relative w-full sm:w-[180px]">
              <Filter className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
              <Input
                aria-label="Filter audit by actor ID"
                value={actorId}
                onChange={(event) => updateActorId(event.target.value)}
                placeholder="Actor ID"
                className="h-9 bg-surface pl-8 text-sm shadow-none"
              />
            </div>
            <Input
              aria-label="Filter audit by entity"
              value={entity}
              onChange={(event) => updateEntity(event.target.value)}
              placeholder="Entity"
              className="h-9 w-full bg-surface text-sm shadow-none sm:w-[160px]"
            />
            {hasActiveFilters ? (
              <Button type="button" variant="ghost" size="sm" className="h-9" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        }
        isLoading={auditLogQuery.isLoading}
        hasError={auditLogQuery.isError}
        errorTitle="Unable to load audit log"
        errorDescription={getErrorMessage(auditLogQuery.error, { context: 'load' })}
        emptyTitle="No audit entries"
        emptyDescription="Audit events will appear here as actions are performed."
      />

    </section>
  )
}

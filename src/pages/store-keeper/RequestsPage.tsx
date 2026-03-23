import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { useRequests } from '@/hooks/useRequests'
import { getErrorMessage } from '@/lib/errors'
import type { InternalRequest, RequestStatus } from '@/types/request'

const requestStatusFilters: Array<{ label: string; value: 'ALL' | RequestStatus }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Picked Up', value: 'PICKED_UP' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Rejected', value: 'REJECTED' },
]

export function StoreKeeperRequestsPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<'ALL' | RequestStatus>('ALL')

  const requestsQuery = useRequests(activeFilter === 'ALL' ? undefined : { status: activeFilter })

  const columns = useMemo<Array<ColumnDef<InternalRequest>>>(
    () => [
      {
        accessorKey: 'requester.name',
        header: 'Requester',
        cell: ({ row }) => <span>{row.original.requester?.name ?? 'Employee'}</span>,
      },
      {
        accessorKey: 'project.name',
        header: 'Project',
        cell: ({ row }) => <span className="font-medium text-text-primary">{row.original.project.name}</span>,
      },
      {
        id: 'itemCount',
        header: 'Items',
        cell: ({ row }) => <span>{row.original.items.length}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'createdAt',
        header: 'Submitted',
        cell: ({ row }) => {
          const now = Date.now()
          const created = new Date(row.original.createdAt).getTime()
          const diffHours = Math.floor((now - created) / (1000 * 60 * 60))
          return <span>{diffHours}h ago</span>
        },
      },
    ],
    [],
  )

  return (
    <section className="space-y-6">
      <PageHeader title="Request Queue" subtitle="Process requests by lifecycle status" />

      <div className="flex flex-wrap gap-2">
        {requestStatusFilters.map((filter) => (
          <Button
            key={filter.value}
            type="button"
            variant={activeFilter === filter.value ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setActiveFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <DataTable
        data={requestsQuery.data ?? []}
        columns={columns}
        isLoading={requestsQuery.isLoading}
        hasError={requestsQuery.isError}
        errorTitle="Unable to load requests"
        errorDescription={getErrorMessage(requestsQuery.error, { context: 'load' })}
        emptyTitle="No requests found"
        emptyDescription="Try another status filter or check back later."
        onRowClick={(row) => navigate(`/store-keeper/requests/${row.id}`)}
      />
    </section>
  )
}

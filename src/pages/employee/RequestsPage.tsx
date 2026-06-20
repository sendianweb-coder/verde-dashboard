import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { QuickRequestDialog } from '@/components/shared/QuickRequestDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { useMyRequests } from '@/hooks/useRequests'
import { getErrorMessage } from '@/lib/errors'
import type { InternalRequest, RequestStatus } from '@/types/request'

const requestStatusFilters: Array<{ label: string; value: 'ALL' | RequestStatus }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Canceled', value: 'CANCELED' },
]

export function EmployeeRequestsPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<'ALL' | RequestStatus>('ALL')

  const requestsQuery = useMyRequests()

  const filteredRequests = useMemo(() => {
    const requests = requestsQuery.data ?? []
    if (activeFilter === 'ALL') return requests
    return requests.filter((request) => request.status === activeFilter)
  }, [requestsQuery.data, activeFilter])

  const columns = useMemo<Array<ColumnDef<InternalRequest>>>(
    () => [
      {
        accessorKey: 'project.name',
        header: 'Project',
        cell: ({ row }) => <span className="font-medium text-text-primary">{row.original.project.name}</span>,
      },
      {
        id: 'itemCount',
        header: 'Items',
        cell: ({ row }) => {
          const summary = row.original.summary
          const itemCount = summary?.itemCount ?? row.original.items.length

          return <span>{summary ? `${itemCount} items / ${summary.totalRequestedQuantity} units` : itemCount}</span>
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'createdAt',
        header: 'Submitted',
        cell: ({ row }) => <span>{new Date(row.original.createdAt).toLocaleDateString()}</span>,
      },
    ],
    [],
  )

  return (
    <section className="space-y-6">
      <PageHeader
        title="My Requests"
        subtitle="Track all your internal requests by status"
        action={<QuickRequestDialog />}
      />

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
        data={filteredRequests}
        columns={columns}
        isLoading={requestsQuery.isLoading}
        hasError={requestsQuery.isError}
        errorTitle="Unable to load requests"
        errorDescription={getErrorMessage(requestsQuery.error, { context: 'load' })}
        emptyTitle={requestsQuery.data?.length ? 'No requests match this status' : 'No requests yet'}
        emptyDescription={
          requestsQuery.data?.length
            ? 'Try selecting a different status filter.'
            : 'Create your first internal request to get started.'
        }
        onRowClick={(row) => navigate(`/employee/requests/${row.id}`)}
      />
    </section>
  )
}

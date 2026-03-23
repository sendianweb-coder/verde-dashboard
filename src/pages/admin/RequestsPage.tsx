import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useRequests } from '@/hooks/useRequests'
import type { InternalRequest } from '@/types/request'

export function AdminRequestsPage() {
  const navigate = useNavigate()
  const requestsQuery = useRequests()

  const columns = useMemo<Array<ColumnDef<InternalRequest>>>(
    () => [
      {
        accessorKey: 'id',
        header: 'Request ID',
      },
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
        header: 'Date',
        cell: ({ row }) => <span>{new Date(row.original.createdAt).toLocaleDateString()}</span>,
      },
    ],
    [],
  )

  return (
    <section className="space-y-6">
      <PageHeader title="Request Overview" subtitle="Monitor all internal requests across roles" />
      <DataTable
        data={requestsQuery.data ?? []}
        columns={columns}
        isLoading={requestsQuery.isLoading}
        emptyTitle="No requests found"
        emptyDescription="Requests will appear once users submit them."
        onRowClick={(row) => navigate(`/admin/requests?requestId=${row.id}`)}
      />
    </section>
  )
}

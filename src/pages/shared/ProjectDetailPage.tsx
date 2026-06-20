import { ArrowLeft, MapPin, Package, Shapes, UserRound, UsersRound } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { Button } from '@/components/ui/button'
import { useProject } from '@/hooks/useProjects'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type { ProjectProductSummary } from '@/types/project'
import type { RequestStatus } from '@/types/request'

interface ProjectDetailPageProps {
  backPath: string
}

const projectDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const requestStatusLabels: Record<RequestStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PICKED_UP: 'Picked up',
  COMPLETED: 'Completed',
  CANCELED: 'Canceled',
}

const requestStatusStyles: Record<RequestStatus, string> = {
  PENDING: 'border-warning/30 bg-warning/10 text-warning',
  APPROVED: 'border-brand-100 bg-brand-50 text-brand-700',
  REJECTED: 'border-error/30 bg-error/10 text-error',
  PICKED_UP: 'border-info/30 bg-info/10 text-info',
  COMPLETED: 'border-border bg-surface text-text-secondary',
  CANCELED: 'border-border bg-surface text-text-secondary',
}

function formatProjectDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }

  return projectDateFormatter.format(date)
}

function RequestStatusBadge({ status }: { status: RequestStatus | null }) {
  if (!status) {
    return <span className="text-sm text-text-muted">No current request</span>
  }

  return (
    <span className={cn('inline-flex rounded-md border px-2 py-0.5 text-xs font-medium', requestStatusStyles[status])}>
      {requestStatusLabels[status]}
    </span>
  )
}

export function ProjectDetailPage({ backPath }: ProjectDetailPageProps) {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const projectQuery = useProject(id)

  const productColumns = useMemo<Array<ColumnDef<ProjectProductSummary>>>(
    () => [
      {
        accessorKey: 'productName',
        header: 'Product',
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-text-muted">
              <Package className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-text-primary">{row.original.productName}</p>
              <p className="text-xs text-text-muted">SKU {row.original.sku}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'requestedQuantity',
        header: 'Requested',
        cell: ({ row }) => <span className="text-sm tabular-nums text-text-primary">{row.original.requestedQuantity}</span>,
      },
      {
        id: 'stock',
        header: 'Stock',
        cell: ({ row }) => (
          <div className="space-y-0.5 text-sm tabular-nums">
            <p className="font-medium text-text-primary">{row.original.currentAvailableQuantity} available</p>
            <p className="text-xs text-text-muted">
              {row.original.currentStockQuantity} total / {row.original.currentReservedQuantity} reserved
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'currentRequestStatus',
        header: 'Request status',
        cell: ({ row }) => <RequestStatusBadge status={row.original.currentRequestStatus} />,
      },
      {
        accessorKey: 'currentRequesterName',
        header: 'Requester',
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="text-sm font-medium text-text-primary">{row.original.currentRequesterName ?? 'Unassigned'}</p>
            {row.original.isDuplicated ? (
              <span className="inline-flex rounded-md border border-warning/30 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                Duplicate requester demand
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: 'requesterBreakdown',
        header: 'Breakdown',
        cell: ({ row }) => {
          if (row.original.requesterBreakdown.length === 0) {
            return <span className="text-sm text-text-muted">No breakdown</span>
          }

          return (
            <div className="space-y-1">
              {row.original.requesterBreakdown.slice(0, 2).map((requester) => (
                <p key={requester.requesterId} className="text-xs text-text-secondary">
                  {requester.requesterName}: {requester.requestedQuantity} qty / {requester.requestCount} req
                </p>
              ))}
              {row.original.requesterBreakdown.length > 2 ? (
                <p className="text-xs text-text-muted">+{row.original.requesterBreakdown.length - 2} more</p>
              ) : null}
            </div>
          )
        },
      },
    ],
    [],
  )

  if (projectQuery.isLoading) {
    return <PageSkeleton />
  }

  if (projectQuery.isError) {
    return <EmptyState title="Unable to load project" description={getErrorMessage(projectQuery.error, { context: 'load' })} />
  }

  const projectData = projectQuery.data
  if (!projectData) {
    return <EmptyState title="Project not found" description="The selected project could not be loaded." />
  }

  const { project, stockDetails } = projectData
  const assignedUsers = project.assignments.map((assignment) => assignment.user)

  return (
    <section className="space-y-6">
      <PageHeader
        title="Project Detail"
        subtitle={project.name}
        action={
          <Button type="button" variant="secondary" onClick={() => navigate(backPath)}>
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Status</p>
          <p className="mt-2 text-xl font-semibold text-text-primary">{project.isActive ? 'Active' : 'Inactive'}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Total requests</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{stockDetails.totalRequestCount}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Unique products</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{stockDetails.totalUniqueProducts}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-text-secondary">Requested quantity</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{stockDetails.totalRequestedQuantity}</p>
        </article>
      </section>

      <section className="rounded-xl border border-border bg-surface-raised p-5">
        <h2 className="text-lg font-semibold text-text-primary">Project information</h2>
        <dl className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <dt className="text-sm text-text-secondary">Name</dt>
            <dd className="text-sm font-medium text-text-primary">{project.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-text-secondary">Client</dt>
            <dd className="text-sm font-medium text-text-primary">{project.client ?? 'No client provided'}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-sm text-text-secondary">
              <MapPin className="size-3.5" />
              Location
            </dt>
            <dd className="text-sm font-medium text-text-primary">{project.location ?? 'No location provided'}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-sm text-text-secondary">
              <Shapes className="size-3.5" />
              Project type
            </dt>
            <dd className="text-sm font-medium text-text-primary">{project.projectType ?? 'No project type provided'}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-sm text-text-secondary">
              <UserRound className="size-3.5" />
              Created by
            </dt>
            <dd className="text-sm font-medium text-text-primary">{project.createdBy?.name ?? 'Unknown creator'}</dd>
          </div>
          <div>
            <dt className="text-sm text-text-secondary">Created</dt>
            <dd className="text-sm font-medium tabular-nums text-text-primary">{formatProjectDate(project.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-sm text-text-secondary">Updated</dt>
            <dd className="text-sm font-medium tabular-nums text-text-primary">{formatProjectDate(project.updatedAt)}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-sm text-text-secondary">Description</dt>
            <dd className="text-sm text-text-primary">{project.description ?? 'No description provided.'}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="mb-2 flex items-center gap-1.5 text-sm text-text-secondary">
              <UsersRound className="size-3.5" />
              Assigned users
            </dt>
            {assignedUsers.length > 0 ? (
              <dd className="flex flex-wrap gap-2">
                {assignedUsers.map((user) => (
                  <span
                    key={user.id}
                    className="inline-flex rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-text-secondary"
                  >
                    {user.name} / {user.role.replace('_', ' ')}
                  </span>
                ))}
              </dd>
            ) : (
              <dd className="text-sm text-text-muted">No assigned users.</dd>
            )}
          </div>
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-text-primary">Product stock summary</h2>
        <DataTable
          data={stockDetails.products}
          columns={productColumns}
          getRowId={(product) => product.productId}
          emptyTitle="No product usage found"
          emptyDescription="Products linked to this project's requests will appear here."
        />
      </section>
    </section>
  )
}

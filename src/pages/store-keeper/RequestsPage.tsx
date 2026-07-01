import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { Check, CheckCircle2, Eye, Filter, PackageCheck, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useApproveRequest, useCompleteRequest, usePickupRequest, useRejectRequest, useRequests } from '@/hooks/useRequests'
import { getErrorMessage } from '@/lib/errors'
import type { InternalRequest, RequestStatus } from '@/types/request'

const requestStatusFilters: Array<{ label: string; value: 'ALL' | RequestStatus }> = [
  { label: 'All statuses', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Picked up', value: 'PICKED_UP' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Canceled', value: 'CANCELED' },
]

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function StoreKeeperRequestsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'ALL' | RequestStatus>('ALL')
  const [rejectCommentsByRequestId, setRejectCommentsByRequestId] = useState<Record<string, string>>({})

  const sortingState: SortingState = useMemo(() => [{ id: 'createdAt', desc: true }], [])
  const handleSortingChange = useCallback(() => {}, [])

  const requestsParams = useMemo(
    () => ({
      status: status === 'ALL' ? undefined : status,
    }),
    [status],
  )

  const requestsQuery = useRequests(requestsParams)

  const approveRequestMutation = useApproveRequest()
  const rejectRequestMutation = useRejectRequest()
  const pickupRequestMutation = usePickupRequest()
  const completeRequestMutation = useCompleteRequest()

  const requests = requestsQuery.data ?? []
  const hasActiveFilters = status !== 'ALL'

  const handleApprove = useCallback(async (request: InternalRequest) => {
    try {
      await approveRequestMutation.mutateAsync({
        id: request.id,
        payload: {},
      })
      toast.success('Request approved')
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'approve' }))
      throw error
    }
  }, [approveRequestMutation])

  const handleReject = useCallback(async (request: InternalRequest, comment: string) => {
    const trimmedComment = comment.trim()
    if (trimmedComment.length < 10) {
      toast.error('Rejection comment must be at least 10 characters.')
      throw new Error('Invalid rejection comment')
    }

    try {
      await rejectRequestMutation.mutateAsync({
        id: request.id,
        payload: { comment: trimmedComment },
      })
      toast.success('Request rejected')
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'reject' }))
      throw error
    }
  }, [rejectRequestMutation])

  const handlePickup = useCallback(async (request: InternalRequest) => {
    try {
      await pickupRequestMutation.mutateAsync({
        id: request.id,
        payload: {},
      })
      toast.success('Pickup confirmed')
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'update' }))
      throw error
    }
  }, [pickupRequestMutation])

  const handleComplete = useCallback(async (request: InternalRequest) => {
    try {
      await completeRequestMutation.mutateAsync({
        id: request.id,
        payload: {},
      })
      toast.success('Request completed')
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'update' }))
      throw error
    }
  }, [completeRequestMutation])

  const columns = useMemo<Array<ColumnDef<InternalRequest>>>(
    () => [
      {
        accessorKey: 'project.name',
        header: 'Project',
        cell: ({ row }) => {
          const request = row.original

          return (
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text-muted">
                <PackageCheck className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-text-primary">{request.project.name}</p>
                <p className="text-xs tabular-nums text-text-muted">Request {request.id.slice(0, 8)}</p>
              </div>
            </div>
          )
        },
      },
      {
        id: 'items',
        header: 'Items',
        cell: ({ row }) => {
          const summary = row.original.summary
          const itemCount = summary?.itemCount ?? row.original.items.length

          return (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium tabular-nums text-text-secondary">
                {itemCount} items / {summary?.totalRequestedQuantity ?? row.original.items.reduce((t, i) => t + i.quantity, 0)} req
              </span>
              {summary?.totalApprovedQuantity != null ? (
                <span className="inline-flex rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium tabular-nums text-brand-700">
                  {summary.totalApprovedQuantity} appr
                </span>
              ) : null}
              {summary?.totalFulfilledQuantity != null ? (
                <span className="inline-flex rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium tabular-nums text-brand-700">
                  {summary.totalFulfilledQuantity} picked
                </span>
              ) : null}
              {summary?.hasItemIssues ? (
                <span className="inline-flex rounded-md border border-warning bg-pending-bg px-2 py-0.5 text-xs font-medium text-pending-text">
                  Issues
                </span>
              ) : null}
              {summary?.hasInsufficientStock ? (
                <span className="inline-flex rounded-md border border-warning bg-pending-bg px-2 py-0.5 text-xs font-medium text-pending-text">
                  Stock warning
                </span>
              ) : null}
            </div>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'requester',
        header: 'Requester',
        cell: ({ row }) => {
          const requester = row.original.requester
          const requesterName = requester.name

          return (
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-xs font-semibold text-text-secondary">
                {getInitials(requesterName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">{requesterName}</p>
                <p className="truncate text-xs text-text-muted">Requester ID {requester.id.slice(0, 8)}</p>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Submitted',
        cell: ({ row }) => <span className="text-sm tabular-nums text-text-secondary">{formatDate(row.original.createdAt)}</span>,
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const request = row.original
          const rejectComment = rejectCommentsByRequestId[request.id] ?? ''

          return (
            <div className="flex justify-end gap-1.5" onClick={(event) => event.stopPropagation()}>
              {request.status === 'PENDING' ? (
                <>
                  <ConfirmDialog
                    title="Approve request"
                    description="Approve this request and move it to approved status?"
                    confirmLabel="Approve"
                    isLoading={approveRequestMutation.isPending}
                    onConfirm={() => handleApprove(request)}
                    trigger={
                      <Button type="button" size="icon" className="size-8" disabled={approveRequestMutation.isPending} aria-label="Approve request">
                        <Check className="size-4" />
                      </Button>
                    }
                  />
                  <ConfirmDialog
                    title="Reject request"
                    description="Reject this request? A comment with at least 10 characters is required."
                    confirmLabel="Reject"
                    variant="destructive"
                    isLoading={rejectRequestMutation.isPending}
                    onConfirm={() => handleReject(request, rejectComment)}
                    trigger={
                      <Button type="button" size="icon" variant="destructive" className="size-8" disabled={rejectRequestMutation.isPending} aria-label="Reject request">
                        <X className="size-4" />
                      </Button>
                    }
                  >
                    <Input
                      value={rejectComment}
                      onChange={(event) => {
                        setRejectCommentsByRequestId((prev) => ({
                          ...prev,
                          [request.id]: event.target.value,
                        }))
                      }}
                      placeholder="Reason for rejection (min 10 characters)"
                    />
                  </ConfirmDialog>
                </>
              ) : null}

              {request.status === 'APPROVED' ? (
                <ConfirmDialog
                  title="Confirm pickup"
                  description="This will fulfill the currently approved quantities. To change items, open the request detail and edit approved items first."
                  confirmLabel="Confirm Pickup"
                  isLoading={pickupRequestMutation.isPending}
                  onConfirm={() => handlePickup(request)}
                  trigger={
                    <Button type="button" size="sm" disabled={pickupRequestMutation.isPending}>
                      Confirm Pickup
                    </Button>
                  }
                />
              ) : null}

              {request.status === 'PICKED_UP' ? (
                <ConfirmDialog
                  title="Mark complete"
                  description="Mark this request as completed?"
                  confirmLabel="Mark Complete"
                  isLoading={completeRequestMutation.isPending}
                  onConfirm={() => handleComplete(request)}
                  trigger={
                    <Button type="button" size="icon" className="size-8" disabled={completeRequestMutation.isPending} aria-label="Complete request">
                      <CheckCircle2 className="size-4" />
                    </Button>
                  }
                />
              ) : null}

              <Button type="button" size="icon" variant="secondary" className="size-8" onClick={() => navigate(`/store-keeper/requests/${request.id}`)} aria-label="View request details">
                <Eye className="size-4" />
              </Button>
            </div>
          )
        },
      },
    ],
    [
      approveRequestMutation.isPending,
      completeRequestMutation.isPending,
      handleApprove,
      handleComplete,
      handlePickup,
      handleReject,
      navigate,
      pickupRequestMutation.isPending,
      rejectCommentsByRequestId,
      rejectRequestMutation.isPending,
    ],
  )

  return (
    <section className="space-y-6">
      <PageHeader title="Request Queue" subtitle="Review requests and move them through the lifecycle" />

      <DataTable
        data={requests}
        columns={columns}
        title="Requests"
        description="Scan request records by project, requester, status, and submitted date."
        resultsLabel="requests"
        enableSearch={false}
        getRowId={(request) => request.id}
        onRowClick={(request) => navigate(`/store-keeper/requests/${request.id}`)}
        sorting={sortingState}
        onSortingChange={handleSortingChange}
        filters={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="secondary" size="sm" className="relative h-9">
                <Filter className="size-4" />
                Filter
                {hasActiveFilters ? <span className="absolute -right-1 -top-1 size-2 rounded-full bg-brand-600" /> : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              {requestStatusFilters.map((filter) => (
                <DropdownMenuCheckboxItem key={filter.value} checked={status === filter.value} onCheckedChange={() => setStatus(filter.value)}>
                  {filter.label}
                </DropdownMenuCheckboxItem>
              ))}
              {hasActiveFilters ? (
                <>
                  <DropdownMenuSeparator />
                  <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={() => setStatus('ALL')}>
                    Clear filters
                  </Button>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        }
        isLoading={requestsQuery.isLoading}
        hasError={requestsQuery.isError}
        errorTitle="Unable to load requests"
        errorDescription={getErrorMessage(requestsQuery.error, { context: 'load' })}
        emptyTitle="No requests found"
        emptyDescription="No requests match the selected status."
      />
    </section>
  )
}

import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Check, CheckCircle2, Eye, Filter, PackageCheck, X } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAdminRequestQueue, useBulkUpdateRequestStatus } from '@/hooks/useAdmin'
import { useApproveRequest, useCompleteRequest, usePickupRequest, useRejectRequest } from '@/hooks/useRequests'
import { useProjects } from '@/hooks/useProjects'
import { useUsers } from '@/hooks/useUsers'
import { getErrorMessage } from '@/lib/errors'
import type { BulkRequestStatusPayload, BulkRequestStatusResultItem } from '@/types/admin'
import type { InternalRequest, RequestStatus } from '@/types/request'

const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50]

const requestDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const queueStatusOptions: Array<{ label: string; value: 'ALL' | RequestStatus }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Picked up', value: 'PICKED_UP' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Canceled', value: 'CANCELED' },
]

const bulkStatusOptions: Array<{ label: string; value: BulkRequestStatusPayload['status'] }> = [
  { label: 'Approve', value: 'APPROVED' },
  { label: 'Reject', value: 'REJECTED' },
  { label: 'Pickup', value: 'PICKED_UP' },
  { label: 'Complete', value: 'COMPLETED' },
]

function formatRequestDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }

  return requestDateFormatter.format(date)
}

function getRequesterInitials(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return initials || 'E'
}

function formatBulkFailureDescription(results: BulkRequestStatusResultItem[]) {
  const failedResults = results.filter((result) => !result.success)

  if (failedResults.length === 0) {
    return undefined
  }

  const shownFailures = failedResults.slice(0, 3).map((result) => {
    const message = result.error ?? result.code ?? 'Update failed'
    return `Request ${result.requestId.slice(0, 8)}: ${message}`
  })
  const remainingCount = failedResults.length - shownFailures.length

  return remainingCount > 0 ? `${shownFailures.join(' • ')} • +${remainingCount} more` : shownFailures.join(' • ')
}

export function AdminRequestsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'ALL' | RequestStatus>('ALL')
  const [projectId, setProjectId] = useState('')
  const [requesterId, setRequesterId] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState<BulkRequestStatusPayload['status']>('APPROVED')
  const [bulkComment, setBulkComment] = useState('')
  const [rejectCommentsByRequestId, setRejectCommentsByRequestId] = useState<Record<string, string>>({})

  const sortingState: SortingState = useMemo(() => [{ id: 'createdAt', desc: true }], [])
  const handleSortingChange = useCallback(() => {}, [])

  const queueParams = useMemo(
    () => ({
      status: status === 'ALL' ? undefined : status,
      projectId: projectId || undefined,
      requesterId: requesterId || undefined,
      page,
      limit: pageSize,
    }),
    [status, projectId, requesterId, page, pageSize],
  )

  const queueQuery = useAdminRequestQueue(queueParams)
  const projectsQuery = useProjects()
  const usersQuery = useUsers({ role: 'EMPLOYEE' })
  const bulkMutation = useBulkUpdateRequestStatus()
  const approveRequestMutation = useApproveRequest()
  const rejectRequestMutation = useRejectRequest()
  const pickupRequestMutation = usePickupRequest()
  const completeRequestMutation = useCompleteRequest()

  const queueItems = queueQuery.data?.data ?? []
  const pagination = queueQuery.data?.pagination
  const allOnPageSelected = queueItems.length > 0 && queueItems.every((request) => selectedRequestIds.includes(request.id))
  const someOnPageSelected = queueItems.some((request) => selectedRequestIds.includes(request.id))
  const hasActiveFilters = status !== 'ALL' || projectId !== '' || requesterId !== ''

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

  const toggleAllOnPage = (checked: boolean) => {
    if (checked) {
      setSelectedRequestIds(queueItems.map((request) => request.id))
      return
    }

    setSelectedRequestIds([])
  }

  const toggleSelectedRequest = (requestId: string, checked: boolean) => {
    setSelectedRequestIds((prev) => {
      if (checked) {
        return prev.includes(requestId) ? prev : [...prev, requestId]
      }

      return prev.filter((id) => id !== requestId)
    })
  }

  const clearFilters = () => {
    setStatus('ALL')
    setProjectId('')
    setRequesterId('')
    setPage(1)
    setSelectedRequestIds([])
  }

  const columns: Array<ColumnDef<InternalRequest>> = [
    {
      id: 'select',
      header: () => (
        <Checkbox
          aria-label="Select all requests on page"
          checked={allOnPageSelected || (someOnPageSelected && 'indeterminate')}
          onCheckedChange={(value) => toggleAllOnPage(Boolean(value))}
        />
      ),
      cell: ({ row }) => {
        const isSelected = selectedRequestIds.includes(row.original.id)

        return (
          <Checkbox
            aria-label={`Select request ${row.original.id}`}
            checked={isSelected}
            onCheckedChange={(value) => toggleSelectedRequest(row.original.id, Boolean(value))}
            onClick={(event) => event.stopPropagation()}
          />
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
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
      cell: ({ row }) => <StatusBadge status={row.original.status as RequestStatus} />,
    },
    {
      id: 'requester',
      header: 'Requester',
      cell: ({ row }) => {
        const requesterName = row.original.requester.name

        return (
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-xs font-semibold text-text-secondary">
              {getRequesterInitials(requesterName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">{requesterName}</p>
              <p className="truncate text-xs text-text-muted">Requester ID {row.original.requester.id.slice(0, 8)}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Submitted',
      cell: ({ row }) => <span className="text-sm tabular-nums text-text-secondary">{formatRequestDate(row.original.createdAt)}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const request = row.original

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
                  onConfirm={() => handleReject(request, rejectCommentsByRequestId[request.id] ?? '')}
                  trigger={
                    <Button type="button" size="icon" variant="destructive" className="size-8" disabled={rejectRequestMutation.isPending} aria-label="Reject request">
                      <X className="size-4" />
                    </Button>
                  }
                >
                  <Input
                    value={rejectCommentsByRequestId[request.id] ?? ''}
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
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="size-8"
              aria-label="View request details"
              onClick={() => navigate(`/admin/requests/${request.id}`)}
            >
              <Eye className="size-4" />
            </Button>
          </div>
        )
      },
      enableSorting: false,
    },
  ]

  const handleBulkUpdate = async () => {
    if (selectedRequestIds.length === 0) {
      toast.error('Select at least one request.')
      throw new Error('No requests selected')
    }

    if (bulkStatus === 'REJECTED' && bulkComment.trim().length < 10) {
      toast.error('Rejection comment must be at least 10 characters.')
      throw new Error('Invalid rejection comment')
    }

    try {
      const result = await bulkMutation.mutateAsync({
        requestIds: selectedRequestIds,
        status: bulkStatus,
        comment: bulkComment.trim() || undefined,
      })

      if (result.failureCount > 0) {
        toast.warning(`Updated ${result.successCount}/${result.total} requests. Some updates failed.`, {
          description: formatBulkFailureDescription(result.results),
        })
      } else {
        toast.success(`Updated ${result.successCount} requests.`)
      }

      setSelectedRequestIds([])
      setBulkComment('')
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'update' }))
      throw error
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Request Queue" subtitle="Review requests and move them through the lifecycle" />

      <div className="flex flex-wrap gap-2">
        {queueStatusOptions.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={status === option.value ? 'default' : 'secondary'}
            size="sm"
            onClick={() => {
              setStatus(option.value)
              setPage(1)
              setSelectedRequestIds([])
            }}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <DataTable
        data={queueItems}
        columns={columns}
        title="Requests"
        description="Scan request records by project, requester, status, and submitted date."
        resultsLabel="requests"
        enableSearch={false}
        initialPageSize={DEFAULT_PAGE_SIZE}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        manualPagination
        pageIndex={Math.max(0, page - 1)}
        pageSize={pageSize}
        pageCount={pagination?.totalPages ?? 1}
        totalResults={pagination?.total ?? queueItems.length}
        onPageChange={(nextPageIndex) => {
          setSelectedRequestIds([])
          setPage(nextPageIndex + 1)
        }}
        onPageSizeChange={(nextPageSize) => {
          setSelectedRequestIds([])
          setPage(1)
          setPageSize(nextPageSize)
        }}
        getRowId={(request) => request.id}
        onRowClick={(request) => navigate(`/admin/requests/${request.id}`)}
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
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>Project</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={projectId === ''}
                onCheckedChange={() => {
                  setProjectId('')
                  setPage(1)
                  setSelectedRequestIds([])
                }}
              >
                All projects
              </DropdownMenuCheckboxItem>
              {(projectsQuery.data ?? []).filter((project) => project.isActive).map((project) => (
                <DropdownMenuCheckboxItem
                  key={project.id}
                  checked={projectId === project.id}
                  onCheckedChange={() => {
                    setProjectId(project.id)
                    setPage(1)
                    setSelectedRequestIds([])
                  }}
                >
                  {project.name}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Requester</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={requesterId === ''}
                onCheckedChange={() => {
                  setRequesterId('')
                  setPage(1)
                  setSelectedRequestIds([])
                }}
              >
                All requesters
              </DropdownMenuCheckboxItem>
              {(usersQuery.data ?? []).map((user) => (
                <DropdownMenuCheckboxItem
                  key={user.id}
                  checked={requesterId === user.id}
                  onCheckedChange={() => {
                    setRequesterId(user.id)
                    setPage(1)
                    setSelectedRequestIds([])
                  }}
                >
                  {user.name}
                </DropdownMenuCheckboxItem>
              ))}
              {hasActiveFilters ? (
                <>
                  <DropdownMenuSeparator />
                  <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        }
        actions={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Select
              value={bulkStatus}
              onValueChange={(value: BulkRequestStatusPayload['status']) => {
                setBulkStatus(value)
              }}
            >
              <SelectTrigger className="h-9 w-full sm:w-[140px]">
                <SelectValue placeholder="Bulk status" />
              </SelectTrigger>
              <SelectContent>
                {bulkStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={bulkComment}
              onChange={(event) => setBulkComment(event.target.value)}
              placeholder="Bulk comment"
              className="h-9 w-full bg-surface shadow-none sm:w-[260px]"
            />

            <ConfirmDialog
              title="Apply bulk status update"
              description={`Update ${selectedRequestIds.length} selected requests to ${bulkStatus.replace('_', ' ')}?`}
              confirmLabel="Apply update"
              variant={bulkStatus === 'REJECTED' ? 'destructive' : 'default'}
              isLoading={bulkMutation.isPending}
              onConfirm={handleBulkUpdate}
              trigger={
                <Button type="button" className="h-9" disabled={selectedRequestIds.length === 0 || bulkMutation.isPending}>
                  Apply to {selectedRequestIds.length}
                </Button>
              }
            />
          </div>
        }
        isLoading={queueQuery.isLoading}
        hasError={queueQuery.isError}
        errorTitle="Unable to load requests"
        errorDescription={getErrorMessage(queueQuery.error, { context: 'load' })}
        emptyTitle="No requests found"
        emptyDescription="No requests match the selected filters."
      />
    </section>
  )
}

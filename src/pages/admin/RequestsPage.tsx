import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAdminRequestQueue, useBulkUpdateRequestStatus } from '@/hooks/useAdmin'
import { useProjects } from '@/hooks/useProjects'
import { useUsers } from '@/hooks/useUsers'
import { getErrorMessage } from '@/lib/errors'
import type { BulkRequestStatusPayload } from '@/types/admin'
import type { RequestStatus } from '@/types/request'

const DEFAULT_LIMIT = 20

const queueStatusOptions: Array<{ label: string; value: 'ALL' | 'PENDING' | 'APPROVED' | 'PICKED_UP' }> = [
  { label: 'All statuses', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Picked up', value: 'PICKED_UP' },
]

const bulkStatusOptions: Array<{ label: string; value: BulkRequestStatusPayload['status'] }> = [
  { label: 'Approve', value: 'APPROVED' },
  { label: 'Reject', value: 'REJECTED' },
  { label: 'Complete', value: 'COMPLETED' },
]

export function AdminRequestsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'PICKED_UP'>('ALL')
  const [projectId, setProjectId] = useState('')
  const [requesterId, setRequesterId] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState<BulkRequestStatusPayload['status']>('APPROVED')
  const [bulkComment, setBulkComment] = useState('')

  const queueParams = useMemo(
    () => ({
      status: status === 'ALL' ? undefined : status,
      projectId: projectId || undefined,
      requesterId: requesterId || undefined,
      page,
      limit: DEFAULT_LIMIT,
    }),
    [status, projectId, requesterId, page],
  )

  const queueQuery = useAdminRequestQueue(queueParams)
  const projectsQuery = useProjects()
  const usersQuery = useUsers({ role: 'EMPLOYEE' })
  const bulkMutation = useBulkUpdateRequestStatus()

  const queueItems = queueQuery.data?.data ?? []
  const pagination = queueQuery.data?.pagination
  const allOnPageSelected = queueItems.length > 0 && queueItems.every((request) => selectedRequestIds.includes(request.id))
  const isNextDisabled = !pagination || pagination.page >= pagination.totalPages

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
        toast.warning(`Updated ${result.successCount}/${result.total} requests. Some updates failed.`)
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

  if (queueQuery.isLoading) {
    return <PageSkeleton />
  }

  if (queueQuery.isError) {
    return (
      <section className="space-y-6">
        <PageHeader title="Request Queue" subtitle="Review pending operational requests and apply bulk actions" />
        <EmptyState title="Unable to load request queue" description={getErrorMessage(queueQuery.error, { context: 'load' })} />
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Request Queue" subtitle="Review pending operational requests and apply bulk actions" />

      <section className="grid gap-3 rounded-xl border border-border bg-surface-raised p-4 md:grid-cols-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Status</p>
          <Select
            value={status}
            onValueChange={(value: 'ALL' | 'PENDING' | 'APPROVED' | 'PICKED_UP') => {
              setStatus(value)
              setPage(1)
              setSelectedRequestIds([])
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {queueStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Project</p>
          <Select
            value={projectId || 'ALL'}
            onValueChange={(value) => {
              setProjectId(value === 'ALL' ? '' : value)
              setPage(1)
              setSelectedRequestIds([])
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All projects</SelectItem>
              {(projectsQuery.data ?? []).filter((project) => project.isActive).map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Requester</p>
          <Select
            value={requesterId || 'ALL'}
            onValueChange={(value) => {
              setRequesterId(value === 'ALL' ? '' : value)
              setPage(1)
              setSelectedRequestIds([])
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All requesters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All requesters</SelectItem>
              {(usersQuery.data ?? []).map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Queue size</p>
          <p className="h-9 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary">
            {pagination?.total ?? 0} requests
          </p>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Select
            value={bulkStatus}
            onValueChange={(value: BulkRequestStatusPayload['status']) => {
              setBulkStatus(value)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select bulk status" />
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
            placeholder="Optional comment (required for reject, min 10 characters)"
          />

          <ConfirmDialog
            title="Apply bulk status update"
            description={`Update ${selectedRequestIds.length} selected requests to ${bulkStatus.replace('_', ' ')}?`}
            confirmLabel="Apply update"
            variant={bulkStatus === 'REJECTED' ? 'destructive' : 'default'}
            isLoading={bulkMutation.isPending}
            onConfirm={handleBulkUpdate}
            trigger={
              <Button type="button" disabled={selectedRequestIds.length === 0 || bulkMutation.isPending}>
                Apply to {selectedRequestIds.length} requests
              </Button>
            }
          />
        </div>
      </section>

      {queueItems.length === 0 ? (
        <EmptyState title="No queue requests" description="No requests match the selected filters." />
      ) : (
        <section className="rounded-xl border border-border bg-surface-raised">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    aria-label="Select all requests on page"
                    checked={allOnPageSelected}
                    onChange={(event) => toggleAllOnPage(event.target.checked)}
                  />
                </TableHead>
                <TableHead>Request</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queueItems.map((request) => {
                const isSelected = selectedRequestIds.includes(request.id)

                return (
                  <TableRow key={request.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        aria-label={`Select request ${request.id}`}
                        checked={isSelected}
                        onChange={(event) => toggleSelectedRequest(request.id, event.target.checked)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{request.id}</TableCell>
                    <TableCell>{request.requester?.name ?? 'Employee'}</TableCell>
                    <TableCell>{request.project.name}</TableCell>
                    <TableCell>{request.items.length}</TableCell>
                    <TableCell>
                      <StatusBadge status={request.status as RequestStatus} />
                    </TableCell>
                    <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" size="sm" variant="secondary" onClick={() => navigate(`/admin/requests?requestId=${request.id}`)}>
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </section>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => {
            setSelectedRequestIds([])
            setPage((prev) => Math.max(1, prev - 1))
          }}
        >
          Previous
        </Button>
        <p className="text-sm text-text-secondary">Page {pagination?.page ?? 1} of {pagination?.totalPages ?? 1}</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isNextDisabled}
          onClick={() => {
            setSelectedRequestIds([])
            setPage((prev) => prev + 1)
          }}
        >
          Next
        </Button>
      </div>
    </section>
  )
}

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
]

export function StoreKeeperRequestsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'ALL' | RequestStatus>('ALL')
  const [rejectCommentsByRequestId, setRejectCommentsByRequestId] = useState<Record<string, string>>({})

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

  const handleApprove = async (request: InternalRequest) => {
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
  }

  const handleReject = async (request: InternalRequest, comment: string) => {
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
  }

  const handlePickup = async (request: InternalRequest) => {
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
  }

  const handleComplete = async (request: InternalRequest) => {
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
  }

  if (requestsQuery.isLoading) {
    return <PageSkeleton />
  }

  if (requestsQuery.isError) {
    return (
      <section className="space-y-6">
        <PageHeader title="Request Queue" subtitle="Review requests and move them through the lifecycle" />
        <EmptyState title="Unable to load requests" description={getErrorMessage(requestsQuery.error, { context: 'load' })} />
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Request Queue" subtitle="Review requests and move them through the lifecycle" />

      <section className="rounded-xl border border-border bg-surface-raised p-4">
        <div className="space-y-1 md:max-w-xs">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Status</p>
          <Select value={status} onValueChange={(value: 'ALL' | RequestStatus) => setStatus(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {requestStatusFilters.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {requests.length === 0 ? (
        <EmptyState title="No requests found" description="No requests match the selected status." />
      ) : (
        <section className="rounded-xl border border-border bg-surface-raised">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requester</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => {
                const rejectComment = rejectCommentsByRequestId[request.id] ?? ''

                return (
                  <TableRow key={request.id} onClick={() => navigate(`/store-keeper/requests/${request.id}`)} className="cursor-pointer">
                    <TableCell>{request.requester?.name ?? 'Employee'}</TableCell>
                    <TableCell>{request.project.name}</TableCell>
                    <TableCell>{request.items.length}</TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                        {request.status === 'PENDING' ? (
                          <>
                            <ConfirmDialog
                              title="Approve request"
                              description="Approve this request and move it to approved status?"
                              confirmLabel="Approve"
                              isLoading={approveRequestMutation.isPending}
                              onConfirm={() => handleApprove(request)}
                              trigger={
                                <Button type="button" size="sm" disabled={approveRequestMutation.isPending}>
                                  Approve
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
                                <Button type="button" size="sm" variant="destructive" disabled={rejectRequestMutation.isPending}>
                                  Reject
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
                            description="Mark this request as picked up?"
                            confirmLabel="Confirm Pickup"
                            isLoading={pickupRequestMutation.isPending}
                            onConfirm={() => handlePickup(request)}
                            trigger={
                              <Button type="button" size="sm" disabled={pickupRequestMutation.isPending}>
                                Pickup
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
                              <Button type="button" size="sm" disabled={completeRequestMutation.isPending}>
                                Complete
                              </Button>
                            }
                          />
                        ) : null}

                        <Button type="button" size="sm" variant="secondary" onClick={() => navigate(`/store-keeper/requests/${request.id}`)}>
                          View details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </section>
      )}
    </section>
  )
}

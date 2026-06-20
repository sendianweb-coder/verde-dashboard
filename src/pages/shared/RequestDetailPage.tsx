import { ArrowLeft, Boxes, CalendarClock, ClipboardList, Package, Printer, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useApproveRequest,
  useCompleteRequest,
  usePickupRequest,
  useRejectRequest,
  useRequest,
} from '@/hooks/useRequests'
import { getErrorMessage } from '@/lib/errors'
import type { InternalRequestItem } from '@/types/request'

interface RequestDetailPageProps {
  backToPath: string
}

const detailDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const detailDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

function formatRequestDate(value: string) {
  return detailDateFormatter.format(new Date(value))
}

function formatRequestDateTime(value: string) {
  return detailDateTimeFormatter.format(new Date(value))
}

function ProductMarker({ item }: { item: InternalRequestItem }) {
  return item.product.imageUrl ? (
    <img src={item.product.imageUrl} alt={item.product.name} className="size-10 rounded-lg border border-border bg-surface object-cover" loading="lazy" />
  ) : (
    <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-text-muted">
      <Package className="size-4" />
    </div>
  )
}

export function RequestDetailPage({ backToPath }: RequestDetailPageProps) {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const [comment, setComment] = useState('')

  const requestQuery = useRequest(id)

  const approveRequestMutation = useApproveRequest()
  const rejectRequestMutation = useRejectRequest()
  const pickupRequestMutation = usePickupRequest()
  const completeRequestMutation = useCompleteRequest()

  if (requestQuery.isLoading) {
    return <PageSkeleton />
  }

  if (requestQuery.isError) {
    return <EmptyState title="Unable to load request" description={getErrorMessage(requestQuery.error, { context: 'load' })} />
  }

  const request = requestQuery.data
  if (!request) {
    return <EmptyState title="Request not found" description="The request could not be loaded or no longer exists." />
  }

  const requestHistory = request.history ?? []
  const submittedAt = formatRequestDateTime(request.createdAt)
  const statusLabel = request.status.replace(/_/g, ' ')
  const projectDetails = [request.project.client, request.project.location, request.project.projectType].filter(Boolean).join(' / ')

  const handlePrint = () => {
    const cleanupPrintClass = () => {
      document.body.classList.remove('printing-request')
    }

    document.body.classList.add('printing-request')
    window.addEventListener('afterprint', cleanupPrintClass, { once: true })
    window.print()
  }

  const onApprove = async () => {
    try {
      await approveRequestMutation.mutateAsync({
        id: request.id,
        payload: { comment },
      })
      toast.success('Request approved')
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'approve' }))
    }
  }

  const onReject = async () => {
    try {
      await rejectRequestMutation.mutateAsync({
        id: request.id,
        payload: { comment },
      })
      toast.success('Request rejected')
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'reject' }))
    }
  }

  const onPickup = async () => {
    try {
      await pickupRequestMutation.mutateAsync({
        id: request.id,
        payload: { comment },
      })
      toast.success('Pickup confirmed')
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'update' }))
    }
  }

  const onComplete = async () => {
    try {
      await completeRequestMutation.mutateAsync({
        id: request.id,
        payload: { comment },
      })
      toast.success('Request completed')
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'update' }))
    }
  }

  return (
    <section className="space-y-6">
      <div className="request-screen-content">
        <PageHeader
          title="Request Detail"
          subtitle={`Submitted ${submittedAt}`}
          action={
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                Print Details
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(backToPath)}>
                <ArrowLeft className="h-4 w-4" />
                Back to queue
              </Button>
            </div>
          }
        />
      </div>

      <article id="request-print-content" className="request-print-document" aria-label="Printable request details">
        <header className="request-print-header">
          <h1>Request Details</h1>
          <p>Verde Group Internal Material Request</p>
        </header>

        <section className="request-print-section request-print-summary" aria-label="Request summary">
          <div>
            <span>Request No.</span>
            <strong>{request.id}</strong>
          </div>
          <div>
            <span>Date</span>
            <strong>{submittedAt}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{statusLabel}</strong>
          </div>
          <div>
            <span>Project</span>
            <strong>{request.project.name}</strong>
          </div>
          <div>
            <span>Requester</span>
            <strong>{request.requester.name}</strong>
          </div>
        </section>

        <section className="request-print-section" aria-label="Requested items">
          <h2>Requested Items</h2>
          <table>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Items</th>
                <th scope="col">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {request.items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.product.name}</td>
                  <td>{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="request-print-section request-print-grid-section" aria-label="Request notes and approval timeline">
          <div>
            <h2>Notes</h2>
            <p className="request-print-notes">{request.notes?.trim() || 'No notes provided.'}</p>
          </div>

          <div>
            <h2>Approval Timeline</h2>
            {requestHistory.length === 0 ? (
              <p className="request-print-muted">No approval events yet.</p>
            ) : (
              <div className="request-print-timeline">
                {requestHistory.map((event, index) => (
                  <div key={event.id ?? `${event.createdAt}-${event.action}-${index}`} className="request-print-timeline-event">
                    <p>
                      <strong>{formatRequestDateTime(event.createdAt)}</strong>
                      <span>{event.action.replace(/_/g, ' ')}</span>
                      <span>by {event.actor?.name ?? 'System'}</span>
                    </p>
                    {event.comment ? <p className="request-print-muted">{event.comment}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="request-print-signatures" aria-label="Signatures">
          <div>
            <span>Requester Signature</span>
            <strong />
          </div>
          <div>
            <span>Date</span>
            <strong />
          </div>
          <div>
            <span>Approved By</span>
            <strong />
          </div>
          <div>
            <span>Date</span>
            <strong />
          </div>
        </section>

        <footer className="request-print-footer">
          <span>Generated from Verde Support</span>
          <span>Verde Group - Qatar</span>
        </footer>
      </article>

      <section className="request-screen-content rounded-xl border border-border bg-surface-raised p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="size-4 text-brand-600" />
              <h2 className="text-lg font-semibold text-text-primary">Request summary</h2>
            </div>
            <p className="mt-1 text-sm text-text-secondary">Snapshot of the requester, project, and request status.</p>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <dl className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-border bg-background p-3">
            <dt className="flex items-center gap-1.5 text-sm text-text-secondary">
              <UserRound className="size-3.5" />
              Requester
            </dt>
            <dd className="mt-1 text-sm font-medium text-text-primary">{request.requester.name}</dd>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <dt className="flex items-center gap-1.5 text-sm text-text-secondary">
              <CalendarClock className="size-3.5" />
              Submitted
            </dt>
            <dd className="mt-1 text-sm font-medium tabular-nums text-text-primary">{formatRequestDate(request.createdAt)}</dd>
          </div>
          <div className="rounded-lg border border-border bg-background p-3 md:col-span-2">
            <dt className="text-sm text-text-secondary">Project</dt>
            <dd className="mt-1 text-sm font-medium text-text-primary">{request.project.name}</dd>
            {projectDetails ? <p className="mt-1 text-xs text-text-muted">{projectDetails}</p> : null}
          </div>
        </dl>

        {request.project.description ? <p className="mt-4 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-secondary">{request.project.description}</p> : null}
      </section>

      <section className="request-screen-content rounded-xl border border-border bg-surface-raised p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Requested items</h2>
            <p className="text-sm text-text-secondary">Request-time stock is the source of truth; current stock is shown for context only.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium tabular-nums text-text-secondary">
            <Boxes className="size-3.5" />
            {request.summary?.itemCount ?? request.items.length} items / {request.summary?.totalRequestedQuantity ?? request.items.reduce((total, item) => total + item.quantity, 0)} units
          </span>
        </div>

        <div className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border bg-background">
          {request.items.map((item) => {
            return (
              <article key={item.id} className="grid gap-3 px-3 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="flex min-w-0 gap-3">
                  <ProductMarker item={item} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary">{item.product.name}</p>
                    <p className="text-xs text-text-muted">SKU {item.product.sku || 'N/A'}</p>
                  </div>
                </div>
                <dl className="grid grid-cols-3 gap-2 text-right sm:min-w-[360px]">
                  <div>
                    <dt className="text-xs text-text-muted">Requested</dt>
                    <dd className="text-sm font-medium tabular-nums text-text-primary">{item.quantity}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-text-muted">Available then</dt>
                    <dd className="text-sm font-medium tabular-nums text-text-primary">{item.stockAtRequest.availableQuantity}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-text-muted">Current</dt>
                    <dd className="text-sm font-medium tabular-nums text-text-primary">{item.currentStock.availableQuantity}</dd>
                  </div>
                </dl>
              </article>
            )
          })}
        </div>
      </section>

      <section className="request-screen-content rounded-xl border border-border bg-surface-raised p-5">
        <label htmlFor="action-comment" className="mb-1.5 block text-sm font-medium text-text-primary">
          Action comment
        </label>
        <Input
          id="action-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Optional for approve/pickup/complete. Required for reject."
        />
      </section>

      <section className="request-screen-content flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-raised p-5">
        {request.status === 'PENDING' ? (
          <>
            <ConfirmDialog
              title="Approve request"
              description="Approve this request and reserve stock?"
              confirmLabel="Approve"
              variant="default"
              isLoading={approveRequestMutation.isPending}
              onConfirm={onApprove}
              trigger={<Button>Approve</Button>}
            />

            <ConfirmDialog
              title="Reject request"
              description="Reject this request? A comment with at least 10 characters is required."
              confirmLabel="Reject"
              variant="destructive"
              isLoading={rejectRequestMutation.isPending}
              onConfirm={async () => {
                if (comment.trim().length < 10) {
                  toast.error('Rejection comment must be at least 10 characters.')
                  throw new Error('Invalid rejection comment')
                }

                await onReject()
              }}
              trigger={<Button variant="destructive">Reject</Button>}
            />
          </>
        ) : null}

        {request.status === 'APPROVED' ? (
          <ConfirmDialog
            title="Confirm pickup"
            description="Mark this request as picked up?"
            confirmLabel="Confirm Pickup"
            isLoading={pickupRequestMutation.isPending}
            onConfirm={onPickup}
            trigger={<Button>Confirm Pickup</Button>}
          />
        ) : null}

        {request.status === 'PICKED_UP' ? (
          <ConfirmDialog
            title="Mark complete"
            description="Mark this request as completed?"
            confirmLabel="Mark Complete"
            isLoading={completeRequestMutation.isPending}
            onConfirm={onComplete}
            trigger={<Button>Mark Complete</Button>}
          />
        ) : null}
      </section>

      <section className="request-screen-content rounded-xl border border-border bg-surface-raised p-5">
        <h2 className="text-lg font-semibold text-text-primary">Approval timeline</h2>
        <div className="mt-4 space-y-3">
          {requestHistory.length === 0 ? (
            <p className="text-sm text-text-secondary">No approval events yet.</p>
          ) : (
            requestHistory.map((event, index) => (
              <article key={event.id ?? `${event.createdAt}-${event.action}-${index}`} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-text-primary">
                    {event.actor?.name ?? 'System'} - {event.action.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs tabular-nums text-text-muted">{formatRequestDateTime(event.createdAt)}</p>
                </div>
                {event.comment ? <p className="mt-1 text-sm text-text-secondary">{event.comment}</p> : null}
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  )
}

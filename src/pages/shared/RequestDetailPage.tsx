import { ArrowLeft, Printer } from 'lucide-react'
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
import { useProducts } from '@/hooks/useProducts'
import {
  useApproveRequest,
  useCompleteRequest,
  usePickupRequest,
  useRejectRequest,
  useRequest,
  useRequestHistory,
} from '@/hooks/useRequests'
import { getErrorMessage } from '@/lib/errors'

interface RequestDetailPageProps {
  backToPath: string
}

export function RequestDetailPage({ backToPath }: RequestDetailPageProps) {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const [comment, setComment] = useState('')

  const requestQuery = useRequest(id)
  const requestHistoryQuery = useRequestHistory(id)
  const productsQuery = useProducts()

  const approveRequestMutation = useApproveRequest()
  const rejectRequestMutation = useRejectRequest()
  const pickupRequestMutation = usePickupRequest()
  const completeRequestMutation = useCompleteRequest()

  if (requestQuery.isLoading || requestHistoryQuery.isLoading || productsQuery.isLoading) {
    return <PageSkeleton />
  }

  if (requestQuery.isError || requestHistoryQuery.isError || productsQuery.isError) {
    return <EmptyState title="Unable to load request" description={getErrorMessage(requestQuery.error ?? requestHistoryQuery.error ?? productsQuery.error, { context: 'load' })} />
  }

  const request = requestQuery.data
  if (!request) {
    return <EmptyState title="Request not found" description="The request could not be loaded or no longer exists." />
  }

  const requestHistory = requestHistoryQuery.data ?? []
  const submittedAt = new Date(request.createdAt).toLocaleString()
  const statusLabel = request.status.replace(/_/g, ' ')
  const productById = new Map((productsQuery.data ?? []).map((product) => [product.id, product]))
  const hasStockConflict = request.items.some((item) => {
    const product = productById.get(item.productId)
    return item.quantity > (product?.availableQuantity ?? 0)
  })

  const stockConflicts = request.items
    .map((item) => {
      const product = productById.get(item.productId)
      const available = product?.availableQuantity ?? 0

      if (item.quantity <= available) {
        return null
      }

      return {
        productName: product?.name ?? item.productId,
        requested: item.quantity,
        available,
      }
    })
    .filter((conflict): conflict is { productName: string; requested: number; available: number } => conflict !== null)

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
            <strong>{request.requester?.name ?? 'Employee'}</strong>
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
                  <td>{productById.get(item.productId)?.name ?? item.productId}</td>
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
                {requestHistory.map((event) => (
                  <div key={event.id} className="request-print-timeline-event">
                    <p>
                      <strong>{new Date(event.createdAt).toLocaleString()}</strong>
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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary">Requester</p>
            <p className="text-base font-semibold text-text-primary">{request.requester?.name ?? 'Employee'}</p>
          </div>
          <StatusBadge status={request.status} />
        </div>
      </section>

      <section className="request-screen-content rounded-xl border border-border bg-surface-raised p-5">
        <h2 className="text-lg font-semibold text-text-primary">Requested items</h2>
        <div className="mt-4 space-y-2">
          {request.items.map((item) => {
            const product = productById.get(item.productId)
            const availableQuantity = product?.availableQuantity ?? 0
            const isConflict = item.quantity > availableQuantity

            return (
              <article key={item.id} className="rounded-lg border border-border bg-background p-3">
                <div className="grid items-center gap-2 sm:grid-cols-3">
                  <p className="text-sm font-medium text-text-primary">{product?.name ?? item.productId}</p>
                  <p className="text-sm text-text-secondary">Requested: {item.quantity}</p>
                  <p className="text-sm text-text-secondary">Available: {availableQuantity}</p>
                </div>
                {isConflict ? <p className="mt-1 text-xs text-error">Requested quantity exceeds available stock.</p> : null}
              </article>
            )
          })}
        </div>

        {hasStockConflict ? (
          <p className="mt-4 rounded-lg border border-warning bg-pending-bg px-3 py-2 text-sm text-pending-text">
            One or more requested quantities exceed available stock.
          </p>
        ) : null}
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
              description={
                hasStockConflict
                  ? 'This request has stock conflicts. You can still proceed if partial availability is acceptable by process.'
                  : 'Approve this request and reserve stock?'
              }
              confirmLabel="Approve"
              variant={hasStockConflict ? 'warning' : 'default'}
              conflicts={stockConflicts}
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
            requestHistory.map((event) => (
              <article key={event.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-text-primary">
                    {event.actor?.name ?? 'System'} - {event.action.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-text-muted">{new Date(event.createdAt).toLocaleString()}</p>
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

import { ArrowLeft } from 'lucide-react'
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

export function StoreKeeperRequestDetailPage() {
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

  const request = requestQuery.data
  if (!request) {
    return <EmptyState title="Request not found" description="The request could not be loaded or no longer exists." />
  }

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

  const onApprove = async () => {
    await approveRequestMutation.mutateAsync({
      id: request.id,
      payload: { comment },
    })
    toast.success('Request approved')
  }

  const onReject = async () => {
    await rejectRequestMutation.mutateAsync({
      id: request.id,
      payload: { comment },
    })
    toast.success('Request rejected')
  }

  const onPickup = async () => {
    await pickupRequestMutation.mutateAsync({
      id: request.id,
      payload: { comment },
    })
    toast.success('Pickup confirmed')
  }

  const onComplete = async () => {
    await completeRequestMutation.mutateAsync({
      id: request.id,
      payload: { comment },
    })
    toast.success('Request completed')
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Request Detail"
        subtitle={`Submitted ${new Date(request.createdAt).toLocaleString()}`}
        action={
          <Button type="button" variant="secondary" onClick={() => navigate('/store-keeper/requests')}>
            <ArrowLeft className="h-4 w-4" />
            Back to queue
          </Button>
        }
      />

      <section className="rounded-xl border border-border bg-surface-raised p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary">Requester</p>
            <p className="text-base font-semibold text-text-primary">{request.requester?.name ?? 'Employee'}</p>
          </div>
          <StatusBadge status={request.status} />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface-raised p-5">
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

      <section className="rounded-xl border border-border bg-surface-raised p-5">
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

      <section className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-raised p-5">
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

      <section className="rounded-xl border border-border bg-surface-raised p-5">
        <h2 className="text-lg font-semibold text-text-primary">Approval timeline</h2>
        <div className="mt-4 space-y-3">
          {(requestHistoryQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-text-secondary">No approval events yet.</p>
          ) : (
            (requestHistoryQuery.data ?? []).map((event) => (
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

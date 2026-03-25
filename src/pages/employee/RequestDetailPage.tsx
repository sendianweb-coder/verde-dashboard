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
import { useCancelRequest, useRequest, useRequestHistory, useUpdateRequest } from '@/hooks/useRequests'
import { getErrorMessage } from '@/lib/errors'

export function EmployeeRequestDetailPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()

  const requestQuery = useRequest(id)
  const requestHistoryQuery = useRequestHistory(id)
  const productsQuery = useProducts()
  const cancelRequestMutation = useCancelRequest()
  const updateRequestMutation = useUpdateRequest()
  const [editableNotes, setEditableNotes] = useState<string | null>(null)

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

  const currentNotes = editableNotes ?? (request.notes ?? '')

  const productNameById = new Map((productsQuery.data ?? []).map((product) => [product.id, product.name]))

  const handleCancelRequest = async () => {
    try {
      await cancelRequestMutation.mutateAsync({
        id: request.id,
      })
      toast.success('Request cancelled')
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'cancel' }))
    }
  }

  const handleUpdateNotes = async () => {
    try {
      await updateRequestMutation.mutateAsync({
        id: request.id,
        payload: { notes: currentNotes.trim() || undefined },
      })
      toast.success('Request notes updated')
      setEditableNotes(null)
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'update' }))
      throw error
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Request Detail"
        subtitle={`Submitted on ${new Date(request.createdAt).toLocaleString()}`}
        action={
          <Button type="button" variant="secondary" onClick={() => navigate('/employee/requests')}>
            <ArrowLeft className="h-4 w-4" />
            Back to requests
          </Button>
        }
      />

      <section className="rounded-xl border border-border bg-surface-raised p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-text-secondary">Project</p>
            <p className="text-base font-semibold text-text-primary">{request.project.name}</p>
          </div>
          <StatusBadge status={request.status} />
        </div>

        {request.status === 'PENDING' ? (
          <div className="mt-4 space-y-2">
            <label htmlFor="request-notes" className="text-sm font-medium text-text-primary">
              Notes
            </label>
              <Input
                id="request-notes"
                value={currentNotes}
                onChange={(event) => setEditableNotes(event.target.value)}
                placeholder="Add or update notes"
              />
            <div className="flex justify-end">
              <ConfirmDialog
                title="Save request notes"
                description="Update notes for this pending request?"
                confirmLabel="Save notes"
                isLoading={updateRequestMutation.isPending}
                onConfirm={handleUpdateNotes}
                trigger={
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={updateRequestMutation.isPending || currentNotes.trim() === (request.notes ?? '').trim()}
                  >
                    Save Notes
                  </Button>
                }
              />
            </div>
          </div>
        ) : request.notes ? (
          <p className="mt-4 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-secondary">{request.notes}</p>
        ) : null}
      </section>

      <section className="rounded-xl border border-border bg-surface-raised p-5">
        <h2 className="text-lg font-semibold text-text-primary">Requested items</h2>

        <div className="mt-4 space-y-2">
          {request.items.map((item) => (
            <article key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
              <p className="text-sm text-text-primary">{productNameById.get(item.productId) ?? item.productId}</p>
              <p className="text-sm font-medium text-text-secondary">Qty: {item.quantity}</p>
            </article>
          ))}
        </div>
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

      {request.status === 'PENDING' || request.status === 'APPROVED' ? (
        <div className="flex justify-end">
          <ConfirmDialog
            title="Cancel request"
            description="Are you sure you want to cancel this request?"
            confirmLabel="Yes, cancel request"
            variant="destructive"
            isLoading={cancelRequestMutation.isPending}
            onConfirm={handleCancelRequest}
            trigger={
              <Button type="button" variant="destructive">
                Cancel Request
              </Button>
            }
          />
        </div>
      ) : null}
    </section>
  )
}

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
  const requestHistory = requestHistoryQuery.data ?? []
  const submittedAt = new Date(request.createdAt).toLocaleString()
  const statusLabel = request.status.replace(/_/g, ' ')

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

  const handlePrint = () => {
    const cleanupPrintClass = () => {
      document.body.classList.remove('printing-request')
    }

    document.body.classList.add('printing-request')
    window.addEventListener('afterprint', cleanupPrintClass, { once: true })
    window.print()
  }

  return (
    <section className="space-y-6">
      <div className="request-screen-content">
        <PageHeader
          title="Request Detail"
          subtitle={`Submitted on ${submittedAt}`}
          action={
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                Print Details
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/employee/requests')}>
                <ArrowLeft className="h-4 w-4" />
                Back to requests
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
                  <td>{productNameById.get(item.productId) ?? item.productId}</td>
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

      <section className="request-screen-content rounded-xl border border-border bg-surface-raised p-5">
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

      {request.status === 'PENDING' || request.status === 'APPROVED' ? (
        <div className="request-screen-content flex justify-end">
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

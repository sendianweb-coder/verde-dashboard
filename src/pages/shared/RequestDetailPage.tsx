import { AlertTriangle, ArrowLeft, CheckCircle2, MinusCircle, Package, Printer, Undo2, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DeliveryNoteDocument } from '@/components/shared/DeliveryNoteDocument'
import { EmptyState } from '@/components/shared/EmptyState'
import { InvoiceDocument } from '@/components/shared/InvoiceDocument'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { RequestReturnDialog } from '@/components/shared/RequestReturnDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useAdjustRequestItems,
  useApproveRequest,
  useCompleteRequest,
  usePickupRequest,
  useRejectRequest,
  useRequest,
} from '@/hooks/useRequests'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type { ApprovalEvent, InternalRequestItem, RequestReturnHistoryEvent } from '@/types/request'
import type { ApproveRequestPayload, AdjustItemsPayload } from '@/types/request'

interface RequestDetailPageProps {
  backToPath: string
  showDeliveryNote?: boolean
  showInvoice?: boolean
}

const NO_REASON_VALUE = 'NO_REASON'

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

function createDeliveryNoteFilename() {
  const randomValue = new Uint32Array(1)
  crypto.getRandomValues(randomValue)
  return `delivery-note-${100 + (randomValue[0] % 900)}`
}

function getReasonSelectValue(reason: string) {
  return reason || NO_REASON_VALUE
}

function normalizeReasonSelectValue(value: string) {
  return value === NO_REASON_VALUE ? '' : value
}

function clampQuantity(value: number, max: number) {
  return Math.min(Math.max(0, value), max)
}

function getPositiveQuantity(max: number, preferred: number) {
  if (max <= 0) {
    return 0
  }

  return clampQuantity(preferred > 0 ? preferred : 1, max)
}

function formatIssueReason(reason: string) {
  return reason.replace(/_/g, ' ').toLowerCase()
}

function getItemIssueQuantity(item: InternalRequestItem) {
  if (!item.issueReason) {
    return 0
  }

  const requestedQuantity = item.requestedQuantity ?? item.quantity
  const approvedQuantity = item.approvedQuantity ?? requestedQuantity
  const fulfilledQuantity = item.fulfilledQuantity

  if (fulfilledQuantity != null && approvedQuantity > fulfilledQuantity) {
    return approvedQuantity - fulfilledQuantity
  }

  if (requestedQuantity > approvedQuantity) {
    return requestedQuantity - approvedQuantity
  }

  return 0
}

function getItemIssueLabel(item: InternalRequestItem) {
  if (!item.issueReason) {
    return null
  }

  const issueQuantity = getItemIssueQuantity(item)
  const reason = formatIssueReason(item.issueReason)

  return issueQuantity > 0 ? `${issueQuantity} ${reason}` : reason
}

function ProductMarker({ item }: { item: InternalRequestItem }) {
  return item.product.imageUrl ? (
    <img
      src={item.product.imageUrl}
      alt={item.product.name}
      className="size-16 shrink-0 rounded-lg border border-border bg-surface object-cover"
      loading="lazy"
    />
  ) : (
    <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text-muted">
      <Package className="size-5" />
    </div>
  )
}

function ItemStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    PENDING: 'border-border bg-background text-text-secondary',
    APPROVED: 'border-brand-200 bg-brand-50 text-brand-700',
    REJECTED: 'border-error/20 bg-error-bg text-error',
    FULFILLED: 'border-brand-200 bg-brand-50 text-brand-700',
    PARTIALLY_FULFILLED: 'border-warning bg-pending-bg text-pending-text',
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${colorMap[status] ?? colorMap.PENDING}`}>
      {status === 'APPROVED' || status === 'FULFILLED' ? <CheckCircle2 className="size-3" /> : null}
      {status === 'REJECTED' ? <XCircle className="size-3" /> : null}
      {status === 'PARTIALLY_FULFILLED' ? <MinusCircle className="size-3" /> : null}
      {status.replace(/_/g, ' ')}
    </span>
  )
}

type TimelineEvent =
  | (ApprovalEvent & { kind: 'approval' })
  | (RequestReturnHistoryEvent & { kind: 'return' })

function CardSectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3.5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{title}</h2>
      {action}
    </div>
  )
}

function StockMetric({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="px-3 py-2.5 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">{label}</p>
      <p className={cn('mt-0.5 text-sm font-semibold tabular-nums', highlight ? 'text-pending-text' : 'text-text-primary')}>{value}</p>
    </div>
  )
}

export function RequestDetailPage({ backToPath, showDeliveryNote = false, showInvoice = false }: RequestDetailPageProps) {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const [comment, setComment] = useState('')
  const [itemApprovalMode, setItemApprovalMode] = useState(false)
  const [itemAdjustMode, setItemAdjustMode] = useState(false)
  // Track per-item approval edits: keyed by item.id
  const [itemApprovals, setItemApprovals] = useState<Record<string, {
    approvedQuantity: number
    status: 'APPROVED' | 'REJECTED'
    reason: string
    comment: string
  }>>({})
  // Track per-item adjust edits
  const [itemAdjusts, setItemAdjusts] = useState<Record<string, {
    approvedQuantity: number
    status: 'APPROVED' | 'REJECTED'
    reason: string
    comment: string
  }>>({})

  const requestQuery = useRequest(id)

  const approveRequestMutation = useApproveRequest()
  const rejectRequestMutation = useRejectRequest()
  const pickupRequestMutation = usePickupRequest()
  const completeRequestMutation = useCompleteRequest()
  const adjustRequestItemsMutation = useAdjustRequestItems()

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

  const timelineEvents: TimelineEvent[] = [
    ...(request.history ?? []).map((event) => ({ ...event, kind: 'approval' as const })),
    ...(request.returnHistory ?? []).map((event) => ({ ...event, kind: 'return' as const })),
  ].sort((first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime())
  const pickupEvent = (request.history ?? []).find((event) => event.action === 'PICKED_UP')
  const pickedItems = request.items.filter((item) => (item.fulfilledQuantity ?? 0) > 0)
  const canReturnItems =
    (request.status === 'PICKED_UP' || request.status === 'COMPLETED') &&
    request.items.some((item) => (item.fulfilledQuantity ?? 0) > item.returnedQuantity)
  const submittedAt = formatRequestDateTime(request.createdAt)
  const statusLabel = request.status.replace(/_/g, ' ')
  const projectDetails = [request.project.client, request.project.location, request.project.projectType].filter(Boolean).join(' / ')
  const itemCount = request.summary?.itemCount ?? request.items.length

  const handlePrint = (printClass: 'printing-request' | 'printing-delivery-note' | 'printing-invoice', printTitle?: string) => {
    const previousTitle = document.title
    const cleanupPrintClass = () => {
      document.body.classList.remove(printClass)
      if (printTitle) {
        document.title = previousTitle
      }
    }

    if (printTitle) {
      document.title = printTitle
    }
    document.body.classList.add(printClass)
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

  // --- Item-level approval handlers ---

  const enterItemApprovalMode = () => {
    const initial: Record<string, { approvedQuantity: number; status: 'APPROVED' | 'REJECTED'; reason: string; comment: string }> = {}
    for (const item of request.items) {
      initial[item.id] = {
        approvedQuantity: item.quantity,
        status: 'APPROVED',
        reason: '',
        comment: '',
      }
    }
    setItemApprovals(initial)
    setItemApprovalMode(true)
  }

  const updateItemApproval = (itemId: string, field: string, value: string | number) => {
    setItemApprovals((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }))
  }

  const submitItemApprovals = async () => {
    const items: Array<{ itemId: string; approvedQuantity: number; status: 'APPROVED' | 'REJECTED'; reason?: string; comment?: string }> = request.items.map((item) => {
      const edit = itemApprovals[item.id]
      const nextQuantity = edit?.approvedQuantity ?? 0
      const isRejected = edit?.status === 'REJECTED' || nextQuantity === 0
      const approvedQuantity = isRejected ? 0 : nextQuantity
      return {
        itemId: item.id,
        approvedQuantity,
        status: isRejected ? 'REJECTED' as const : 'APPROVED' as const,
        reason: edit?.reason || undefined,
        comment: edit?.comment || undefined,
      }
    })

    try {
      await approveRequestMutation.mutateAsync({
        id: request.id,
        payload: { comment, items } as ApproveRequestPayload,
      })
      toast.success('Item approvals submitted')
      setItemApprovalMode(false)
      setComment('')
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'approve' }))
    }
  }

  const cancelItemApprovalMode = () => {
    setItemApprovalMode(false)
    setItemApprovals({})
  }

  // --- Item-level adjust handlers ---

  const enterItemAdjustMode = () => {
    const initial: Record<string, { approvedQuantity: number; status: 'APPROVED' | 'REJECTED'; reason: string; comment: string }> = {}
    for (const item of request.items) {
      initial[item.id] = {
        approvedQuantity: item.approvedQuantity ?? item.quantity,
        status: (item.approvedQuantity != null && item.approvedQuantity > 0) ? 'APPROVED' : 'REJECTED',
        reason: item.issueReason ?? '',
        comment: item.issueComment ?? '',
      }
    }
    setItemAdjusts(initial)
    setItemAdjustMode(true)
  }

  const updateItemAdjust = (itemId: string, field: string, value: string | number) => {
    setItemAdjusts((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }))
  }

  const submitItemAdjusts = async () => {
    const changedItems: Array<{ itemId: string; approvedQuantity: number; status: 'APPROVED' | 'REJECTED'; reason?: string; comment?: string }> = request.items
      .map((item) => {
        const edit = itemAdjusts[item.id]
        if (!edit) return null
        const currentApproved = item.approvedQuantity ?? item.quantity
        const currentStatus = currentApproved > 0 ? 'APPROVED' : 'REJECTED'
        const currentReason = item.issueReason ?? ''
        const currentComment = item.issueComment ?? ''
        const approvedQuantity = edit.status === 'REJECTED' ? 0 : edit.approvedQuantity
        const status = approvedQuantity === 0 ? 'REJECTED' as const : 'APPROVED' as const
        const changed =
          approvedQuantity !== currentApproved ||
          status !== currentStatus ||
          edit.reason !== currentReason ||
          edit.comment !== currentComment
        if (!changed) return null
        return {
          itemId: item.id,
          approvedQuantity,
          status,
          reason: edit.reason || undefined,
          comment: edit.comment || undefined,
        }
      })
      .filter(Boolean) as Array<{ itemId: string; approvedQuantity: number; status: 'APPROVED' | 'REJECTED'; reason?: string; comment?: string }>

    if (changedItems.length === 0) {
      toast.error('No items were changed.')
      return
    }

    try {
      await adjustRequestItemsMutation.mutateAsync({
        id: request.id,
        payload: { comment, items: changedItems } as AdjustItemsPayload,
      })
      toast.success('Items adjusted')
      setItemAdjustMode(false)
      setComment('')
    } catch (error) {
      toast.error(getErrorMessage(error, { context: 'update' }))
    }
  }

  const cancelItemAdjustMode = () => {
    setItemAdjustMode(false)
    setItemAdjusts({})
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      {/* ===== Screen header ===== */}
      <div className="request-screen-content space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(backToPath)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            <ArrowLeft className="size-4" />
            Back to queue
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => handlePrint('printing-request')}>
              <Printer className="size-4" />
              Print Details
            </Button>
            {showDeliveryNote && (request.status === 'PICKED_UP' || request.status === 'COMPLETED') ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handlePrint('printing-delivery-note', createDeliveryNoteFilename())}
              >
                <Printer className="size-4" />
                Delivery Note
              </Button>
            ) : null}
            {showInvoice && request.invoice ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handlePrint('printing-invoice', request.invoice!.number.toLowerCase())}
              >
                <Printer className="size-4" />
                Invoice
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-text-primary">
                Request <span className="tabular-nums">{request.id.slice(0, 8)}</span>
              </h1>
              <StatusBadge status={request.status} />
            </div>
            <p className="mt-1 text-sm text-text-secondary">Submitted {submittedAt}</p>
          </div>

          <div className="flex items-center gap-2.5 text-right">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Requester</p>
              <p className="text-sm font-medium text-text-primary">{request.requester.name}</p>
            </div>
            <span className="flex size-11 items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold text-text-secondary">
              {request.requester.name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'E'}
            </span>
          </div>
        </div>
      </div>

      {/* ===== Printable request document (unchanged output) ===== */}
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
                <th scope="col">Requested</th>
                <th scope="col">Approved</th>
                <th scope="col">Fulfilled</th>
                <th scope="col">Left in Stock</th>
                <th scope="col">Issue</th>
              </tr>
            </thead>
            <tbody>
              {request.items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.product.name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.approvedQuantity ?? '—'}</td>
                  <td>{item.fulfilledQuantity ?? '—'}</td>
                  <td>{item.currentStock.availableQuantity}</td>
                  <td>{getItemIssueLabel(item) ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="request-print-section request-print-grid-section" aria-label="Request notes and timeline">
          <div>
            <h2>Notes</h2>
            <p className="request-print-notes">{request.notes?.trim() || 'No notes provided.'}</p>
          </div>

          <div>
            <h2>Request Timeline</h2>
            {timelineEvents.length === 0 ? (
              <p className="request-print-muted">No request events yet.</p>
            ) : (
              <div className="request-print-timeline">
                {timelineEvents.map((event, index) => (
                  <div key={event.id ?? `${event.createdAt}-${event.action}-${index}`} className="request-print-timeline-event">
                    <p>
                      <strong>{formatRequestDateTime(event.createdAt)}</strong>
                      <span>{event.action.replace(/_/g, ' ')}</span>
                      <span>by {event.actor?.name ?? 'System'}</span>
                    </p>
                    {event.kind === 'return' ? (
                      <>
                        {event.note ? <p className="request-print-muted">{event.note}</p> : null}
                        <p className="request-print-muted">
                          Returned: {event.items.map((item) => `${item.productName} × ${item.quantity}`).join(', ')}
                        </p>
                      </>
                    ) : event.comment ? <p className="request-print-muted">{event.comment}</p> : null}
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

      {showDeliveryNote ? <DeliveryNoteDocument request={request} pickupEvent={pickupEvent} pickedItems={pickedItems} /> : null}
      {showInvoice ? <InvoiceDocument request={request} /> : null}

      {/* ===== Two-column body ===== */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ---- Main column ---- */}
        <div className="request-screen-content space-y-6">
          {/* Summary card */}
          <section className="overflow-hidden rounded-xl border border-border bg-surface-raised">
            <CardSectionHeader title="Request Summary" />
            <div className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Project</p>
                <p className="mt-1 text-sm font-medium text-text-primary">{request.project.name}</p>
                {projectDetails ? <p className="mt-0.5 text-xs text-text-muted">{projectDetails}</p> : null}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Submitted</p>
                <p className="mt-1 text-sm font-medium tabular-nums text-text-primary">{formatRequestDate(request.createdAt)}</p>
                <p className="mt-0.5 text-xs tabular-nums text-text-muted">{itemCount} items</p>
              </div>
              {request.project.description ? (
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Project Description</p>
                  <p className="mt-1 text-sm text-text-secondary">{request.project.description}</p>
                </div>
              ) : null}
              {request.notes?.trim() ? (
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Requester Notes</p>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">{request.notes}</p>
                </div>
              ) : null}
            </div>
          </section>

          {/* Items card */}
          <section className="overflow-hidden rounded-xl border border-border bg-surface-raised">
            <CardSectionHeader
              title={`Requested Items (${itemCount})`}
              action={
                request.status === 'PENDING' && !itemApprovalMode ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void onApprove()
                      }}
                      disabled={approveRequestMutation.isPending}
                      className="text-xs font-medium text-brand-700 hover:underline disabled:opacity-50"
                    >
                      Approve All
                    </button>
                    <span className="h-3 w-px bg-border" />
                    <button
                      type="button"
                      onClick={enterItemApprovalMode}
                      className="text-xs font-medium text-brand-700 hover:underline"
                    >
                      Approve by Item
                    </button>
                  </div>
                ) : request.status === 'APPROVED' && !itemAdjustMode ? (
                  <button
                    type="button"
                    onClick={enterItemAdjustMode}
                    className="text-xs font-medium text-brand-700 hover:underline"
                  >
                    Edit Approved Items
                  </button>
                ) : null
              }
            />

            <div className="divide-y divide-border">
              {request.items.map((item) => {
                const itemStatus = item.itemStatus ?? 'PENDING'
                const hasApproved = item.approvedQuantity != null
                const hasFulfilled = item.fulfilledQuantity != null
                const isEditingApproval = itemApprovalMode && itemApprovals[item.id] != null
                const isEditingAdjust = itemAdjustMode && itemAdjusts[item.id] != null
                const rowEditing = isEditingApproval || isEditingAdjust
                const currentAvailable = item.currentStock.availableQuantity
                // Stock warnings are scoped to the approval decision. Once the request leaves
                // PENDING the quantities are reserved/decided and live availability is
                // context only — never rendered as a warning.
                const shortageForDecision = request.status === 'PENDING' ? Math.max(0, item.quantity - currentAvailable) : 0
                const showStockWarning = shortageForDecision > 0

                return (
                  <article key={item.id} className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <ProductMarker item={item} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-text-primary">{item.product.name}</p>
                            <p className="text-xs text-text-muted">SKU {item.product.sku || 'N/A'}</p>
                          </div>
                          <ItemStatusBadge status={itemStatus} />
                        </div>

                        {/* Stock panel */}
                        <div className="mt-3 grid grid-cols-2 divide-x divide-border rounded-lg border border-border bg-surface sm:grid-cols-4">
                          <StockMetric label="Requested" value={item.quantity} />
                          <StockMetric label="At Request" value={item.stockAtRequest?.availableQuantity ?? '—'} />
                          <StockMetric label="Available now" value={currentAvailable} highlight={showStockWarning} />
                          {rowEditing ? (
                            <div className="px-3 py-2.5 text-center">
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Approved</p>
                              <Input
                                type="number"
                                min={0}
                                max={item.quantity}
                                className="mx-auto mt-0.5 h-7 w-20 px-1 text-center text-sm font-semibold tabular-nums"
                                value={isEditingApproval ? itemApprovals[item.id].approvedQuantity : itemAdjusts[item.id].approvedQuantity}
                                onChange={(e) => {
                                  const val = clampQuantity(Number(e.target.value), item.quantity)
                                  const status = val === 0 ? 'REJECTED' : 'APPROVED'
                                  if (isEditingApproval) {
                                    updateItemApproval(item.id, 'approvedQuantity', val)
                                    updateItemApproval(item.id, 'status', status)
                                  }
                                  if (isEditingAdjust) {
                                    updateItemAdjust(item.id, 'approvedQuantity', val)
                                    updateItemAdjust(item.id, 'status', status)
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <>
                              <StockMetric label="Approved" value={hasApproved ? item.approvedQuantity : '—'} />
                            </>
                          )}
                        </div>

                        {hasFulfilled && hasApproved && request.status !== 'PENDING' && !rowEditing ? (
                          <p className="mt-2 text-xs tabular-nums text-text-secondary">
                            Fulfilled <span className="font-medium text-text-primary">{item.fulfilledQuantity}</span> of {item.approvedQuantity ?? item.quantity}
                            {item.returnedQuantity > 0 ? (
                              <> · Returned <span className="font-medium text-text-primary">{item.returnedQuantity}</span></>
                            ) : null}
                          </p>
                        ) : null}

                        {/* Issue / stock alerts */}
                        {!rowEditing && showStockWarning ? (
                          <div className="mt-2 flex items-center gap-1.5 text-pending-text">
                            <AlertTriangle className="size-3.5 shrink-0" />
                            <p className="text-xs font-medium">
                              Only {currentAvailable} unit{currentAvailable === 1 ? '' : 's'} available right now — requested {item.quantity}. Reduce the approved quantity or reject the shortfall.
                            </p>
                          </div>
                        ) : null}

                        {!rowEditing && item.issueReason ? (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-pending-text">
                            <AlertTriangle className="size-3 shrink-0" />
                            <span className="inline-flex rounded-md border border-warning bg-pending-bg px-1.5 py-0.5 font-medium tabular-nums text-pending-text">
                              {getItemIssueLabel(item)}
                            </span>
                            {item.issueComment ? <span className="text-text-muted">{item.issueComment}</span> : null}
                          </div>
                        ) : null}

                        {/* Row edit controls */}
                        {rowEditing ? (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Select
                              value={isEditingApproval ? itemApprovals[item.id].status : itemAdjusts[item.id].status}
                              onValueChange={(val: 'APPROVED' | 'REJECTED') => {
                                const approvedQuantity = val === 'REJECTED'
                                  ? 0
                                  : getPositiveQuantity(
                                      item.quantity,
                                      isEditingApproval ? itemApprovals[item.id].approvedQuantity : itemAdjusts[item.id].approvedQuantity,
                                    )
                                if (isEditingApproval) {
                                  updateItemApproval(item.id, 'status', val)
                                  updateItemApproval(item.id, 'approvedQuantity', approvedQuantity)
                                }
                                if (isEditingAdjust) {
                                  updateItemAdjust(item.id, 'status', val)
                                  updateItemAdjust(item.id, 'approvedQuantity', approvedQuantity)
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 w-[120px] text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="APPROVED">Approve</SelectItem>
                                <SelectItem value="REJECTED">Reject</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={getReasonSelectValue(isEditingApproval ? itemApprovals[item.id].reason : itemAdjusts[item.id].reason)}
                              onValueChange={(val: string) => {
                                const reason = normalizeReasonSelectValue(val)
                                if (isEditingApproval) updateItemApproval(item.id, 'reason', reason)
                                if (isEditingAdjust) updateItemAdjust(item.id, 'reason', reason)
                              }}
                            >
                              <SelectTrigger className="h-8 w-[140px] text-sm">
                                <SelectValue placeholder="Reason" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={NO_REASON_VALUE}>No reason</SelectItem>
                                <SelectItem value="OUT_OF_STOCK">Out of stock</SelectItem>
                                <SelectItem value="DAMAGED">Damaged</SelectItem>
                                <SelectItem value="MISSING">Missing</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Line comment (optional)"
                              className="h-8 min-w-[180px] flex-1 text-sm"
                              value={isEditingApproval ? itemApprovals[item.id].comment : itemAdjusts[item.id].comment}
                              onChange={(e) => {
                                if (isEditingApproval) updateItemApproval(item.id, 'comment', e.target.value)
                                if (isEditingAdjust) updateItemAdjust(item.id, 'comment', e.target.value)
                              }}
                            />
                          </div>
                        ) : null}

                        {/* Stock snapshot detail */}
                        {!rowEditing && item.stockAtRequest ? (
                          <details className="group mt-2">
                            <summary className="cursor-pointer text-xs text-text-muted hover:text-text-secondary">
                              Stock record (requested vs. when submitted)
                            </summary>
                            <div className="mt-1.5 grid grid-cols-2 gap-4 rounded-md bg-surface px-3 py-2 text-xs">
                              <div>
                                <p className="font-medium text-text-secondary">When submitted</p>
                                <p className="tabular-nums text-text-muted">Total {item.stockAtRequest.totalQuantity} / Reserved {item.stockAtRequest.reservedQuantity} / Available {item.stockAtRequest.availableQuantity}</p>
                              </div>
                              <div>
                                <p className="font-medium text-text-secondary">Live</p>
                                <p className="tabular-nums text-text-muted">Total {item.currentStock.totalQuantity} / Reserved {item.currentStock.reservedQuantity} / Available {item.currentStock.availableQuantity}</p>
                              </div>
                            </div>
                          </details>
                        ) : null}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </div>

        {/* ---- Right rail ---- */}
        <div className="request-screen-content space-y-6">
          {/* Action card */}
          <section className="overflow-hidden rounded-xl border border-border border-t-2 border-t-brand-600 bg-surface-raised">
            <CardSectionHeader
              title={
                request.status === 'PENDING'
                  ? 'Approval Actions'
                  : request.status === 'APPROVED'
                    ? 'Pickup Actions'
                    : request.status === 'PICKED_UP'
                      ? 'Completion'
                      : 'Actions'
              }
            />
            <div className="space-y-4 p-5">
              <div>
                <label htmlFor="action-comment" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                  Action comment
                </label>
                <textarea
                  id="action-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Optional for approve/pickup/complete. Required for reject."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                />
              </div>

              {request.status === 'PENDING' ? (
                !itemApprovalMode ? (
                  <>
                    <ConfirmDialog
                      title="Approve all items"
                      description="Approve this request in full and reserve stock? All requested items will be approved at the requested quantity."
                      confirmLabel="Approve All"
                      variant="default"
                      isLoading={approveRequestMutation.isPending}
                      onConfirm={onApprove}
                      trigger={<Button className="w-full bg-brand-600 hover:bg-brand-700">Approve Request</Button>}
                    />
                    <div className="flex gap-2">
                      <Button variant="secondary" className="flex-1" onClick={enterItemApprovalMode}>
                        Approve by Item
                      </Button>
                      <ConfirmDialog
                        title="Reject entire request"
                        description="Reject this request? A comment with at least 10 characters is required."
                        confirmLabel="Reject All"
                        variant="destructive"
                        isLoading={rejectRequestMutation.isPending}
                        onConfirm={async () => {
                          if (comment.trim().length < 10) {
                            toast.error('Rejection comment must be at least 10 characters.')
                            throw new Error('Invalid rejection comment')
                          }

                          await onReject()
                        }}
                        trigger={<Button variant="destructive" className="flex-1">Reject All</Button>}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-text-secondary">
                      Set quantities, statuses, and reasons per item, then submit.
                    </p>
                    <Button
                      className="w-full bg-brand-600 hover:bg-brand-700"
                      onClick={submitItemApprovals}
                      disabled={approveRequestMutation.isPending}
                    >
                      {approveRequestMutation.isPending ? 'Submitting...' : 'Submit Item Approvals'}
                    </Button>
                    <Button variant="secondary" className="w-full" onClick={cancelItemApprovalMode}>
                      Cancel
                    </Button>
                  </>
                )
              ) : null}

              {request.status === 'APPROVED' ? (
                !itemAdjustMode ? (
                  <>
                    <p className="text-xs text-text-secondary">
                      Pickup fulfills the currently approved quantities exactly. Use Edit Approved Items to change quantities or reject items first.
                    </p>
                    <ConfirmDialog
                      title="Confirm pickup"
                      description="This will pick up exactly the currently approved quantities. To change quantities or reject products, cancel and use Edit Approved Items first."
                      confirmLabel="Confirm Pickup"
                      isLoading={pickupRequestMutation.isPending}
                      onConfirm={onPickup}
                      trigger={<Button className="w-full bg-brand-600 hover:bg-brand-700">Confirm Pickup</Button>}
                    />
                    <Button variant="secondary" className="w-full" onClick={enterItemAdjustMode}>
                      Edit Approved Items
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-text-secondary">
                      Adjust quantities or reject items. Only changed lines are submitted.
                    </p>
                    <Button
                      className="w-full bg-brand-600 hover:bg-brand-700"
                      onClick={submitItemAdjusts}
                      disabled={adjustRequestItemsMutation.isPending}
                    >
                      {adjustRequestItemsMutation.isPending ? 'Saving...' : 'Save Item Changes'}
                    </Button>
                    <Button variant="secondary" className="w-full" onClick={cancelItemAdjustMode}>
                      Cancel
                    </Button>
                  </>
                )
              ) : null}

              {request.status === 'PICKED_UP' ? (
                <>
                  <ConfirmDialog
                    title="Mark complete"
                    description="Mark this request as completed?"
                    confirmLabel="Mark Complete"
                    isLoading={completeRequestMutation.isPending}
                    onConfirm={onComplete}
                    trigger={<Button className="w-full bg-brand-600 hover:bg-brand-700">Mark Complete</Button>}
                  />
                  {canReturnItems ? (
                    <RequestReturnDialog
                      request={request}
                      trigger={
                        <Button type="button" variant="secondary" className="w-full">
                          <Undo2 className="size-4" />
                          Return items
                        </Button>
                      }
                    />
                  ) : null}
                </>
              ) : null}

              {request.status === 'COMPLETED' ? (
                canReturnItems ? (
                  <RequestReturnDialog
                    request={request}
                    trigger={
                      <Button type="button" variant="secondary" className="w-full">
                        <Undo2 className="size-4" />
                        Return items
                      </Button>
                    }
                  />
                ) : <p className="text-sm text-text-secondary">This request is completed and has no further actions.</p>
              ) : null}

              {request.status === 'REJECTED' || request.status === 'CANCELED' ? (
                <p className="text-sm text-text-secondary">This request is {statusLabel.toLowerCase()} and has no further actions.</p>
              ) : null}
            </div>
          </section>

          {/* Timeline card */}
          <section className="overflow-hidden rounded-xl border border-border bg-surface-raised">
            <CardSectionHeader title="Request Timeline" />
            <div className="p-5">
              {timelineEvents.length === 0 ? (
                <p className="text-sm text-text-secondary">No request events yet.</p>
              ) : (
                <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-border">
                  {timelineEvents.map((event, index) => {
                    const isFirst = index === 0
                    const isReturn = event.kind === 'return'
                    return (
                      <li key={event.id ?? `${event.createdAt}-${event.action}-${index}`} className="relative pl-8">
                        <span
                          className={cn(
                            'absolute left-0 top-0.5 flex size-6 items-center justify-center rounded-full border-2 border-surface-raised',
                            isReturn
                              ? 'bg-brand-50 text-brand-700'
                              : isFirst ? 'bg-brand-600 text-white ring-2 ring-brand-600/20' : 'bg-surface text-text-muted',
                          )}
                        >
                          {isReturn ? <Undo2 className="size-3" /> : isFirst ? <CheckCircle2 className="size-3" /> : <span className="size-1.5 rounded-full bg-current" />}
                        </span>
                        <p className="text-xs font-medium text-text-primary">
                          {isReturn ? 'Items returned' : event.action.replace(/_/g, ' ')}
                        </p>
                        <p className="mt-0.5 text-[11px] text-text-muted">
                          by {event.actor?.name ?? 'System'}
                          {event.actor?.role ? ` · ${event.actor.role}` : ''}
                        </p>
                        <p className="mt-0.5 text-[11px] tabular-nums uppercase tracking-wide text-text-muted">
                          {formatRequestDateTime(event.createdAt)}
                        </p>
                        {event.kind === 'return' ? (
                          <div className="mt-1.5 space-y-2 rounded-md border border-brand-200 bg-brand-50/50 px-2 py-2 text-xs text-text-secondary">
                            {event.note ? <p>{event.note}</p> : null}
                            <ul className="space-y-1" aria-label="Returned items">
                              {event.items.map((item, itemIndex) => (
                                <li key={`${event.id}-${itemIndex}`} className="flex justify-between gap-3 text-text-primary">
                                  <span className="min-w-0 truncate">{item.productName}</span>
                                  <span className="shrink-0 font-medium tabular-nums">× {item.quantity}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : event.comment ? (
                          <p className="mt-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-text-secondary">
                            {event.comment}
                          </p>
                        ) : null}
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}

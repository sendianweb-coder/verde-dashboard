import { AlertTriangle, ArrowLeft, Boxes, CalendarClock, CheckCircle2, ClipboardList, MinusCircle, Package, Printer, UserRound, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DeliveryNoteDocument } from '@/components/shared/DeliveryNoteDocument'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
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
import type { InternalRequestItem } from '@/types/request'
import type { ApproveRequestPayload, AdjustItemsPayload } from '@/types/request'

interface RequestDetailPageProps {
  backToPath: string
  showDeliveryNote?: boolean
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
    <img src={item.product.imageUrl} alt={item.product.name} className="size-10 rounded-lg border border-border bg-surface object-cover" loading="lazy" />
  ) : (
    <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-text-muted">
      <Package className="size-4" />
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

export function RequestDetailPage({ backToPath, showDeliveryNote = false }: RequestDetailPageProps) {
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

  const requestHistory = request.history ?? []
  const pickupEvent = requestHistory.find((event) => event.action === 'PICKED_UP')
  const pickedItems = request.items.filter((item) => (item.fulfilledQuantity ?? 0) > 0)
  const submittedAt = formatRequestDateTime(request.createdAt)
  const statusLabel = request.status.replace(/_/g, ' ')
  const projectDetails = [request.project.client, request.project.location, request.project.projectType].filter(Boolean).join(' / ')

  const handlePrint = (printClass: 'printing-request' | 'printing-delivery-note', printTitle?: string) => {
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
    // Initialize item approvals from current request items
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
    // Send every line where quantity, status, reason, or comment changed.
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
    <section className="space-y-6">
      <div className="request-screen-content">
        <PageHeader
          title="Request Detail"
          subtitle={`Submitted ${submittedAt}`}
          action={
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => handlePrint('printing-request')}>
                <Printer className="h-4 w-4" />
                Print Details
              </Button>
              {showDeliveryNote && (request.status === 'PICKED_UP' || request.status === 'COMPLETED') ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handlePrint('printing-delivery-note', createDeliveryNoteFilename())}
                >
                  <Printer className="h-4 w-4" />
                  Print Delivery Note
                </Button>
              ) : null}
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

      {showDeliveryNote ? <DeliveryNoteDocument request={request} pickupEvent={pickupEvent} pickedItems={pickedItems} /> : null}

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

        {request.project.description ? <p className="mt-4 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-secondary">{'Description: ' + request.project.description}</p> : null}
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
            {request.summary?.totalApprovedQuantity != null ? ` | ${request.summary.totalApprovedQuantity} approved` : ''}
            {request.summary?.totalFulfilledQuantity != null ? ` / ${request.summary.totalFulfilledQuantity} fulfilled` : ''}
            {request.summary?.hasItemIssues ? ' | Has issues' : ''}
          </span>
        </div>

        <div className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border bg-background">
          {request.items.map((item) => {
            const itemStatus = item.itemStatus ?? 'PENDING'
            const hasApproved = item.approvedQuantity != null
            const hasFulfilled = item.fulfilledQuantity != null
            const isEditingApproval = itemApprovalMode && itemApprovals[item.id] != null
            const isEditingAdjust = itemAdjustMode && itemAdjusts[item.id] != null
            const isEditing = isEditingApproval || isEditingAdjust

            return (
              <article key={item.id} className="px-3 py-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <ProductMarker item={item} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-text-primary">{item.product.name}</p>
                        <ItemStatusBadge status={itemStatus} />
                      </div>
                      <p className="text-xs text-text-muted">SKU {item.product.sku || 'N/A'}</p>
                      {item.issueReason ? (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-pending-text">
                          <AlertTriangle className="size-3 shrink-0" />
                          <span className="inline-flex rounded-md border border-warning bg-pending-bg px-1.5 py-0.5 font-medium tabular-nums text-pending-text">
                            {getItemIssueLabel(item)}
                          </span>
                          {item.issueComment ? <span className="text-text-muted">{item.issueComment}</span> : null}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {!isEditing ? (
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-right sm:grid-cols-4 sm:min-w-[440px]">
                      <div>
                        <dt className="text-xs text-text-muted">Requested</dt>
                        <dd className="text-sm font-medium tabular-nums text-text-primary">{item.quantity}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-text-muted">Approved</dt>
                        <dd className="text-sm font-medium tabular-nums text-text-primary">
                          {hasApproved ? item.approvedQuantity : '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-text-muted">Fulfilled</dt>
                        <dd className="text-sm font-medium tabular-nums text-text-primary">
                          {hasFulfilled ? item.fulfilledQuantity : '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-text-muted">Current Stock</dt>
                        <dd className="text-sm font-medium tabular-nums text-text-primary">{item.currentStock.availableQuantity}</dd>
                      </div>
                    </dl>
                  ) : null}

                  {isEditingApproval || isEditingAdjust ? (
                    <div className="flex flex-col gap-2 sm:min-w-[400px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs text-text-muted whitespace-nowrap">Qty:</label>
                          <Input
                            type="number"
                            min={0}
                            max={item.quantity}
                            className="h-8 w-20 text-sm"
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
                      </div>
                      <Input
                        placeholder="Line comment (optional)"
                        className="h-8 text-sm"
                        value={isEditingApproval ? itemApprovals[item.id].comment : itemAdjusts[item.id].comment}
                        onChange={(e) => {
                          if (isEditingApproval) updateItemApproval(item.id, 'comment', e.target.value)
                          if (isEditingAdjust) updateItemAdjust(item.id, 'comment', e.target.value)
                        }}
                      />
                    </div>
                  ) : null}

                </div>

                {item.stockAtRequest ? (
                  <details className="mt-2 group">
                    <summary className="cursor-pointer text-xs text-text-muted hover:text-text-secondary">
                      Stock snapshots
                    </summary>
                    <div className="mt-1.5 grid grid-cols-2 gap-4 rounded-md bg-surface px-3 py-2 text-xs">
                      <div>
                        <p className="font-medium text-text-secondary">At request time</p>
                        <p className="text-text-muted">Total {item.stockAtRequest.totalQuantity} / Reserved {item.stockAtRequest.reservedQuantity} / Available {item.stockAtRequest.availableQuantity}</p>
                      </div>
                      <div>
                        <p className="font-medium text-text-secondary">Current</p>
                        <p className="text-text-muted">Total {item.currentStock.totalQuantity} / Reserved {item.currentStock.reservedQuantity} / Available {item.currentStock.availableQuantity}</p>
                      </div>
                    </div>
                  </details>
                ) : null}
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
            {!itemApprovalMode ? (
              <>
                <ConfirmDialog
                  title="Approve all items"
                  description="Approve this request in full and reserve stock? All requested items will be approved at the requested quantity."
                  confirmLabel="Approve All"
                  variant="default"
                  isLoading={approveRequestMutation.isPending}
                  onConfirm={onApprove}
                  trigger={<Button>Approve All</Button>}
                />

                <Button variant="secondary" onClick={enterItemApprovalMode}>
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
                  trigger={<Button variant="destructive">Reject All</Button>}
                />
              </>
            ) : (
              <>
                <Button onClick={submitItemApprovals} disabled={approveRequestMutation.isPending}>
                  Submit Item Approvals
                </Button>
                <Button variant="secondary" onClick={cancelItemApprovalMode}>
                  Cancel
                </Button>
              </>
            )}
          </>
        ) : null}

        {request.status === 'APPROVED' ? (
          <>
            {!itemAdjustMode ? (
              <>
                <p className="w-full text-sm text-text-secondary">
                  Adjust quantities or reject items before confirming pickup. Pickup will fulfill the approved quantities exactly.
                </p>

                <Button variant="secondary" onClick={enterItemAdjustMode}>
                  Edit Approved Items
                </Button>

                <ConfirmDialog
                  title="Confirm pickup"
                  description="This will pick up exactly the currently approved quantities. To change quantities or reject products, cancel and use Edit Approved Items first."
                  confirmLabel="Confirm Pickup"
                  isLoading={pickupRequestMutation.isPending}
                  onConfirm={onPickup}
                  trigger={<Button>Confirm Pickup</Button>}
                />
              </>
            ) : null}

            {itemAdjustMode ? (
              <>
                <Button onClick={submitItemAdjusts} disabled={adjustRequestItemsMutation.isPending}>
                  Save Item Changes
                </Button>
                <Button variant="secondary" onClick={cancelItemAdjustMode}>
                  Cancel
                </Button>
              </>
            ) : null}
          </>
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

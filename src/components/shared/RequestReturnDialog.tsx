import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'

import { DialogFormActions } from '@/components/shared/DialogFormActions'
import { ProductQuantityControls } from '@/components/shared/RequestCatalog'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useReturnRequest } from '@/hooks/useRequests'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type { InternalRequest } from '@/types/request'

interface RequestReturnDialogProps {
  request: InternalRequest
  trigger: ReactNode
}

type QuantitiesByItemId = Record<string, number>
type ReturnFormErrors = Partial<Record<'items' | 'note' | 'form', string>>

export function RequestReturnDialog({ request, trigger }: RequestReturnDialogProps) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [quantities, setQuantities] = useState<QuantitiesByItemId>({})
  const [errors, setErrors] = useState<ReturnFormErrors>({})
  const firstItemRef = useRef<HTMLButtonElement>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const returnRequestMutation = useReturnRequest()
  const isEligibleStatus = request.status === 'PICKED_UP' || request.status === 'COMPLETED'
  const returnableItems = request.items
    .map((item) => ({
      ...item,
      returnableQuantity: Math.max(0, (item.fulfilledQuantity ?? 0) - item.returnedQuantity),
    }))
    .filter((item) => item.returnableQuantity > 0)

  if (!isEligibleStatus || returnableItems.length === 0) {
    return null
  }

  const reset = () => {
    setNote('')
    setQuantities({})
    setErrors({})
  }

  const setQuantity = (itemId: string, value: number, maximum: number) => {
    setQuantities((current) => ({
      ...current,
      [itemId]: Math.max(0, Math.min(Number.isFinite(value) ? Math.floor(value) : 0, maximum)),
    }))
  }

  const selectedItems = returnableItems
    .map((item) => ({ itemId: item.id, quantity: quantities[item.id] ?? 0 }))
    .filter((item) => item.quantity > 0)
  const totalReturnQuantity = selectedItems.reduce((total, item) => total + item.quantity, 0)

  const showError = (field: 'items' | 'note' | 'form', message: string) => {
    setErrors((current) => ({ ...current, [field]: message }))
    toast.error(message)

    if (field === 'items') {
      firstItemRef.current?.focus()
    }
    if (field === 'note') {
      noteRef.current?.focus()
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (selectedItems.length === 0) {
      showError('items', 'Select at least one item to return')
      return
    }

    if (!note.trim()) {
      showError('note', 'A return note is required')
      return
    }

    try {
      await returnRequestMutation.mutateAsync({
        id: request.id,
        payload: { note: note.trim(), items: selectedItems },
      })
      toast.success('Returned items were added back to stock')
      setOpen(false)
      reset()
    } catch (error) {
      showError('form', getErrorMessage(error, { context: 'update' }))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          reset()
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle>Return items</DialogTitle>
              <DialogDescription>
                Restore fulfilled items to available stock immediately.
              </DialogDescription>
            </div>
            <span className="shrink-0 rounded-md border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
              Stock return
            </span>
          </div>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <fieldset className="space-y-3" aria-describedby={errors.items ? 'return-items-error' : undefined}>
            <legend className="flex w-full items-center justify-between gap-3 text-sm font-semibold text-text-primary">
              <span>Items to return</span>
              <span className="text-xs font-medium tabular-nums text-text-muted">{returnableItems.length} available</span>
            </legend>
            <p className="text-sm text-text-secondary">Choose each fulfilled item and enter the quantity being returned.</p>

            <div className="space-y-2">
              {returnableItems.map((item, index) => {
                const quantity = quantities[item.id] ?? 0
                const checked = quantity > 0

                return (
                  <article
                    key={item.id}
                    className={cn(
                      'grid gap-3 rounded-lg border p-3 sm:grid-cols-[auto_minmax(0,1fr)_7.5rem] sm:items-end',
                      checked
                        ? 'border-brand-200 bg-brand-50/60'
                        : 'border-border bg-background transition-colors hover:border-brand-200 hover:bg-surface',
                    )}
                  >
                    <Checkbox
                      ref={index === 0 ? firstItemRef : undefined}
                      id={`return-item-${item.id}`}
                      checked={checked}
                      onCheckedChange={(nextChecked) => {
                        setQuantity(item.id, nextChecked ? 1 : 0, item.returnableQuantity)
                        setErrors((current) => ({ ...current, items: undefined, form: undefined }))
                      }}
                      aria-label={`Return ${item.product.name}`}
                    />
                    <label htmlFor={`return-item-${item.id}`} className="min-w-0 cursor-pointer text-sm">
                      <span className="block truncate font-medium text-text-primary">{item.product.name}</span>
                      <span className="mt-0.5 block text-text-secondary">
                        Up to <span className="font-medium tabular-nums text-text-primary">{item.returnableQuantity}</span> can be returned
                      </span>
                    </label>
                    <div className="space-y-1">
                      <span className={cn('block text-sm font-medium text-text-primary', !checked && 'opacity-50')}>Quantity</span>
                      {checked ? (
                        <ProductQuantityControls
                          quantity={quantity}
                          maxQuantity={item.returnableQuantity}
                          onQuantityChange={(nextQuantity) => {
                            setQuantity(item.id, nextQuantity, item.returnableQuantity)
                            setErrors((current) => ({ ...current, items: undefined, form: undefined }))
                          }}
                        />
                      ) : (
                        <p className="h-8 content-center text-sm text-text-muted">Select item</p>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>

            {errors.items ? (
              <p id="return-items-error" className="text-sm text-error" role="alert">
                {errors.items}
              </p>
            ) : null}
          </fieldset>

          <section className="space-y-2" aria-labelledby="return-note-label">
            <div className="flex items-center justify-between gap-3">
              <label id="return-note-label" htmlFor="return-note" className="text-sm font-semibold text-text-primary">
                Return note
              </label>
              <span className="text-xs font-medium text-error">Required</span>
            </div>
            <p className="text-sm text-text-secondary">This note is saved with the stock movement and audit record.</p>
            <textarea
              ref={noteRef}
              id="return-note"
              name="return-note"
              className={cn(
                'min-h-28 w-full rounded-lg border bg-background px-3 py-2 text-sm text-text-primary focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600',
                errors.note ? 'border-error' : 'border-border',
              )}
              value={note}
              onChange={(event) => {
                setNote(event.target.value)
                setErrors((current) => ({ ...current, note: undefined, form: undefined }))
              }}
              aria-invalid={Boolean(errors.note)}
              aria-describedby={errors.note ? 'return-note-error' : undefined}
              placeholder="Explain why these items were returned"
              required
            />
            {errors.note ? (
              <p id="return-note-error" className="text-sm text-error" role="alert">
                {errors.note}
              </p>
            ) : null}
          </section>

          <section className="space-y-3 rounded-lg border border-border bg-surface p-3" aria-label="Return summary">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <div>
                <p className="text-sm font-semibold text-text-primary">Ready to return</p>
                <p className="text-sm text-text-secondary">
                  {selectedItems.length === 0 ? 'Select items above to continue.' : 'Inventory will be restored immediately.'}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums text-text-primary">
                {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} · {totalReturnQuantity} {totalReturnQuantity === 1 ? 'unit' : 'units'}
              </p>
            </div>

            {errors.form ? (
              <p className="rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error" role="alert">
                {errors.form}
              </p>
            ) : null}

            <DialogFormActions
              isSubmitting={returnRequestMutation.isPending}
              submitLabel="Return selected items"
              submittingLabel="Returning..."
              onCancel={() => setOpen(false)}
            />
          </section>
        </form>
      </DialogContent>
    </Dialog>
  )
}

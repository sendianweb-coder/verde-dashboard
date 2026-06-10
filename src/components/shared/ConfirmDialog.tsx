import type { ReactNode } from 'react'
import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ConfirmDialogProps {
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel?: string
  variant?: 'default' | 'destructive' | 'warning'
  isLoading?: boolean
  conflicts?: Array<{
    productName: string
    requested: number
    available: number
  }>
  children?: ReactNode
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'default',
  isLoading = false,
  conflicts = [],
  children,
  onConfirm,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen
  const hasConflicts = conflicts.length > 0

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {variant === 'warning' ? <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" /> : null}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {hasConflicts ? (
          <section className="space-y-3 rounded-lg border border-warning bg-pending-bg p-3">
            <p className="text-sm font-medium text-pending-text">
              Stock conflicts detected. Review requested vs available quantities before continuing.
            </p>
            <div className="space-y-2">
              {conflicts.map((conflict) => (
                <article
                  key={`${conflict.productName}-${conflict.requested}-${conflict.available}`}
                  className="rounded-md border border-warning/50 bg-background px-3 py-2"
                >
                  <p className="text-sm font-medium text-text-primary">{conflict.productName}</p>
                  <p className="text-xs text-text-secondary">
                    Requested: {conflict.requested} - Available: {conflict.available}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {children ? <div className="space-y-2">{children}</div> : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            disabled={isLoading}
            onClick={async () => {
              try {
                await onConfirm()
                setDialogOpen(false)
              } catch {
                // Keep dialog open when action fails.
              }
            }}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

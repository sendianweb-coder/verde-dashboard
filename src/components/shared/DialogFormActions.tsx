import { Button } from '@/components/ui/button'

interface DialogFormActionsProps {
  isSubmitting?: boolean
  submitLabel: string
  submittingLabel?: string
  onCancel: () => void
}

export function DialogFormActions({
  isSubmitting = false,
  submitLabel,
  submittingLabel = 'Saving...',
  onCancel,
}: DialogFormActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </div>
  )
}

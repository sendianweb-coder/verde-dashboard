import { cn } from '@/lib/utils'

interface StockIndicatorProps {
  availableQuantity: number
  totalQuantity: number
}

export function StockIndicator({ availableQuantity, totalQuantity }: StockIndicatorProps) {
  const ratio = totalQuantity > 0 ? availableQuantity / totalQuantity : 0

  const state =
    availableQuantity <= 0
      ? { label: 'Out of Stock', className: 'bg-rejected-bg text-rejected-text' }
      : ratio <= 0.2
        ? { label: 'Critical', className: 'bg-rejected-bg text-rejected-text' }
        : ratio <= 0.4
          ? { label: 'Low', className: 'bg-pending-bg text-pending-text' }
          : { label: 'In Stock', className: 'bg-completed-bg text-completed-text' }

  return <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', state.className)}>{state.label}</span>
}

import { STATUS_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'

type StatusKey = keyof typeof STATUS_COLORS

interface StatusBadgeProps {
  status: StatusKey
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status]
  if (!colors) return null

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', colors.bg, colors.text)}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

import { STATUS_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'

type StatusKey = keyof typeof STATUS_COLORS

interface StatusBadgeProps {
  status: StatusKey
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', STATUS_COLORS[status])}>
      {status}
    </span>
  )
}

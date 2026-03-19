import { Bell } from 'lucide-react'

import { useNotificationStore } from '@/store/notificationStore'

export function NotificationBell() {
  const unreadCount = useNotificationStore((state) => state.unreadCount)

  return (
    <button
      type="button"
      className="relative rounded-full p-2 text-text-secondary hover:bg-surface hover:text-text-primary"
      aria-label="Open notifications"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 rounded-full bg-error px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {unreadCount}
        </span>
      ) : null}
    </button>
  )
}

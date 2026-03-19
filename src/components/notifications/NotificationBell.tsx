import { Bell } from 'lucide-react'

import { useNotificationStore } from '@/store/notificationStore'

export function NotificationBell() {
  const unreadCount = useNotificationStore((state) => state.unreadCount)

  return (
    <button
      type="button"
      className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      aria-label="Open notifications"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {unreadCount}
        </span>
      ) : null}
    </button>
  )
}

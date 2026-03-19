import { EVENT_ICON } from '@/lib/constants'
import { useNotificationStore } from '@/store/notificationStore'

export function NotificationDrawer() {
  const notifications = useNotificationStore((state) => state.notifications)

  return (
    <div className="max-h-80 w-full space-y-2 overflow-y-auto rounded-lg border border-border bg-surface-raised p-3 shadow-sm">
      {notifications.length === 0 ? (
        <p className="text-sm text-text-secondary">No notifications yet.</p>
      ) : (
        notifications.map((notification) => {
          const Icon = EVENT_ICON[notification.type]

          return (
            <article key={notification.id} className="rounded-md border border-border p-2">
              <div className="flex items-center gap-2 text-sm text-text-primary">
                <Icon className="h-4 w-4 text-text-secondary" />
                <span>{notification.message}</span>
              </div>
              <time className="mt-1 block text-xs text-text-muted">{notification.createdAt}</time>
            </article>
          )
        })
      )}
    </div>
  )
}

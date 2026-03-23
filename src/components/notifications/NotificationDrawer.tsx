import { EVENT_ICON } from '@/lib/constants'
import { useNotificationStore } from '@/store/notificationStore'
import { Button } from '@/components/ui/button'

export function NotificationDrawer() {
  const notifications = useNotificationStore((state) => state.notifications)
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead)
  const clearAll = useNotificationStore((state) => state.clearAll)

  return (
    <div className="w-full space-y-3 rounded-lg border border-border bg-surface-raised p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-primary">Notifications</p>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={markAllAsRead}>
            Mark all read
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearAll}>
            Clear
          </Button>
        </div>
      </div>

      <div className="max-h-80 space-y-2 overflow-y-auto" aria-live="polite">
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
                <time className="mt-1 block text-xs text-text-muted">{new Date(notification.createdAt).toLocaleString()}</time>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}

import { NotificationBell } from '@/components/notifications/NotificationBell'
import { useAuthStore } from '@/store/authStore'

export function Topbar() {
  const user = useAuthStore((state) => state.user)

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      <div>
        <p className="text-sm text-text-secondary">Welcome back</p>
        <p className="font-heading text-lg font-semibold text-text-primary">{user?.fullName ?? 'Staff'}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
          {user?.role ?? 'GUEST'}
        </span>
        <NotificationBell />
      </div>
    </header>
  )
}

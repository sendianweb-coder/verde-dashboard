import { NotificationBell } from '@/components/notifications/NotificationBell'
import { useAuthStore } from '@/store/authStore'

export function Topbar() {
  const user = useAuthStore((state) => state.user)

  return (
    <header className="flex h-16 items-center justify-between border-b border-emerald-100 bg-white/80 px-4 backdrop-blur lg:px-6">
      <div>
        <p className="text-sm text-slate-500">Welcome back</p>
        <p className="font-[var(--font-heading)] text-lg text-slate-900">{user?.fullName ?? 'Staff'}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          {user?.role ?? 'GUEST'}
        </span>
        <NotificationBell />
      </div>
    </header>
  )
}

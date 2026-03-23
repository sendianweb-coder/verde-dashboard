import { Menu, Search, User } from 'lucide-react'

import { NotificationBell } from '@/components/notifications/NotificationBell'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useLogout } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'

interface TopbarProps {
  onOpenMobileNav?: () => void
}

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  const user = useAuthStore((state) => state.user)
  const logoutMutation = useLogout()

  const initials =
    user?.name
      ?.split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'VS'

  const handleSignOut = async () => {
    await logoutMutation.mutateAsync()
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation menu"
          onClick={onOpenMobileNav}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="relative w-52 sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            aria-label="Search"
            placeholder="Search..."
            className="h-9 rounded-lg border-border bg-surface pl-9 text-sm text-text-primary placeholder:text-text-muted"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface"
              aria-label="Open profile menu"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {initials}
              </span>
              <span className="hidden text-sm font-medium text-text-primary sm:inline">{user?.name ?? 'Staff'}</span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48 border-border bg-surface-raised">
            <div className="px-2 py-1.5">
              <p className="truncate text-sm font-medium text-text-primary">{user?.name ?? 'Staff'}</p>
              <p className="text-xs text-text-secondary">{user?.role ?? 'GUEST'}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-text-primary">
              <User className="h-4 w-4 text-text-secondary" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-text-primary">Change Password</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-error focus:bg-badge-rejected-bg focus:text-error"
              onClick={() => {
                void handleSignOut()
              }}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? 'Signing out...' : 'Sign Out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

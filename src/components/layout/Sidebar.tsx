import { NavLink } from 'react-router-dom'

import { NAV_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

interface SidebarProps {
  mobile?: boolean
  onNavigate?: () => void
}

export function Sidebar({ mobile = false, onNavigate }: SidebarProps) {
  const role = useAuthStore((state) => state.user?.role)
  const user = useAuthStore((state) => state.user)
  const navItems = role ? NAV_ITEMS[role] : []

  return (
    <aside
      className={cn(
        'flex flex-col border-sidebar-border bg-sidebar-bg',
        mobile ? 'h-full w-full' : 'sticky top-0 hidden h-screen w-64 shrink-0 border-r lg:flex',
      )}
    >
      <div className="flex h-15 shrink-0 items-center gap-2 border-b border-border px-6">
        <img src="/31.png" alt="Verde logo" className="h-6 w-6 rounded-sm object-cover" />
        <p className="text-sm font-semibold tracking-wide text-text-primary">Verde Support</p>
      </div>

      <p className="px-4 pt-4 pb-1 text-xs font-medium uppercase tracking-wider text-text-muted">Menu</p>

      <nav className="flex flex-col gap-0.5 px-3 py-2" aria-label="Main navigation">
        {navItems.map((item) => {
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-fast',
                  isActive
                    ? 'text-nav-active-icon'
                    : 'text-nav-default-text hover:bg-surface hover:text-text-primary',
                )
              }
            >
              {({ isActive }) => {
                const NavIcon = item.icon
                return (
                  <>
                    <NavIcon
                      className={cn(
                        'h-4 w-4 transition-colors duration-fast',
                        isActive ? 'text-nav-active-icon' : 'text-nav-default-icon',
                      )}
                    />
                    <span
                      className={cn(
                        'transition-colors duration-fast',
                        isActive ? 'text-nav-active-text' : 'text-nav-default-text',
                      )}
                    >
                      {item.label}
                    </span>
                  </>
                )
              }}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-border px-4 py-4">
        <p className="truncate text-body-sm font-medium text-text-secondary">{user?.name ?? 'Staff'}</p>
      </div>
    </aside>
  )
}

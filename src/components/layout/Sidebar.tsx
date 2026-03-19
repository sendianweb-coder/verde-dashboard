import { NavLink } from 'react-router-dom'

import { NAV_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

export function Sidebar() {
  const role = useAuthStore((state) => state.user?.role)
  const navItems = role ? NAV_ITEMS[role] : []

  return (
    <aside className="flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar-bg p-4 lg:w-64">
      <nav className="flex flex-col gap-0.5 px-3 py-2">
        {navItems.map((item) => {
          return (
            <NavLink
              key={item.path}
              to={item.path}
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
    </aside>
  )
}

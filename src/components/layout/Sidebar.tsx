import { NavLink } from 'react-router-dom'

import { NAV_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

export function Sidebar() {
  const role = useAuthStore((state) => state.user?.role)
  const navItems = role ? NAV_ITEMS[role] : []

  return (
    <aside className="w-full border-r border-emerald-100 bg-white/70 p-4 lg:w-64">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition',
                  isActive
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

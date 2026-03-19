import {
  Bell,
  Boxes,
  ClipboardList,
  FolderKanban,
  Home,
  Package,
  PlusCircle,
  Receipt,
  ShieldCheck,
  Users,
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

import type { UserRole } from '@/types/auth'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Verde Support App'

export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: Home },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Projects', path: '/admin/projects', icon: FolderKanban },
    { label: 'Requests', path: '/admin/requests', icon: ClipboardList },
    { label: 'Orders', path: '/admin/orders', icon: Receipt },
    { label: 'Audit Log', path: '/admin/audit', icon: ShieldCheck },
  ],
  STORE_KEEPER: [
    { label: 'Dashboard', path: '/store-keeper/dashboard', icon: Home },
    { label: 'Requests', path: '/store-keeper/requests', icon: ClipboardList },
    { label: 'Inventory', path: '/store-keeper/inventory', icon: Boxes },
    { label: 'Orders', path: '/store-keeper/orders', icon: Receipt },
  ],
  EMPLOYEE: [
    { label: 'Dashboard', path: '/employee/dashboard', icon: Home },
    { label: 'New Request', path: '/employee/requests/new', icon: PlusCircle },
    { label: 'My Requests', path: '/employee/requests', icon: ClipboardList },
  ],
}

export const STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  COMPLETED: 'bg-sky-100 text-sky-700',
} as const

export const EVENT_ICON = {
  'new-request': Bell,
  'stock-updated': Boxes,
  'request-status-changed': ClipboardList,
} as const

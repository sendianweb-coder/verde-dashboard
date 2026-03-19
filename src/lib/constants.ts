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

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-badge-pending-bg', text: 'text-badge-pending-text' },
  APPROVED: { bg: 'bg-badge-approved-bg', text: 'text-badge-approved-text' },
  REJECTED: { bg: 'bg-badge-rejected-bg', text: 'text-badge-rejected-text' },
  COMPLETED: { bg: 'bg-badge-completed-bg', text: 'text-badge-completed-text' },
  PICKED_UP: { bg: 'bg-badge-picked-up-bg', text: 'text-badge-picked-up-text' },
  PROCESSING: { bg: 'bg-badge-processing-bg', text: 'text-badge-processing-text' },
  SHIPPED: { bg: 'bg-badge-shipped-bg', text: 'text-badge-shipped-text' },
  CANCELLED: { bg: 'bg-badge-cancelled-bg', text: 'text-badge-cancelled-text' },
}

export const EVENT_ICON = {
  'new-request': Bell,
  'stock-updated': Boxes,
  'request-status-changed': ClipboardList,
} as const

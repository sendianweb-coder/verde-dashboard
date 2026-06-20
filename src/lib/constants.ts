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
  inactivePaths?: string[]
}

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Verde Support App'

export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: Home },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Projects', path: '/admin/projects', icon: FolderKanban },
    { label: 'New Request', path: '/admin/requests/new', icon: PlusCircle },
    { label: 'Requests', path: '/admin/requests', icon: ClipboardList, inactivePaths: ['/admin/requests/new'] },
    { label: 'Orders', path: '/admin/orders', icon: Receipt },
    { label: 'Audit Log', path: '/admin/audit', icon: ShieldCheck },
  ],
  STORE_KEEPER: [
    { label: 'Dashboard', path: '/store-keeper/dashboard', icon: Home },
    { label: 'Projects', path: '/store-keeper/projects', icon: FolderKanban },
    { label: 'Requests', path: '/store-keeper/requests', icon: ClipboardList },
    { label: 'Products', path: '/store-keeper/inventory', icon: Package },
    { label: 'Orders', path: '/store-keeper/orders', icon: Receipt },
  ],
  EMPLOYEE: [
    { label: 'Dashboard', path: '/employee/dashboard', icon: Home },
    { label: 'Projects', path: '/employee/projects', icon: FolderKanban },
    { label: 'New Request', path: '/employee/requests/new', icon: PlusCircle },
    { label: 'My Requests', path: '/employee/requests', icon: ClipboardList, inactivePaths: ['/employee/requests/new'] },
  ],
}

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-pending-bg', text: 'text-pending-text' },
  APPROVED: { bg: 'bg-approved-bg', text: 'text-approved-text' },
  REJECTED: { bg: 'bg-rejected-bg', text: 'text-rejected-text' },
  COMPLETED: { bg: 'bg-completed-bg', text: 'text-completed-text' },
  PICKED_UP: { bg: 'bg-picked-up-bg', text: 'text-picked-up-text' },
  PROCESSING: { bg: 'bg-processing-bg', text: 'text-processing-text' },
  SHIPPED: { bg: 'bg-shipped-bg', text: 'text-shipped-text' },
  CANCELED: { bg: 'bg-cancelled-bg', text: 'text-cancelled-text' },
  CANCELLED: { bg: 'bg-rejected-bg', text: 'text-cancelled-text' },
}

export const EVENT_ICON = {
  'new-request': Bell,
  'stock-updated': Boxes,
  'request-status-changed': ClipboardList,
} as const

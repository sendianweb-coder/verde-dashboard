export type NotificationType = 'new-request' | 'stock-updated' | 'request-status-changed'

export interface AppNotification {
  id: string
  type: NotificationType
  message: string
  link?: string
  createdAt: string
  read: boolean
}

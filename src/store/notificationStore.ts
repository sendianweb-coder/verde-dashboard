import { create } from 'zustand'

import type { AppNotification } from '@/types/notifications'

interface NotificationStoreState {
  notifications: AppNotification[]
  unreadCount: number
  pushNotification: (notification: AppNotification) => void
  markAllAsRead: () => void
}

export const useNotificationStore = create<NotificationStoreState>((set) => ({
  notifications: [],
  unreadCount: 0,
  pushNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.read ? 0 : 1),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        read: true,
      })),
      unreadCount: 0,
    })),
}))

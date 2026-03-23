import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useNotificationStore } from '@/store/notificationStore'

export function useSSE(enabled: boolean) {
  const queryClient = useQueryClient()
  const pushNotification = useNotificationStore((state) => state.pushNotification)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const base = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '')
    const source = new EventSource(`${base}/events`, { withCredentials: true })

    source.addEventListener('new-request', (event) => {
      pushNotification({
        id: crypto.randomUUID(),
        type: 'new-request',
        message: event.data,
        createdAt: new Date().toISOString(),
        read: false,
      })
      void queryClient.invalidateQueries({ queryKey: ['requests'] })
    })

    source.addEventListener('stock-updated', () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    })

    source.addEventListener('request-status-changed', () => {
      void queryClient.invalidateQueries({ queryKey: ['requests'] })
    })

    source.onerror = () => {
      source.close()
    }

    return () => {
      source.close()
    }
  }, [enabled, pushNotification, queryClient])
}

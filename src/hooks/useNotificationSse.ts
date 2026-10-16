import { useEffect, useRef } from 'react'
import { API_BASE_URL } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore, type BackendNotification } from '@/store/notificationStore'

export function useNotificationSse() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const handleIncomingNotification = useNotificationStore((s) => s.handleIncomingNotification)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (!accessToken || !user) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      return
    }

    let isDisposed = false

    const connect = () => {
      if (isDisposed) return

      try {
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
        }

        const streamUrl = `${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(accessToken)}`
        const es = new EventSource(streamUrl)
        eventSourceRef.current = es

        es.addEventListener('init', (e: MessageEvent) => {
          console.debug('[SSE] Notification stream connected:', e.data)
        })

        es.addEventListener('notification', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data) as BackendNotification
            handleIncomingNotification(data)
          } catch (err) {
            console.error('[SSE] Failed to parse incoming notification:', err)
          }
        })

        es.onerror = () => {
          if (es.readyState === EventSource.CLOSED && !isDisposed) {
            es.close()
            eventSourceRef.current = null
            reconnectTimeoutRef.current = window.setTimeout(() => {
              connect()
            }, 5000)
          }
        }
      } catch (err) {
        console.error('[SSE] Error setting up EventSource:', err)
        if (!isDisposed) {
          reconnectTimeoutRef.current = window.setTimeout(connect, 5000)
        }
      }
    }

    connect()

    return () => {
      isDisposed = true
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current)
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [accessToken, user?.id, handleIncomingNotification])
}

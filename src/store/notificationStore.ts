import { create } from 'zustand'
import { api } from '@/api/client'
import { paths } from '@/routes/paths'
import type { AppNotification, CreateNotificationInput } from '@/types/notification'

const STORAGE_KEY = 'dxmt.notifications'

export interface BackendNotification {
  id: string
  userId: string
  type:
    | 'APPOINTMENT_REMINDER'
    | 'LEAD_DUE'
    | 'DEAL_APPROVAL'
    | 'EMAIL_FAILED'
    | 'LEAD_CREATED'
    | 'LEAD_STAGE_CHANGED'
    | 'CUSTOMER_CREATED'
    | 'DEAL_CREATED'
    | 'DEAL_WON'
    | 'DEAL_LOST'
    | 'SYSTEM_ANNOUNCEMENT'
  title: string
  body: string | null
  refType: 'APPOINTMENT' | 'LEAD' | 'DEAL' | 'CUSTOMER' | null
  refId: string | null
  readAt: string | null
  createdAt: string
}

function toAppNotification(b: BackendNotification): AppNotification {
  const typeMap: Record<string, AppNotification['type']> = {
    APPOINTMENT_REMINDER: 'APPOINTMENT',
    LEAD_DUE: 'CUSTOMER',
    DEAL_APPROVAL: 'DEAL',
    EMAIL_FAILED: 'ALERT',
    LEAD_CREATED: 'CUSTOMER',
    LEAD_STAGE_CHANGED: 'CUSTOMER',
    CUSTOMER_CREATED: 'CUSTOMER',
    DEAL_CREATED: 'DEAL',
    DEAL_WON: 'DEAL',
    DEAL_LOST: 'ALERT',
    SYSTEM_ANNOUNCEMENT: 'SYSTEM',
  }
  const linkMap: Record<string, string> = {
    APPOINTMENT: paths.appointments,
    CUSTOMER: paths.customers,
    DEAL: paths.deals,
    LEAD: paths.leads,
  }
  const isHighPriority = b.type === 'EMAIL_FAILED' || b.type === 'DEAL_WON' || b.type === 'DEAL_LOST'
  return {
    id: b.id,
    title: b.title,
    content: b.body ?? '',
    type: typeMap[b.type] ?? 'SYSTEM',
    priority: isHighPriority ? 'HIGH' : 'NORMAL',
    target: 'ALL',
    senderName: 'Hệ thống CRM',
    createdAt: b.createdAt,
    read: Boolean(b.readAt),
    link: b.refType ? (b.refId ? `${linkMap[b.refType] ?? ''}/${b.refId}` : linkMap[b.refType]) : undefined,
  }
}

const DEFAULT_NOTIFS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Hợp đồng đặt cọc mới #HD-2026-88',
    content: 'Khách hàng Nguyễn Văn Tuấn đã ký thỏa thuận đặt cọc căn B2-14 dự án Regal Victoria.',
    type: 'DEAL',
    priority: 'HIGH',
    target: 'ALL',
    senderName: 'Lê Hoàng Nam (Quản lý)',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    read: false,
    link: '/deals',
  },
  {
    id: 'notif-2',
    title: 'Nhắc lịch hẹn tư vấn dự án',
    content: 'Lịch hẹn tư vấn dự án One World Regency lúc 14:30 hôm nay với khách hàng Lê Thị Hoa.',
    type: 'APPOINTMENT',
    priority: 'NORMAL',
    target: 'SALES',
    senderName: 'Hệ thống tự động',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: false,
    link: '/appointments',
  },
  {
    id: 'notif-3',
    title: 'Khách hàng mới được phân bổ',
    content: 'Bạn vừa được chỉ định phụ trách lead mới: Trần Đình Phong - Quan tâm Regal Maison.',
    type: 'CUSTOMER',
    priority: 'NORMAL',
    target: 'SALES',
    senderName: 'Nguyễn Thu Trang (Trưởng nhóm)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: true,
    link: '/customers',
  },
  {
    id: 'notif-4',
    title: 'Thông báo bảo trì hệ thống CRM',
    content: 'Hệ thống CRM sẽ bảo trì nâng cấp máy chủ vào lúc 00:00 - 02:00 Chủ Nhật tuần này.',
    type: 'SYSTEM',
    priority: 'LOW',
    target: 'ALL',
    senderName: 'Bộ phận IT Admin',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
  },
]

function loadStored(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFS))
      return DEFAULT_NOTIFS
    }
    return JSON.parse(raw) as AppNotification[]
  } catch {
    return DEFAULT_NOTIFS
  }
}

export interface ToastItem {
  id: string
  notification: AppNotification
  isLeaving?: boolean
}

export interface PublishEventInput {
  type: BackendNotification['type']
  title: string
  body?: string
  refType?: 'APPOINTMENT' | 'LEAD' | 'DEAL' | 'CUSTOMER'
  refId?: string
  targetUserId?: string
  broadcastToManagersAndAdmins?: boolean
  targetScope?: 'ALL' | 'SALES' | 'MANAGER' | 'ADMIN' | string
  excludeActor?: boolean
}

interface NotificationState {
  notifications: AppNotification[]
  activeToasts: ToastItem[]
  fetchNotifications: () => Promise<void>
  handleIncomingNotification: (backendNotif: BackendNotification) => void
  sendNotification: (input: CreateNotificationInput, senderName?: string) => Promise<AppNotification>
  publishEvent: (input: PublishEventInput) => Promise<void>
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
  triggerToast: (notification: AppNotification) => void
  dismissToast: (toastId: string) => void
}

let channel: BroadcastChannel | null = null
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel('dxmt_notifications_sync')
  } catch {}
}

export const useNotificationStore = create<NotificationState>((set, get) => {
  if (channel) {
    channel.onmessage = (event) => {
      if (event.data?.type === 'NEW_NOTIFICATION') {
        const notif: AppNotification = event.data.notification
        set((s) => ({ notifications: [notif, ...s.notifications.filter((n) => n.id !== notif.id)] }))
        get().triggerToast(notif)
      } else if (event.data?.type === 'MARK_READ') {
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === event.data.id ? { ...n, read: true } : n)) }))
      } else if (event.data?.type === 'MARK_ALL_READ') {
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }))
      }
    }
  }

  return {
    notifications: loadStored(),
    activeToasts: [],

    fetchNotifications: async () => {
      try {
        const res = await api.get<{ content: BackendNotification[] }>('/notifications', { params: { size: 50, sort: 'createdAt,desc' } })
        if (res.data?.content && Array.isArray(res.data.content)) {
          const list = res.data.content.map(toAppNotification)
          set({ notifications: list })
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
        }
      } catch {}
    },

    handleIncomingNotification: (backendNotif: BackendNotification) => {
      const notif = toAppNotification(backendNotif)
      set((s) => {
        if (s.notifications.some((n) => n.id === notif.id)) return s
        const updated = [notif, ...s.notifications]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        return { notifications: updated }
      })
      channel?.postMessage({ type: 'NEW_NOTIFICATION', notification: notif })
      get().triggerToast(notif)
    },

    sendNotification: async (input, senderName = 'Ban Quản Trị') => {
      const typeToBackend: Record<string, BackendNotification['type']> = {
        APPOINTMENT: 'APPOINTMENT_REMINDER',
        DEAL: 'DEAL_APPROVAL',
        CUSTOMER: 'LEAD_DUE',
        ALERT: 'EMAIL_FAILED',
        SYSTEM: 'SYSTEM_ANNOUNCEMENT',
      }

      let createdId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      try {
        const res = await api.post<BackendNotification[]>('/notifications/events', {
          type: typeToBackend[input.type] ?? 'SYSTEM_ANNOUNCEMENT',
          title: input.title,
          body: input.content,
          targetScope: input.target ?? 'ALL',
          excludeActor: true,
        })
        if (Array.isArray(res.data) && res.data.length > 0) {
          createdId = res.data[0].id
        }
      } catch (err) {
        console.warn('Lỗi khi phát thông báo:', err)
      }

      const newNotif: AppNotification = {
        id: createdId,
        title: input.title,
        content: input.content,
        type: input.type,
        priority: input.priority,
        target: input.target,
        link: input.link,
        senderName,
        createdAt: new Date().toISOString(),
        read: true,
      }

      set((s) => {
        const updated = [newNotif, ...s.notifications]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        return { notifications: updated }
      })

      return newNotif
    },

    publishEvent: async (input: PublishEventInput) => {
      try {
        await api.post('/notifications/events', input)
        // Backend phát SSE realtime cho Admin, Manager và Sale liên quan (loại trừ người thao tác hiện tại)
      } catch (err) {
        console.warn('Lỗi khi phát sự kiện thông báo:', err)
      }
    },

    triggerToast: (notification) => {
      const toastId = `toast_${notification.id}_${Date.now()}`
      set((s) => ({ activeToasts: [...s.activeToasts.slice(-2), { id: toastId, notification }] }))

      setTimeout(() => {
        get().dismissToast(toastId)
      }, 4500)
    },

    dismissToast: (toastId) => {
      set((s) => ({
        activeToasts: s.activeToasts.map((t) => (t.id === toastId ? { ...t, isLeaving: true } : t)),
      }))
      setTimeout(() => {
        set((s) => ({ activeToasts: s.activeToasts.filter((t) => t.id !== toastId) }))
      }, 350)
    },

    markAsRead: (id) => {
      set((s) => {
        const updated = s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        return { notifications: updated }
      })
      api.patch(`/notifications/${id}/read`).catch(() => {})
      channel?.postMessage({ type: 'MARK_READ', id })
    },

    markAllAsRead: () => {
      set((s) => {
        const updated = s.notifications.map((n) => ({ ...n, read: true }))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        return { notifications: updated }
      })
      api.post('/notifications/read-all').catch(() => {})
      channel?.postMessage({ type: 'MARK_ALL_READ' })
    },

    deleteNotification: (id) => {
      set((s) => {
        const updated = s.notifications.filter((n) => n.id !== id)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        return { notifications: updated }
      })
      api.delete(`/notifications/${id}`).catch(() => {})
    },

    clearAll: () => {
      set(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
        return { notifications: [] }
      })
    },
  }
})

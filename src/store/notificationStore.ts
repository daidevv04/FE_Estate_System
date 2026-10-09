import { create } from 'zustand'
import type { AppNotification, CreateNotificationInput } from '@/types/notification'

const STORAGE_KEY = 'dxmt.notifications'

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

interface NotificationState {
  notifications: AppNotification[]
  activeToasts: ToastItem[]
  sendNotification: (input: CreateNotificationInput, senderName?: string) => AppNotification
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
  } catch {
    /* fallback */
  }
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

    sendNotification: (input, senderName = 'Ban Quản Trị') => {
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: input.title,
        content: input.content,
        type: input.type,
        priority: input.priority,
        target: input.target,
        link: input.link,
        senderName,
        createdAt: new Date().toISOString(),
        read: false,
      }

      set((s) => {
        const updated = [newNotif, ...s.notifications]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        return { notifications: updated }
      })

      channel?.postMessage({ type: 'NEW_NOTIFICATION', notification: newNotif })
      get().triggerToast(newNotif)
      return newNotif
    },

    triggerToast: (notification) => {
      const toastId = `toast_${notification.id}_${Date.now()}`
      set((s) => ({ activeToasts: [...s.activeToasts.slice(-2), { id: toastId, notification }] }))

      setTimeout(() => {
        get().dismissToast(toastId)
      }, 2600)
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
      channel?.postMessage({ type: 'MARK_READ', id })
    },

    markAllAsRead: () => {
      set((s) => {
        const updated = s.notifications.map((n) => ({ ...n, read: true }))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        return { notifications: updated }
      })
      channel?.postMessage({ type: 'MARK_ALL_READ' })
    },

    deleteNotification: (id) => {
      set((s) => {
        const updated = s.notifications.filter((n) => n.id !== id)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        return { notifications: updated }
      })
    },

    clearAll: () => {
      set(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
        return { notifications: [] }
      })
    },
  }
})

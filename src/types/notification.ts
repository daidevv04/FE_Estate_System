export type NotificationType = 'SYSTEM' | 'DEAL' | 'CUSTOMER' | 'APPOINTMENT' | 'ALERT'
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
export type NotificationTarget = 'ALL' | 'ADMIN' | 'MANAGER' | 'SALES'

export interface AppNotification {
  id: string
  title: string
  content: string
  type: NotificationType
  priority: NotificationPriority
  target: NotificationTarget
  senderName: string
  senderRole?: string
  createdAt: string
  read: boolean
  link?: string
}

export interface CreateNotificationInput {
  title: string
  content: string
  type: NotificationType
  priority: NotificationPriority
  target: NotificationTarget
  link?: string
}

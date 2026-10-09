import {
  CalendarOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotificationStore, type ToastItem } from '@/store/notificationStore'
import type { NotificationType } from '@/types/notification'
import './NotificationToastContainer.css'

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  SYSTEM: <InfoCircleOutlined />,
  DEAL: <FileTextOutlined />,
  CUSTOMER: <UserOutlined />,
  APPOINTMENT: <CalendarOutlined />,
  ALERT: <ExclamationCircleOutlined />,
}

function playDing() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12) // A5
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  } catch {
    /* audio play blocked or unsupported */
  }
}

export function NotificationToastContainer() {
  const navigate = useNavigate()
  const activeToasts = useNotificationStore((s) => s.activeToasts)
  const dismissToast = useNotificationStore((s) => s.dismissToast)
  const markAsRead = useNotificationStore((s) => s.markAsRead)

  // Play subtle chime when a new toast appears
  useEffect(() => {
    if (activeToasts.length > 0 && !activeToasts[activeToasts.length - 1].isLeaving) {
      playDing()
    }
  }, [activeToasts.length])

  if (activeToasts.length === 0) return null

  const handleCardClick = (toast: ToastItem) => {
    markAsRead(toast.notification.id)
    dismissToast(toast.id)
    if (toast.notification.link) {
      navigate(toast.notification.link)
    }
  }

  return (
    <div className="notif-toast-container" aria-live="polite">
      {activeToasts.map((toast) => {
        const notif = toast.notification
        return (
          <div
            key={toast.id}
            role="alert"
            className={`notif-toast-card notif-toast-card--${notif.type}${toast.isLeaving ? ' is-leaving' : ''}`}
            onClick={() => handleCardClick(toast)}
          >
            <div className={`notif-toast-icon notif-toast-icon--${notif.type}`}>
              {TYPE_ICONS[notif.type] ?? <InfoCircleOutlined />}
            </div>
            <div className="notif-toast-body">
              <div className="notif-toast-header">
                <span className="notif-toast-title">{notif.title}</span>
                <span
                  className="notif-toast-close"
                  onClick={(e) => {
                    e.stopPropagation()
                    dismissToast(toast.id)
                  }}
                  title="Đóng thông báo"
                >
                  <CloseOutlined />
                </span>
              </div>
              <div className="notif-toast-desc">{notif.content}</div>
              <div className="notif-toast-meta">
                <span>{notif.senderName}</span>
                <span>•</span>
                <span>Vừa xong</span>
              </div>
            </div>
            <div className="notif-toast-progress" />
          </div>
        )
      })}
    </div>
  )
}

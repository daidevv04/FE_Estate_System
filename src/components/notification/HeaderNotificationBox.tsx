import {
  BellOutlined,
  CalendarOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Badge, Button, Empty, Popover, Tag } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { paths } from '@/routes/paths'
import { useNotificationStore } from '@/store/notificationStore'
import type { AppNotification, NotificationType } from '@/types/notification'
import './HeaderNotificationBox.css'

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  SYSTEM: <InfoCircleOutlined />,
  DEAL: <FileTextOutlined />,
  CUSTOMER: <UserOutlined />,
  APPOINTMENT: <CalendarOutlined />,
  ALERT: <ExclamationCircleOutlined />,
}

function timeAgo(dateStr: string): string {
  const d = dayjs(dateStr)
  const now = dayjs()
  const diffSec = now.diff(d, 'second')
  if (diffSec < 60) return 'Vừa xong'
  const diffMin = now.diff(d, 'minute')
  if (diffMin < 60) return `${diffMin} phút trước`
  const diffHour = now.diff(d, 'hour')
  if (diffHour < 24) return `${diffHour} giờ trước`
  const diffDay = now.diff(d, 'day')
  if (diffDay < 2) return 'Hôm qua'
  if (diffDay < 7) return `${diffDay} ngày trước`
  return d.format('DD/MM/YYYY')
}

export function HeaderNotificationBox() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'all' | 'unread'>('all')

  const notifications = useNotificationStore((s) => s.notifications)
  const markAsRead = useNotificationStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead)

  const unreadCount = notifications.filter((n) => !n.read).length
  const displayedList = tab === 'unread' ? notifications.filter((n) => !n.read) : notifications

  const handleItemClick = (notif: AppNotification) => {
    markAsRead(notif.id)
    setOpen(false)
    if (notif.link) {
      navigate(notif.link)
    }
  }

  const content = (
    <div className="header-notif-panel">
      <div className="header-notif-head">
        <div className="header-notif-head-title">
          <span>Thông báo</span>
          {unreadCount > 0 && <Tag color="blue">{unreadCount} mới</Tag>}
        </div>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => markAllAsRead()}
            style={{ padding: 0, fontSize: 12 }}
          >
            Đọc tất cả
          </Button>
        )}
      </div>

      <div className="header-notif-tabs">
        <button
          type="button"
          className={`header-notif-tab-btn ${tab === 'all' ? 'is-active' : ''}`}
          onClick={() => setTab('all')}
        >
          Tất cả ({notifications.length})
        </button>
        <button
          type="button"
          className={`header-notif-tab-btn ${tab === 'unread' ? 'is-active' : ''}`}
          onClick={() => setTab('unread')}
        >
          Chưa đọc ({unreadCount})
        </button>
      </div>

      <div className="header-notif-list">
        {displayedList.length === 0 ? (
          <div style={{ padding: '32px 16px' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={tab === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
            />
          </div>
        ) : (
          displayedList.map((notif) => (
            <div
              key={notif.id}
              className={`header-notif-item ${!notif.read ? 'is-unread' : ''}`}
              onClick={() => handleItemClick(notif)}
            >
              <div className={`header-notif-item-icon header-notif-item-icon--${notif.type}`}>
                {TYPE_ICONS[notif.type] ?? <InfoCircleOutlined />}
              </div>
              <div className="header-notif-item-content">
                <div className="header-notif-item-title">{notif.title}</div>
                <div className="header-notif-item-text">{notif.content}</div>
                <div className="header-notif-item-time">{timeAgo(notif.createdAt)}</div>
              </div>
              {!notif.read && <div className="header-notif-unread-dot" />}
            </div>
          ))
        )}
      </div>

      <div className="header-notif-foot">
        <Button
          type="link"
          block
          size="small"
          onClick={() => {
            setOpen(false)
            navigate(paths.notifications)
          }}
        >
          Xem tất cả & Quản lý thông báo →
        </Button>
      </div>
    </div>
  )

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      overlayClassName="header-notif-popover"
      arrow={false}
    >
      <Badge count={unreadCount} size="small" overflowCount={99}>
        <Button
          type="text"
          aria-label="Thông báo"
          icon={<BellOutlined style={{ fontSize: 18 }} />}
          style={{ width: 36, height: 36, display: 'grid', placeItems: 'center' }}
        />
      </Badge>
    </Popover>
  )
}

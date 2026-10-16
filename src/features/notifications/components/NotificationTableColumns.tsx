import {
  AlertOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { StatusPill, type Tone } from '@/components/common/StatusPill'
import type { AppNotification, NotificationPriority, NotificationType } from '@/types/notification'

export const TYPE_CONFIG: Record<NotificationType, { label: string; tone: Tone; icon: React.ReactNode }> = {
  SYSTEM: { label: 'Hệ thống', tone: 'blue', icon: <InfoCircleOutlined /> },
  DEAL: { label: 'Hợp đồng', tone: 'green', icon: <FileTextOutlined /> },
  CUSTOMER: { label: 'Khách hàng', tone: 'teal', icon: <UserOutlined /> },
  APPOINTMENT: { label: 'Lịch hẹn', tone: 'purple', icon: <CalendarOutlined /> },
  ALERT: { label: 'Khẩn cấp', tone: 'red', icon: <ExclamationCircleOutlined /> },
}

export const PRIORITY_CONFIG: Record<NotificationPriority, { label: string; tone: Tone }> = {
  LOW: { label: 'Thấp', tone: 'gray' },
  NORMAL: { label: 'Thông thường', tone: 'blue' },
  HIGH: { label: 'Quan trọng', tone: 'amber' },
  URGENT: { label: 'Khẩn cấp', tone: 'red' },
}

interface ColumnProps {
  onSelect?: (r: AppNotification) => void
}

export function buildNotificationColumns({ onSelect }: ColumnProps = {}): ColumnsType<AppNotification> {
  return [
    {
      title: (
        <span>
          <AppstoreOutlined style={{ marginRight: 6, color: '#059669' }} />
          Loại
        </span>
      ),
      dataIndex: 'type',
      width: 140,
      render: (t: NotificationType) => {
        const c = TYPE_CONFIG[t] ?? TYPE_CONFIG.SYSTEM
        return <StatusPill tone={c.tone} icon={c.icon} size="sm">{c.label}</StatusPill>
      },
    },
    {
      title: (
        <span>
          <FileTextOutlined style={{ marginRight: 6, color: '#059669' }} />
          Tiêu đề & Nội dung
        </span>
      ),
      dataIndex: 'title',
      render: (_, r) => (
        <div
          style={{ lineHeight: 1.45, cursor: 'pointer' }}
          onClick={() => onSelect?.(r)}
        >
          <div className="notif-item-row-title" style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
            {!r.read && <span style={{ color: '#059669', marginRight: 6, fontSize: 10 }}>●</span>}
            {r.title}
          </div>
          <div
            className="notif-item-row-desc"
            style={{
              fontSize: 12,
              color: '#64748b',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 480,
            }}
          >
            {r.content}
          </div>
        </div>
      ),
    },
    {
      title: (
        <span>
          <AlertOutlined style={{ marginRight: 6, color: '#059669' }} />
          Mức độ
        </span>
      ),
      dataIndex: 'priority',
      width: 130,
      render: (p: NotificationPriority) => {
        const c = PRIORITY_CONFIG[p] ?? PRIORITY_CONFIG.NORMAL
        return <StatusPill tone={c.tone} size="sm">{c.label}</StatusPill>
      },
    },
    {
      title: (
        <span>
          <UserOutlined style={{ marginRight: 6, color: '#059669' }} />
          Người gửi
        </span>
      ),
      dataIndex: 'senderName',
      width: 150,
      render: (v: string) => (
        <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>
          {v || 'Hệ thống CRM'}
        </span>
      ),
    },
    {
      title: (
        <span>
          <ClockCircleOutlined style={{ marginRight: 6, color: '#059669' }} />
          Thời gian
        </span>
      ),
      dataIndex: 'createdAt',
      width: 140,
      render: (v) => {
        const d = dayjs(v)
        return (
          <div style={{ lineHeight: 1.35, fontSize: 13, color: '#475569' }} className="stitch-num">
            <div>{d.format('DD/MM/YYYY')}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{d.format('HH:mm')}</div>
          </div>
        )
      },
    },
    {
      title: (
        <span>
          <SafetyCertificateOutlined style={{ marginRight: 6, color: '#059669' }} />
          Trạng thái
        </span>
      ),
      dataIndex: 'read',
      width: 120,
      render: (read: boolean) =>
        read ? (
          <StatusPill tone="gray" size="sm">Đã đọc</StatusPill>
        ) : (
          <StatusPill tone="blue" size="sm">Chưa đọc</StatusPill>
        ),
    },
  ]
}

import {
  CalendarOutlined,
  CheckOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Popconfirm, Space, Tooltip } from 'antd'
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
  onSelect: (r: AppNotification) => void
  onToggleRead: (id: string) => void
  onDelete: (id: string) => void
}

export function buildNotificationColumns({ onSelect, onToggleRead, onDelete }: ColumnProps): ColumnsType<AppNotification> {
  return [
    {
      title: 'Loại',
      dataIndex: 'type',
      width: 130,
      render: (t: NotificationType) => {
        const c = TYPE_CONFIG[t] ?? TYPE_CONFIG.SYSTEM
        return <StatusPill tone={c.tone} icon={c.icon} size="sm">{c.label}</StatusPill>
      },
    },
    {
      title: 'Tiêu đề & Nội dung',
      dataIndex: 'title',
      render: (_, r) => (
        <div style={{ cursor: 'pointer' }} onClick={() => onSelect(r)}>
          <div className="notif-item-row-title">
            {!r.read && <span style={{ color: '#1677ff', marginRight: 6 }}>●</span>}
            {r.title}
          </div>
          <div className="notif-item-row-desc">{r.content}</div>
        </div>
      ),
    },
    {
      title: 'Mức độ',
      dataIndex: 'priority',
      width: 120,
      render: (p: NotificationPriority) => {
        const c = PRIORITY_CONFIG[p] ?? PRIORITY_CONFIG.NORMAL
        return <StatusPill tone={c.tone} size="sm">{c.label}</StatusPill>
      },
    },
    { title: 'Người gửi', dataIndex: 'senderName', width: 160 },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      width: 150,
      render: (v) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'read',
      width: 110,
      render: (read: boolean) => read ? <StatusPill tone="gray" size="sm">Đã đọc</StatusPill> : <StatusPill tone="blue" size="sm">Chưa đọc</StatusPill>,
    },
    {
      title: 'Thao tác',
      width: 120,
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Xem">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => onSelect(r)} />
          </Tooltip>
          <Tooltip title={r.read ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}>
            <Button type="text" size="small" icon={<CheckOutlined />} onClick={() => onToggleRead(r.id)} />
          </Tooltip>
          <Popconfirm title="Xóa thông báo này?" onConfirm={() => onDelete(r.id)}>
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]
}

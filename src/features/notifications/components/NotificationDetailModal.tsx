import { Button, Modal, Space, Tag } from 'antd'
import dayjs from 'dayjs'
import type { AppNotification } from '@/types/notification'

interface Props {
  notif: AppNotification | null
  onClose: () => void
}

const TYPE_COLORS: Record<string, string> = {
  SYSTEM: 'blue',
  DEAL: 'green',
  CUSTOMER: 'cyan',
  APPOINTMENT: 'gold',
  ALERT: 'red',
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'default',
  NORMAL: 'processing',
  HIGH: 'warning',
  URGENT: 'error',
}

export function NotificationDetailModal({ notif, onClose }: Props) {
  if (!notif) return null

  return (
    <Modal
      title={notif.title}
      open={Boolean(notif)}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Đóng
        </Button>,
      ]}
    >
      <Space wrap style={{ marginBottom: 12, marginTop: 8 }}>
        <Tag color={TYPE_COLORS[notif.type] || 'blue'}>{notif.type}</Tag>
        <Tag color={PRIORITY_COLORS[notif.priority] || 'default'}>{notif.priority}</Tag>
        <span style={{ fontSize: 12, color: '#64748b' }}>
          Người gửi: <b>{notif.senderName}</b>
        </span>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          • {dayjs(notif.createdAt).format('DD/MM/YYYY HH:mm')}
        </span>
      </Space>

      <div className="notif-modal-detail-content">{notif.content}</div>

      {notif.link && (
        <div style={{ marginTop: 16 }}>
          <Button type="link" href={notif.link} style={{ padding: 0 }}>
            Truy cập liên kết đính kèm ({notif.link}) →
          </Button>
        </div>
      )}
    </Modal>
  )
}

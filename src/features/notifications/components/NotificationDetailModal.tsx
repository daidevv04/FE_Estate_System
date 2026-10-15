import { Button, Modal, Space } from 'antd'
import dayjs from 'dayjs'
import { StatusPill, type Tone } from '@/components/common/StatusPill'
import type { AppNotification } from '@/types/notification'

interface Props {
  notif: AppNotification | null
  onClose: () => void
}

const TYPE_TONES: Record<string, Tone> = {
  SYSTEM: 'blue',
  DEAL: 'green',
  CUSTOMER: 'teal',
  APPOINTMENT: 'purple',
  ALERT: 'red',
}

const PRIORITY_TONES: Record<string, Tone> = {
  LOW: 'gray',
  NORMAL: 'blue',
  HIGH: 'amber',
  URGENT: 'red',
}

export function NotificationDetailModal({ notif, onClose }: Props) {
  if (!notif) return null

  return (
    <Modal
      title={notif.title}
      open={Boolean(notif)}
      centered
      destroyOnHidden
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Đóng
        </Button>,
      ]}
    >
      <Space wrap style={{ marginBottom: 12, marginTop: 8 }}>
        <StatusPill tone={TYPE_TONES[notif.type] || 'blue'} size="sm">{notif.type}</StatusPill>
        <StatusPill tone={PRIORITY_TONES[notif.priority] || 'gray'} size="sm">{notif.priority}</StatusPill>
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

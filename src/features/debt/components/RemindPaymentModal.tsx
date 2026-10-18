import { BellOutlined, MailOutlined, SendOutlined } from '@ant-design/icons'
import { Alert, Button, Descriptions, Input, Modal, Space, Typography } from 'antd'
import { useState } from 'react'
import { formatDate, formatMoney } from '@/lib/format'
import type { DebtAgingItem } from '../api'

interface Props {
  open: boolean
  item: DebtAgingItem | null
  customerName?: string
  customerPhone?: string
  salesName?: string
  salesEmail?: string
  submitting?: boolean
  onClose: () => void
  onSubmit: (note: string) => void
}

export function RemindPaymentModal({
  open,
  item,
  customerName = 'Khách hàng',
  customerPhone = '—',
  salesName = 'Sales phụ trách',
  salesEmail = '—',
  submitting = false,
  onClose,
  onSubmit,
}: Props) {
  const [note, setNote] = useState('')

  if (!item) return null

  const isOverdue = item.agingBucket !== 'DUE_SOON'
  const timeDesc = isOverdue
    ? `Đã quá hạn ${item.daysDiff} ngày`
    : `Còn ${item.daysDiff} ngày nữa đến hạn`

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Space>
          <BellOutlined style={{ color: '#059669' }} />
          <span>Gửi Thông Báo & Email Nhắc Nộp Tiền</span>
        </Space>
      }
      centered
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onClose} disabled={submitting}>
          Đóng
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SendOutlined />}
          loading={submitting}
          style={{ background: '#059669', borderColor: '#059669' }}
          onClick={() => onSubmit(note)}
        >
          Xác nhận gửi thông báo
        </Button>,
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
        <Alert
          message={
            <div>
              <strong>Kênh kích hoạt:</strong> Bắn thông báo In-app realtime (SSE) cho Sales và Quản lý + gửi Email chi tiết lịch nộp tiền.
            </div>
          }
          type="info"
          showIcon
          icon={<MailOutlined />}
        />

        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Mã hợp đồng">
            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.contractCode}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Khách hàng">
            {customerName} · <span className="stitch-num">{customerPhone}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Căn hộ / Dự án">
            <strong>{item.productCode}</strong> ({item.projectName})
          </Descriptions.Item>
          <Descriptions.Item label="Đợt nộp tiền">
            {item.installmentName}
          </Descriptions.Item>
          <Descriptions.Item label="Số tiền phải thu">
            <span className="stitch-num" style={{ fontWeight: 700, color: '#dc2626', fontSize: 14 }}>
              {formatMoney(item.amountRemaining)}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Hạn nộp thanh toán">
            {formatDate(item.dueDate)} — <Typography.Text type={isOverdue ? 'danger' : 'warning'}>{timeDesc}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Sales phụ trách">
            {salesName} ({salesEmail})
          </Descriptions.Item>
        </Descriptions>

        <div>
          <Typography.Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
            Ghi chú đính kèm thông báo (tùy chọn):
          </Typography.Text>
          <Input.TextArea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: Khách hàng hẹn thanh toán qua Vietcombank trong ngày..."
          />
        </div>
      </div>
    </Modal>
  )
}

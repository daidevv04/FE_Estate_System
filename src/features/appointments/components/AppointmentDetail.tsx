import { CalendarOutlined, ClockCircleOutlined, LinkOutlined, UserOutlined } from '@ant-design/icons'
import { Descriptions, Space, Typography } from 'antd'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import { paths } from '@/routes/paths'
import { tokens as t } from '@/theme/tokens'
import { appointmentCode, eventColor, reminderLabel, type Appointment } from '../api'
import { StatusPill, isOverdue } from './AppointmentStatusPill'

interface Props {
  appointment: Appointment
  customerName: string
  salesName: string
}

/** Nội dung chi tiết lịch hẹn (mục 9.11) — dùng chung cho modal trong danh sách và trang deep link */
export function AppointmentDetail({ appointment: a, customerName, salesName }: Props) {
  const start = dayjs(a.startTime)
  const end = dayjs(a.endTime)
  const minutes = Math.max(0, end.diff(start, 'minute'))
  const duration = minutes >= 60 ? `${Math.floor(minutes / 60)} giờ${minutes % 60 ? ` ${minutes % 60} phút` : ''}` : `${minutes} phút`

  return (
    <div>
      <Space align="start" size={12} style={{ justifyContent: 'space-between', width: '100%' }} wrap>
        <Typography.Title level={5} style={{ margin: 0 }}>{a.title}</Typography.Title>
        <StatusPill status={a.status} overdue={isOverdue(a.status, a.endTime)} />
      </Space>
      <div className="stitch-num" style={{ fontSize: 12.5, color: t.colorTextMuted, margin: '4px 0 16px' }}>
        {appointmentCode(a)}
      </div>

      <div
        className="stitch-panel"
        style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}
      >
        <span style={{
          width: 32, height: 32, borderRadius: t.radiusMd, display: 'grid', placeItems: 'center',
          background: t.colorBrandBg, color: t.colorBrand,
        }}>
          <ClockCircleOutlined />
        </span>
        <div style={{ lineHeight: 1.35 }}>
          <div className="stitch-num" style={{ fontWeight: 600 }}>
            {start.format('DD/MM/YYYY HH:mm')} → {end.format('HH:mm')}
          </div>
          <div style={{ fontSize: 12.5, color: t.colorTextMuted }}>
            {start.format('dddd')} · {duration}
          </div>
        </div>
      </div>

      <Descriptions column={1} size="small" labelStyle={{ width: 150, color: t.colorTextMuted }} colon={false}>
        <Descriptions.Item label={<Space size={6}><UserOutlined />Khách hàng</Space>}>
          <Link to={paths.customer(a.customerId)}>{customerName}</Link>
        </Descriptions.Item>
        <Descriptions.Item label={<Space size={6}><UserOutlined />Nhân viên phụ trách</Space>}>
          {salesName}
        </Descriptions.Item>
        <Descriptions.Item label={<Space size={6}><CalendarOutlined />Nhắc trước</Space>}>
          {reminderLabel(a.reminderMinutes)}
        </Descriptions.Item>
        <Descriptions.Item label={<Space size={6}><LinkOutlined />Màu lịch</Space>}>
          <Space size={8}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: eventColor(a.color), display: 'inline-block' }} />
            <span className="stitch-num">{a.color ?? 'Mặc định'}</span>
          </Space>
        </Descriptions.Item>
      </Descriptions>

      <div style={{ fontSize: 12.5, color: t.colorTextMuted }}>
        Backend chỉ lưu lịch hẹn, không lưu nhật ký sửa đổi — chi tiết này không hiển thị lịch sử chỉnh sửa.
      </div>
    </div>
  )
}

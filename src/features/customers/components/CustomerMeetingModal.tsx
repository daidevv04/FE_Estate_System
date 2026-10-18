import { useEffect, useState } from 'react'
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd'
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { apiErrorMessage, useCustomers, type Customer } from '../api'

interface Props {
  open: boolean
  customer: Customer | null
  initialDateTime?: dayjs.Dayjs | null
  onClose: () => void
  onSuccess?: () => void
}

interface MeetingFormValues {
  customerId?: string
  meetingTime: dayjs.Dayjs
  location: string
  purpose: string
  note?: string
}

const LOCATION_PRESETS = [
  'Văn phòng Hội sở Đất Xanh Miền Trung',
  'Nhà mẫu dự án Regal Complex',
  'Thực địa dự án / Vị trí lô đất thực tế',
  'Quán Cà phê (Gần địa chỉ khách)',
  'Tại văn phòng / Nhà riêng của khách',
]

const PURPOSE_PRESETS = [
  'Tư vấn trực tiếp bảng giá & chính sách chiết khấu',
  'Dẫn khách đi xem thực địa dự án & vị trí lô đất',
  'Hẹn ký kết Hợp đồng đặt cọc / Giữ chỗ',
  'Ký Hợp đồng mua bán (HĐMB) & thủ tục công chứng',
  'Chăm sóc định kỳ & cập nhật tiến độ hạ tầng',
]

export function CustomerMeetingModal({
  open,
  customer,
  initialDateTime,
  onClose,
  onSuccess,
}: Props) {
  const [form] = Form.useForm<MeetingFormValues>()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)

  // Query danh sách khách hàng nếu mở từ Lịch mà chưa chọn trước khách
  const customersQuery = useCustomers()
  const customersList = customersQuery.data?.content ?? []

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        customerId: customer?.id,
        meetingTime: initialDateTime || dayjs().add(1, 'day').hour(9).minute(0).second(0),
        location: LOCATION_PRESETS[0],
        purpose: PURPOSE_PRESETS[0],
        note: '',
      })
    }
  }, [open, customer, initialDateTime, form])

  const qc = useQueryClient()

  const handleSubmit = async (values: MeetingFormValues) => {
    const targetCustomerId = customer?.id || values.customerId
    if (!targetCustomerId) {
      message.error('Vui lòng chọn khách hàng cần hẹn gặp')
      return
    }

    setLoading(true)
    try {
      const timeStr = values.meetingTime.format('DD/MM/YYYY HH:mm')
      const targetCustomerObj = customer || customersList.find((c) => c.id === targetCustomerId)
      const customerName = targetCustomerObj ? targetCustomerObj.fullName : ''

      const formattedContent = `[LỊCH HẸN GẶP - ${timeStr}] [Địa điểm: ${values.location}] - Mục đích: ${values.purpose}${
        values.note ? ` (Ghi chú: ${values.note.trim()})` : ''
      }`.trim()

      const title = `${values.purpose} - ${values.location}`.slice(0, 200)

      // 1. Lưu vào hệ thống Lịch hẹn
      await api.post('/appointments', {
        customerId: targetCustomerId,
        title,
        startTime: values.meetingTime.format('YYYY-MM-DDTHH:mm:ss'),
        endTime: values.meetingTime.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss'),
        color: '#059669',
        reminderMinutes: 30,
        status: 'PENDING',
      })

      // 2. Ghi nhận log chăm sóc khách hàng
      await api.post(`/customers/${targetCustomerId}/cares`, {
        type: 'MEETING',
        content: formattedContent,
      })

      // 3. Làm tươi cả Lịch hẹn và Nhật ký chăm sóc
      await qc.invalidateQueries({ queryKey: ['appointments'] })
      await qc.invalidateQueries({ queryKey: ['customer-cares'] })

      message.success(`Đã đặt lịch hẹn và lưu nhật ký gặp khách hàng ${customerName} thành công!`)
      form.resetFields()
      onSuccess?.()
      onClose()
    } catch (err) {
      message.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      title={
        <Space>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D97706',
            }}
          >
            <CalendarOutlined />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>
            Đặt Lịch Hẹn Gặp Mặt & Lưu Nhật Ký
          </span>
        </Space>
      }
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      centered
      width={600}
    >
      <div style={{ padding: '8px 0' }}>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Lịch hẹn được lưu sẽ tự động đồng bộ vào lịch sử chăm sóc của khách hàng và thời gian biểu của Sales.
        </Typography.Paragraph>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {/* Chọn Khách Hàng (nếu chưa có customer cố định) */}
          {customer ? (
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: 12, color: '#64748B' }}>Khách hàng hẹn gặp:</span>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                  {customer.fullName}
                </div>
              </div>
              <Tag color="blue" style={{ fontWeight: 600 }}>
                {customer.phone || 'Chưa có SĐT'}
              </Tag>
            </div>
          ) : (
            <Form.Item
              name="customerId"
              label={<span style={{ fontWeight: 600 }}>Chọn khách hàng</span>}
              rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
            >
              <Select
                showSearch
                placeholder="Tìm theo tên hoặc số điện thoại..."
                optionFilterProp="label"
                options={customersList.map((c) => ({
                  label: `${c.fullName} - ${c.phone || 'Chưa SĐT'}`,
                  value: c.id,
                }))}
                style={{ width: '100%' }}
              />
            </Form.Item>
          )}

          {/* Thời gian hẹn cụ thể */}
          <Form.Item
            name="meetingTime"
            label={
              <Space>
                <ClockCircleOutlined style={{ color: '#059669' }} />
                <span style={{ fontWeight: 600 }}>Thời gian gặp mặt cụ thể</span>
              </Space>
            }
            rules={[{ required: true, message: 'Vui lòng chọn ngày và giờ hẹn' }]}
          >
            <DatePicker
              showTime={{ format: 'HH:mm' }}
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%' }}
              placeholder="Chọn ngày và giờ cụ thể..."
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          {/* Địa điểm gặp mặt */}
          <Form.Item
            name="location"
            label={
              <Space>
                <EnvironmentOutlined style={{ color: '#D97706' }} />
                <span style={{ fontWeight: 600 }}>Địa điểm gặp mặt</span>
              </Space>
            }
            rules={[{ required: true, message: 'Vui lòng chọn hoặc nhập địa điểm' }]}
          >
            <Select
              options={LOCATION_PRESETS.map((loc) => ({ label: loc, value: loc }))}
              placeholder="Chọn hoặc nhập địa điểm..."
              style={{ width: '100%' }}
            />
          </Form.Item>

          {/* Mục đích cuộc gặp */}
          <Form.Item
            name="purpose"
            label={<span style={{ fontWeight: 600 }}>Mục đích cuộc gặp</span>}
            rules={[{ required: true, message: 'Chọn mục đích cuộc gặp' }]}
          >
            <Select
              options={PURPOSE_PRESETS.map((p) => ({ label: p, value: p }))}
              style={{ width: '100%' }}
            />
          </Form.Item>

          {/* Ghi chú chuẩn bị */}
          <Form.Item
            name="note"
            label={<span style={{ fontWeight: 600 }}>Ghi chú chuẩn bị hồ sơ / tài liệu</span>}
          >
            <Input.TextArea
              rows={2}
              placeholder="Ví dụ: Chuẩn bị 02 bộ hợp đồng cọc căn LK-02, bảng tính chiết khấu thanh toán sớm 95%..."
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Button onClick={onClose} style={{ borderRadius: 8 }}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              style={{ background: '#059669', borderColor: '#059669', borderRadius: 8, fontWeight: 600 }}
            >
              Lưu lịch hẹn & Ghi nhật ký
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  )
}

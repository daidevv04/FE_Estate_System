import { useEffect, useState } from 'react'
import {
  Alert,
  App,
  Button,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Tag,
} from 'antd'
import {
  CopyOutlined,
  MobileOutlined,
  PhoneOutlined,
  SaveOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { isMobileDevice } from '@/lib/device'
import { apiErrorMessage, type Customer } from '../api'

interface Props {
  open: boolean
  customer: Customer | null
  onClose: () => void
  onSuccess?: () => void
}

interface CallFormValues {
  result: 'CONNECTED' | 'NO_ANSWER' | 'BUSY' | 'CALLBACK_REQUESTED' | 'WRONG_NUMBER'
  duration: string
  content: string
}

const RESULT_OPTIONS = [
  { label: 'Đã trao đổi (Khách nghe máy)', value: 'CONNECTED', color: '#059669' },
  { label: 'Không nghe máy / Đổ chuông', value: 'NO_ANSWER', color: '#D97706' },
  { label: 'Máy bận / Thuê bao', value: 'BUSY', color: '#EF4444' },
  { label: 'Khách hẹn gọi lại sau', value: 'CALLBACK_REQUESTED', color: '#2563EB' },
  { label: 'Sai số / Nhầm số', value: 'WRONG_NUMBER', color: '#64748B' },
]

export function QuickCallActionModal({ open, customer, onClose, onSuccess }: Props) {
  const qc = useQueryClient()
  const [form] = Form.useForm<CallFormValues>()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const isMobile = isMobileDevice()

  useEffect(() => {
    if (open && customer?.phone) {
      setCopied(false)
      form.setFieldsValue({
        result: 'CONNECTED',
        duration: '1-3 phút',
        content: '',
      })

      // Nếu là điện thoại thật: tự động kích hoạt cuộc gọi quay số của hệ điều hành
      if (isMobile) {
        window.location.href = `tel:${customer.phone.replace(/\s+/g, '')}`
      }
    }
  }, [open, customer, form, isMobile])

  if (!customer) return null

  const cleanPhone = customer.phone?.replace(/\s+/g, '') || ''

  const handleCopyPhone = () => {
    if (!cleanPhone) return
    navigator.clipboard?.writeText(cleanPhone)
    setCopied(true)
    message.success(`Đã sao chép số điện thoại ${cleanPhone}`)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleLaunchDialer = () => {
    if (cleanPhone) {
      window.location.href = `tel:${cleanPhone}`
    }
  }

  const handleSubmit = async (values: CallFormValues) => {
    if (!customer) return
    setLoading(true)
    try {
      const selectedResult = RESULT_OPTIONS.find((r) => r.value === values.result)
      const resultLabel = selectedResult ? selectedResult.label : values.result

      const formattedContent = `[CUỘC GỌI - ${resultLabel}] [Thời lượng: ${values.duration}] ${
        values.content ? `- ${values.content.trim()}` : ''
      }`.trim()

      await api.post(`/customers/${customer.id}/cares`, {
        type: 'CALL',
        content: formattedContent,
      })

      await qc.invalidateQueries({ queryKey: ['customer-cares'] })

      message.success('Đã lưu nhật ký cuộc gọi thực tế thành công!')
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
              background: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
            }}
          >
            <PhoneOutlined />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>
            {isMobile ? 'Xác nhận cuộc gọi' : 'Thực hiện cuộc gọi & Ghi nhật ký'}
          </span>
        </Space>
      }
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      centered
      width={isMobile ? 420 : 560}
    >
      <div style={{ padding: '8px 0' }}>
        {/* Hộp số điện thoại nổi bật */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserOutlined />
              <span>Khách hàng: <strong>{customer.fullName}</strong></span>
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '0.5px',
                marginTop: 4,
                fontFamily: 'Consolas, monospace',
              }}
            >
              {customer.phone || 'Chưa có SĐT'}
            </div>
          </div>

          <Space>
            <Button
              icon={<CopyOutlined />}
              onClick={handleCopyPhone}
              style={{ borderRadius: 8 }}
            >
              {copied ? 'Đã chép' : 'Sao chép'}
            </Button>

            <Button
              type="primary"
              icon={<PhoneOutlined />}
              onClick={handleLaunchDialer}
              style={{ background: '#059669', borderColor: '#059669', borderRadius: 8 }}
            >
              {isMobile ? 'Gọi lại' : 'Mở ứng dụng gọi'}
            </Button>
          </Space>
        </div>

        {isMobile && (
          <Alert
            type="info"
            showIcon
            icon={<MobileOutlined />}
            message="Đang kích hoạt ứng dụng quay số trên điện thoại của bạn."
            description="Sau khi kết thúc cuộc gọi, hãy lưu nhanh kết quả trao đổi bên dưới để hệ thống cập nhật lịch sử."
            style={{ marginBottom: 16, borderRadius: 8 }}
          />
        )}

        {/* Form ghi nhận kết quả cuộc gọi */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            result: 'CONNECTED',
            duration: '1-3 phút',
            content: '',
          }}
        >
          <Form.Item
            name="result"
            label={<span style={{ fontWeight: 600 }}>Kết quả cuộc gọi</span>}
            rules={[{ required: true, message: 'Vui lòng chọn kết quả cuộc gọi' }]}
          >
            <Radio.Group style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {RESULT_OPTIONS.map((opt) => (
                  <Radio key={opt.value} value={opt.value}>
                    <Space>
                      <Tag color={opt.color} style={{ fontWeight: 600 }}>
                        {opt.label}
                      </Tag>
                    </Space>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="duration"
            label={<span style={{ fontWeight: 600 }}>Thời lượng đàm thoại</span>}
            rules={[{ required: true, message: 'Chọn thời lượng' }]}
          >
            <Select
              options={[
                { label: 'Dưới 1 phút (Ngắn)', value: '< 1 phút' },
                { label: '1 - 3 phút (Tiêu chuẩn)', value: '1-3 phút' },
                { label: '3 - 5 phút (Tư vấn sâu)', value: '3-5 phút' },
                { label: 'Trên 5 phút (Chốt phương án)', value: '> 5 phút' },
              ]}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="content"
            label={<span style={{ fontWeight: 600 }}>Nội dung trao đổi với khách</span>}
          >
            <Input.TextArea
              rows={3}
              placeholder="Ví dụ: Khách quan tâm căn Shophouse trục 24m, đang cân nhắc mức chiết khấu 6%, hẹn chiều mai gọi lại xác nhận..."
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Button onClick={onClose} style={{ borderRadius: 8 }}>
              Bỏ qua
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              style={{ background: '#059669', borderColor: '#059669', borderRadius: 8, fontWeight: 600 }}
            >
              Lưu nhật ký cuộc gọi
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  )
}

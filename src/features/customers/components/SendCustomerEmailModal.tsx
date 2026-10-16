import { useEffect, useState } from 'react'
import {
  Alert,
  App,
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd'
import {
  CheckCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  MailOutlined,
  SendOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/store/authStore'
import { tokens as t } from '@/theme/tokens'
import { apiErrorMessage, useSendCustomerEmail, type Customer } from '../api'
import { useEmailTemplates, type EmailTemplate } from '@/features/email-templates/api'

interface Props {
  open: boolean
  customer: Customer | null
  onClose: () => void
  onSuccess?: () => void
  initialTemplateId?: string
}

interface FormValues {
  templateId?: string
  toEmail: string
  subject: string
  body: string
  note?: string
}

export function SendCustomerEmailModal({
  open,
  customer,
  onClose,
  onSuccess,
  initialTemplateId,
}: Props) {
  const [form] = Form.useForm<FormValues>()
  const { message } = App.useApp()
  const currentUser = useAuthStore((s) => s.user)
  const isEligible = currentUser?.role === 'MANAGER' || currentUser?.role === 'SALES'

  const { data: templatesData, isLoading: loadingTemplates } = useEmailTemplates({
    status: 'ACTIVE',
    size: 100,
  })
  const templates = templatesData?.content ?? []

  const sendEmail = useSendCustomerEmail(customer?.id)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [showHtmlPreview, setShowHtmlPreview] = useState(false)

  const replaceVariables = (text: string) => {
    if (!text) return ''
    return text
      .replace(/{{customerName}}|{{ten_khach_hang}}/gi, customer?.fullName ?? '')
      .replace(/{{customerPhone}}|{{sdt_khach_hang}}/gi, customer?.phone ?? '')
      .replace(/{{salesName}}|{{ten_nhan_vien}}/gi, currentUser?.fullName ?? 'Chuyên viên tư vấn')
      .replace(/{{salesPhone}}|{{sdt_nhan_vien}}/gi, (currentUser as { phone?: string })?.phone ?? 'Hotline CSKH')
  }

  const applyTemplate = (tmpl: EmailTemplate) => {
    setSelectedTemplate(tmpl)
    form.setFieldsValue({
      templateId: tmpl.id,
      subject: replaceVariables(tmpl.subject),
      body: replaceVariables(tmpl.body),
    })
  }

  useEffect(() => {
    if (!open) {
      form.resetFields()
      setSelectedTemplate(null)
      setShowHtmlPreview(false)
      return
    }

    form.setFieldsValue({
      toEmail: customer?.email ?? '',
      subject: '',
      body: '',
      note: '',
    })

    if (initialTemplateId && templates.length > 0) {
      const tmpl = templates.find((t) => t.id === initialTemplateId)
      if (tmpl) applyTemplate(tmpl)
    }
  }, [open, customer?.id])

  const handleSelectTemplate = (templateId: string) => {
    if (!templateId) {
      setSelectedTemplate(null)
      return
    }
    const tmpl = templates.find((x) => x.id === templateId)
    if (tmpl) {
      applyTemplate(tmpl)
    }
  }

  const handleSubmit = async (values: FormValues) => {
    if (!customer) return
    try {
      const result = await sendEmail.mutateAsync({
        templateId: values.templateId,
        toEmail: values.toEmail.trim(),
        subject: values.subject.trim(),
        body: values.body.trim(),
        note: values.note?.trim(),
        senderEmail: currentUser?.email,
        senderName: currentUser?.fullName,
      })
      if (result?.status === 'FAILED') {
        message.warning(`Đã tạo bản ghi chăm sóc nhưng máy chủ mail chưa gửi được tới ${values.toEmail.trim()}`)
      } else {
        message.success(`Đã gửi email chăm sóc thành công tới ${customer.fullName} (${values.toEmail.trim()})`)
      }
      form.resetFields()
      onSuccess?.()
      onClose()
    } catch (err) {
      message.error(apiErrorMessage(err))
    }
  }

  if (!isEligible) {
    return (
      <Modal open={open} onCancel={onClose} footer={<Button onClick={onClose}>Đóng</Button>} centered>
        <Alert
          type="warning"
          showIcon
          message="Không có quyền gửi mail"
          description="Chỉ Manager (Trưởng phòng) và Sales (Chuyên viên kinh doanh) mới có quyền gửi email chăm sóc trực tiếp tới khách hàng."
          style={{ marginTop: 12 }}
        />
      </Modal>
    )
  }

  const bodyValue = Form.useWatch('body', form) || ''
  const isBodyHtml = bodyValue.includes('<p') || bodyValue.includes('<div') || bodyValue.includes('<br') || bodyValue.includes('<table')

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={760}
      centered
      destroyOnHidden
      maskClosable={false}
      styles={{
        body: { padding: '16px 20px 20px', maxHeight: 'calc(88vh - 120px)', overflowY: 'auto' },
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              display: 'grid',
              placeItems: 'center',
              background: t.colorBrandBg,
              color: t.colorBrand,
              fontSize: 16,
            }}
          >
            <MailOutlined />
          </span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>
              Gửi email chăm sóc khách hàng
            </div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Khách hàng: <strong>{customer?.fullName}</strong> · SĐT: {customer?.phone ?? '—'}
            </Typography.Text>
          </div>
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            <CheckCircleOutlined style={{ color: t.colorBrand, marginRight: 4 }} />
            Tự động lưu vào Nhật ký chăm sóc của khách hàng
          </Typography.Text>
          <Space>
            <Button onClick={onClose}>Hủy bỏ</Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={sendEmail.isPending}
              onClick={() => form.submit()}
            >
              Gửi email ngay
            </Button>
          </Space>
        </div>
      }
    >
      <div
        style={{
          background: '#f8faf9',
          border: '1px solid #e5ebe7',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <Space size={6}>
          <UserOutlined style={{ color: t.colorBrand }} />
          <Typography.Text style={{ fontSize: 12.5 }}>
            Người gửi: <strong>{currentUser?.fullName}</strong> ({currentUser?.email || 'Tài khoản nội bộ'})
          </Typography.Text>
          <Tag color="success" style={{ marginInlineStart: 4, borderRadius: 6 }}>
            {currentUser?.role === 'MANAGER' ? 'Manager đã xác thực' : 'Sales đã xác thực'}
          </Tag>
        </Space>
        <Typography.Text type="secondary" style={{ fontSize: 11.5 }}>
          Gửi qua máy chủ Resend CRM
        </Typography.Text>
      </div>

      {!customer?.email && (
        <Alert
          type="info"
          showIcon
          message="Khách hàng chưa có địa chỉ email trong hồ sơ"
          description="Vui lòng nhập email của khách hàng vào ô bên dưới để hệ thống chuyển thư chăm sóc."
          style={{ marginBottom: 14 }}
        />
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="templateId"
          label={
            <Space>
              <FileTextOutlined style={{ color: t.colorBrand }} />
              <span style={{ fontWeight: 600 }}>Chọn mẫu email mẫu (do Admin tạo &amp; quản lý)</span>
            </Space>
          }
          extra="Khi chọn mẫu, nội dung và biến đại diện {{customerName}}, {{salesName}}... sẽ tự động được điền"
        >
          <Select
            allowClear
            showSearch
            placeholder="Chọn mẫu email để tự động điền tiêu đề & nội dung..."
            loading={loadingTemplates}
            optionFilterProp="label"
            onChange={handleSelectTemplate}
            options={templates.map((tpl) => ({
              value: tpl.id,
              label: `[${tpl.category}] ${tpl.name} — ${tpl.subject}`,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="toEmail"
          label={<span style={{ fontWeight: 600 }}>Email người nhận (Khách hàng)</span>}
          required
          rules={[
            { required: true, message: 'Vui lòng nhập địa chỉ email khách hàng' },
            { type: 'email', message: 'Địa chỉ email không hợp lệ' },
          ]}
        >
          <Input placeholder="khachhang@example.com" prefix={<MailOutlined style={{ color: '#94a3b8' }} />} />
        </Form.Item>

        <Form.Item
          name="subject"
          label={<span style={{ fontWeight: 600 }}>Tiêu đề email</span>}
          required
          rules={[{ required: true, message: 'Vui lòng nhập tiêu đề email' }, { max: 255 }]}
        >
          <Input placeholder="Ví dụ: Đất Xanh Miền Trung gửi thông tin dự án..." />
        </Form.Item>

        <Form.Item
          name="body"
          label={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span style={{ fontWeight: 600 }}>Nội dung email</span>
              <Space size={6}>
                {selectedTemplate && (
                  <Tag color="blue" icon={<ThunderboltOutlined />}>
                    Đang dùng mẫu: {selectedTemplate.name}
                  </Tag>
                )}
                {isBodyHtml && (
                  <Button
                    size="small"
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => setShowHtmlPreview(!showHtmlPreview)}
                  >
                    {showHtmlPreview ? 'Ẩn xem trước' : 'Xem trước HTML'}
                  </Button>
                )}
              </Space>
            </div>
          }
          required
          rules={[{ required: true, message: 'Vui lòng nhập nội dung email' }]}
        >
          {showHtmlPreview ? (
            <div
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: 8,
                padding: '12px 16px',
                minHeight: 180,
                maxHeight: 300,
                overflowY: 'auto',
                background: '#ffffff',
              }}
              dangerouslySetInnerHTML={{ __html: bodyValue }}
            />
          ) : (
            <Input.TextArea
              rows={7}
              placeholder="Nhập nội dung email chăm sóc khách hàng..."
              showCount
              maxLength={20000}
            />
          )}
        </Form.Item>

        <Form.Item
          name="note"
          label={<span style={{ fontWeight: 500, fontSize: 12.5 }}>Ghi chú nội bộ CRM (Tùy chọn)</span>}
          extra="Ghi chú thêm về đợt chăm sóc này vào hồ sơ khách hàng"
        >
          <Input placeholder="Ví dụ: Gửi bảng giá phân khu Shophouse đợt 1 cho khách..." />
        </Form.Item>
      </Form>
    </Modal>
  )
}

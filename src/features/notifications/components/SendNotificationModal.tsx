import { SendOutlined } from '@ant-design/icons'
import { Form, Input, Modal, Radio, Select, Space } from 'antd'
import type { CreateNotificationInput } from '@/types/notification'

interface Props {
  open: boolean
  onCancel: () => void
  onSubmit: (values: CreateNotificationInput) => void
}

export function SendNotificationModal({ open, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<CreateNotificationInput>()

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onSubmit(values)
      form.resetFields()
    } catch {
      /* form validation error */
    }
  }

  return (
    <Modal
      title={
        <Space>
          <SendOutlined style={{ color: '#1677ff' }} />
          <span>Gửi thông báo mới</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Phát thông báo ngay"
      cancelText="Hủy"
      width={560}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ type: 'SYSTEM', priority: 'NORMAL', target: 'ALL' }}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          label="Tiêu đề thông báo"
          name="title"
          rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
        >
          <Input placeholder="Ví dụ: Cập nhật chính sách chiết khấu giỏ hàng mới" maxLength={120} />
        </Form.Item>

        <Space style={{ display: 'flex' }} size={12}>
          <Form.Item label="Loại thông báo" name="type" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Select
              options={[
                { value: 'SYSTEM', label: 'Hệ thống' },
                { value: 'DEAL', label: 'Giao dịch / Hợp đồng' },
                { value: 'CUSTOMER', label: 'Khách hàng' },
                { value: 'APPOINTMENT', label: 'Lịch hẹn' },
                { value: 'ALERT', label: 'Cảnh báo khẩn' },
              ]}
            />
          </Form.Item>

          <Form.Item label="Đối tượng nhận" name="target" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Select
              options={[
                { value: 'ALL', label: 'Toàn hệ thống' },
                { value: 'SALES', label: 'Bộ phận Sales' },
                { value: 'MANAGER', label: 'Cấp Quản lý' },
                { value: 'ADMIN', label: 'Ban Quản trị' },
              ]}
            />
          </Form.Item>
        </Space>

        <Form.Item label="Mức độ ưu tiên" name="priority">
          <Radio.Group>
            <Radio value="LOW">Thấp</Radio>
            <Radio value="NORMAL">Bình thường</Radio>
            <Radio value="HIGH">Quan trọng</Radio>
            <Radio value="URGENT">Khẩn cấp</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="Liên kết điều hướng (tùy chọn)" name="link">
          <Select
            allowClear
            placeholder="Chọn liên kết khi bấm vào thông báo"
            options={[
              { value: '/dashboard', label: 'Trang tổng quan (/dashboard)' },
              { value: '/deals', label: 'Quản lý hợp đồng (/deals)' },
              { value: '/customers', label: 'Quản lý khách hàng (/customers)' },
              { value: '/appointments', label: 'Lịch hẹn tư vấn (/appointments)' },
              { value: '/leads', label: 'Pipeline Leads (/leads)' },
              { value: '/projects', label: 'Danh mục dự án (/projects)' },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Nội dung thông báo chi tiết"
          name="content"
          rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Nhập nội dung thông báo gửi đến các nhân sự trong hệ thống..."
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

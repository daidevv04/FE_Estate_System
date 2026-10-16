import { Form, Input, Modal, Select } from 'antd'
import { useEffect } from 'react'
import { USER_ROLES, USER_STATUSES, type ManagedUser, type UserInput } from '../api'

interface Props {
  open: boolean
  user: ManagedUser
  submitting: boolean
  disableRoleChange?: boolean
  onCancel: () => void
  onSubmit: (body: UserInput) => void
}

export function UserFormModal({ open, user, submitting, disableRoleChange, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<UserInput>()
  useEffect(() => { if (open) form.setFieldsValue(user) }, [open, user, form])

  return (
    <Modal
      open={open}
      title={`Chỉnh sửa ${user.fullName}`}
      width={680}
      centered
      destroyOnHidden
      maskClosable={false}
      okText="Lưu thay đổi"
      cancelText="Hủy"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={() => void form.validateFields().then(onSubmit)}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <div className="user-form-grid">
          <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Nhập họ và tên' }, { max: 120 }]}>
            <Input autoFocus />
          </Form.Item>
          <Form.Item name="username" label="Username" rules={[{ required: true }]} extra="Username không thể thay đổi sau khi tạo tài khoản.">
            <Input disabled />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }, { max: 120 }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              { pattern: /^(0[0-9]{8,9}|\+[1-9]\d{7,14})$/, message: 'Số điện thoại tối đa 10 chữ số (bắt đầu bằng 0, VD: 0912345678) hoặc định dạng quốc tế (+84...)' },
              { max: 30 },
            ]}
          >
            <Input placeholder="0912345678" maxLength={15} />
          </Form.Item>
          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true }]}
            extra={disableRoleChange ? 'Chỉ Quản trị viên (Admin) mới có quyền đổi vai trò người dùng.' : undefined}
          >
            <Select disabled={disableRoleChange} options={USER_ROLES.map(({ value, label, scope }) => ({ value, label: `${label} · ${scope}` }))} />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
            <Select options={USER_STATUSES} />
          </Form.Item>
        </div>
        <Form.Item name="address" label="Địa chỉ" rules={[{ max: 300 }]}>
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
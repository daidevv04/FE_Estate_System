import { Form, Input, Modal, Select } from 'antd'
import { useEffect } from 'react'
import { USER_ROLES, USER_STATUSES, type ManagedUser, type UserInput } from '../api'

interface Props { open: boolean; user: ManagedUser; submitting: boolean; onCancel: () => void; onSubmit: (body: UserInput) => void }

/** Sửa data hồ sơ + role/status. Không có field bảo mật nhạy cảm trong form. */
export function UserFormModal({ open, user, submitting, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<UserInput>()
  useEffect(() => { if (open) form.setFieldsValue(user) }, [open, user, form])
  return <Modal open={open} title={`Chỉnh sửa ${user.fullName}`} width={680} destroyOnHidden maskClosable={false} okText="Lưu thay đổi" cancelText="Hủy" confirmLoading={submitting} onCancel={onCancel} onOk={() => void form.validateFields().then(onSubmit)}>
    <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
      <div className="user-form-grid">
        <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Nhập họ và tên' }, { max: 120 }]}><Input autoFocus /></Form.Item>
        <Form.Item name="username" label="Username" rules={[{ required: true }]} extra="Username không thể thay đổi sau khi tạo tài khoản."><Input disabled /></Form.Item>
        <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }, { max: 120 }]}><Input /></Form.Item>
        <Form.Item name="phone" label="Số điện thoại" rules={[{ max: 30 }]}><Input /></Form.Item>
        <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}><Select options={USER_ROLES.map(({ value, label, scope }) => ({ value, label: `${label} · ${scope}` }))} /></Form.Item>
        <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}><Select options={USER_STATUSES} /></Form.Item>
      </div>
      <Form.Item name="address" label="Địa chỉ" rules={[{ max: 300 }]}><Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} /></Form.Item>
    </Form>
  </Modal>
}
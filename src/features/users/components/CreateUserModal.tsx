import { LockOutlined, SafetyCertificateOutlined, TeamOutlined, UserAddOutlined } from '@ant-design/icons'
import { Button, Form, Input, Modal, Radio, Typography } from 'antd'
import { useEffect } from 'react'
import { USER_ROLES, roleScope, type CreateUserInput } from '../api'

interface Props { open: boolean; submitting: boolean; onCancel: () => void; onSubmit: (body: CreateUserInput) => void }

/** Password chỉ sống trong Form đang mở và bị reset khi đóng/submit; không đưa vào cache hoặc store. */
export function CreateUserModal({ open, submitting, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<CreateUserInput>()
  const selectedRole = Form.useWatch('role', form) ?? 'SALES'
  useEffect(() => {
    if (open) form.setFieldsValue({ role: 'SALES', email: null, phone: null, address: null })
    else form.resetFields()
  }, [open, form])
  const close = () => { form.resetFields(); onCancel() }
  const submit = async () => {
    const body = await form.validateFields()
    onSubmit(body)
  }
  return <Modal open={open} width={700} className="create-user-modal" destroyOnHidden maskClosable={!submitting} keyboard={!submitting} onCancel={close} footer={<div className="create-user-modal__footer"><Typography.Text>* Các trường bắt buộc không được để trống</Typography.Text><div><Button onClick={close} disabled={submitting}>Hủy</Button><Button type="primary" icon={<UserAddOutlined />} loading={submitting} onClick={() => void submit()}>Tạo người dùng</Button></div></div>} title={<div className="create-user-modal__title"><i><UserAddOutlined /></i><div>Tạo người dùng<small>Tạo tài khoản nhân viên mới cho hệ thống CRM Đất Xanh Miền Trung.</small></div></div>}>
    <Form form={form} layout="vertical" requiredMark onFinish={onSubmit} className="create-user-form">
      <h3>Thông tin người dùng</h3>
      <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Nhập họ và tên' }, { max: 100 }]}><Input autoFocus placeholder="Ví dụ: Nguyễn Văn An" /></Form.Item>
      <div className="create-user-form__grid">
        <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Nhập email' }, { type: 'email', message: 'Email không hợp lệ' }, { max: 100 }]}><Input placeholder="an.nguyen@datxanhmientrung.com" /></Form.Item>
        <Form.Item name="phone" label="Số điện thoại" rules={[{ pattern: /^\+[1-9]\d{7,14}$/, message: 'Dùng định dạng quốc tế, ví dụ +84912345678' }]}><Input placeholder="+84912345678" inputMode="tel" /></Form.Item>
      </div>
      <Form.Item name="address" label="Địa chỉ" rules={[{ max: 255 }]}><Input placeholder="Ví dụ: Tòa nhà ĐXMT, 105 Nguyễn Giáp, Đà Nẵng" /></Form.Item>
      <h3>Tài khoản đăng nhập</h3>
      <div className="create-user-form__grid">
        <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Nhập username' }, { min: 3, max: 50 }, { pattern: /^[A-Za-z0-9._-]+$/, message: 'Chỉ dùng chữ, số, chấm, gạch dưới hoặc gạch ngang' }]}><Input prefix="@" placeholder="an.nguyen" autoComplete="username" /></Form.Item>
        <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Nhập mật khẩu ban đầu' }, { min: 8, max: 72, message: 'Mật khẩu dài 8–72 ký tự' }]} extra="Tối thiểu 8 ký tự."><Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu ban đầu" autoComplete="new-password" /></Form.Item>
      </div>
      <h3>Vai trò & quyền truy cập</h3>
      <Form.Item name="role" noStyle><Radio.Group className="create-user-roles" aria-label="Vai trò người dùng">{USER_ROLES.map(({ value, label, scope }) => <Radio.Button key={value} value={value} className={selectedRole === value ? 'is-selected' : ''}><i className={`is-${value.toLowerCase()}`}>{value === 'ADMIN' ? <SafetyCertificateOutlined /> : <TeamOutlined />}</i><strong>{label} ({value})</strong><span>{scope}</span></Radio.Button>)}</Radio.Group></Form.Item>
      <div className="create-user-scope"><SafetyCertificateOutlined /><span><strong>Phạm vi dữ liệu: {roleScope(selectedRole)}</strong>Quyền truy cập được gán theo vai trò đã chọn.</span></div>
    </Form>
  </Modal>
}
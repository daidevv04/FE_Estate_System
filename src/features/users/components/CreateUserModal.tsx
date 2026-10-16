import { LockOutlined, SafetyCertificateOutlined, TeamOutlined, UserAddOutlined } from '@ant-design/icons'
import { Button, Form, Input, Modal, Radio, Typography } from 'antd'
import { useEffect } from 'react'
import { USER_ROLES, roleScope, type CreateUserInput } from '../api'

interface Props {
  open: boolean
  submitting: boolean
  isManager?: boolean
  onCancel: () => void
  onSubmit: (body: CreateUserInput) => void
}

export function CreateUserModal({ open, submitting, isManager, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<CreateUserInput>()
  const selectedRole = Form.useWatch('role', form) ?? 'SALES'

  useEffect(() => {
    if (open) form.setFieldsValue({ role: 'SALES', email: null, phone: null, address: null })
    else form.resetFields()
  }, [open, form])

  const close = () => { form.resetFields(); onCancel() }
  const submit = async () => {
    const body = await form.validateFields()
    if (isManager) {
      body.role = 'SALES'
    }
    onSubmit(body)
  }

  const availableRoles = isManager
    ? USER_ROLES.filter((r) => r.value === 'SALES')
    : USER_ROLES

  return (
    <Modal
      open={open}
      width={700}
      className="create-user-modal"
      centered
      destroyOnHidden
      maskClosable={!submitting}
      keyboard={!submitting}
      onCancel={close}
      footer={(
        <div className="create-user-modal__footer">
          <Typography.Text>* Các trường bắt buộc không được để trống</Typography.Text>
          <div>
            <Button onClick={close} disabled={submitting}>Hủy</Button>
            <Button type="primary" icon={<UserAddOutlined />} loading={submitting} onClick={() => void submit()}>
              {isManager ? 'Thêm nhân viên' : 'Tạo người dùng'}
            </Button>
          </div>
        </div>
      )}
      title={(
        <div className="create-user-modal__title">
          <i><UserAddOutlined /></i>
          <div>
            {isManager ? 'Thêm nhân viên kinh doanh (Sales)' : 'Tạo người dùng'}
            <small>
              {isManager
                ? 'Tạo tài khoản Sales thuộc đội ngũ dự án bạn phụ trách trong hệ thống CRM.'
                : 'Tạo tài khoản nhân viên mới cho hệ thống CRM Đất Xanh Miền Trung.'}
            </small>
          </div>
        </div>
      )}
    >
      <Form form={form} layout="vertical" requiredMark onFinish={onSubmit} className="create-user-form">
        <h3>Thông tin người dùng</h3>
        <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Nhập họ và tên' }, { max: 100 }]}>
          <Input autoFocus placeholder="Ví dụ: Nguyễn Văn An" />
        </Form.Item>
        <div className="create-user-form__grid">
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Nhập email' }, { type: 'email', message: 'Email không hợp lệ' }, { max: 100 }]}>
            <Input placeholder="an.nguyen@datxanhmientrung.com" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              {
                pattern: /^(0[0-9]{8,9}|\+[1-9]\d{7,14})$/,
                message: 'Số điện thoại tối đa 10 chữ số (bắt đầu bằng 0, VD: 0912345678) hoặc định dạng quốc tế (+84...)',
              },
            ]}
          >
            <Input placeholder="0912345678" inputMode="tel" maxLength={15} />
          </Form.Item>
        </div>
        <Form.Item name="address" label="Địa chỉ" rules={[{ max: 255 }]}>
          <Input placeholder="Ví dụ: Tòa nhà ĐXMT, 105 Nguyễn Giáp, Đà Nẵng" />
        </Form.Item>
        <h3>Tài khoản đăng nhập</h3>
        <div className="create-user-form__grid">
          <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Nhập username' }, { min: 3, max: 50 }, { pattern: /^[A-Za-z0-9._-]+$/, message: 'Chỉ dùng chữ, số, chấm, gạch dưới hoặc gạch ngang' }]}>
            <Input prefix="@" placeholder="an.nguyen" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Nhập mật khẩu ban đầu' }, { min: 8, max: 72, message: 'Mật khẩu dài 8–72 ký tự' }]} extra="Tối thiểu 8 ký tự.">
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu ban đầu" autoComplete="new-password" />
          </Form.Item>
        </div>
        <h3>Vai trò & quyền truy cập</h3>
        <Form.Item name="role" noStyle>
          <Radio.Group className="create-user-roles" aria-label="Vai trò người dùng">
            {availableRoles.map(({ value, label, scope }) => (
              <Radio.Button key={value} value={value} className={selectedRole === value ? 'is-selected' : ''}>
                <i className={`is-${value.toLowerCase()}`}>{value === 'ADMIN' ? <SafetyCertificateOutlined /> : <TeamOutlined />}</i>
                <strong>{label} ({value})</strong>
                <span>{scope}</span>
              </Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item>
        <div className="create-user-scope">
          <SafetyCertificateOutlined />
          <span>
            <strong>Phạm vi dữ liệu: {roleScope(selectedRole)}</strong>
            {isManager
              ? 'Tài khoản Sales mới sẽ trực thuộc đội ngũ của bạn và được gán vào các dự án phụ trách.'
              : 'Quyền truy cập được gán theo vai trò đã chọn.'}
          </span>
        </div>
      </Form>
    </Modal>
  )
}
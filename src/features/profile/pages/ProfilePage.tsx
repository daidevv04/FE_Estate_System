import { CheckCircleFilled, EditOutlined, EnvironmentOutlined, IdcardOutlined, KeyOutlined, LockOutlined, MailOutlined, PhoneOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons'
import { App, Avatar, Button, Card, Col, Descriptions, Form, Input, Modal, Row, Skeleton, Space, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { PageHeader } from '@/components/layout/PageHeader'
import { paths } from '@/routes/paths'
import { useAuthStore, type UserRole } from '@/store/authStore'
import { tokens as t } from '@/theme/tokens'
import { apiErrorMessage, roleLabel, type ManagedUser } from '@/features/users/api'
import './ProfilePage.css'

interface ProfileInput { fullName: string; email: string | null; phone: string | null; address: string | null }
interface PasswordInput { currentPassword: string; newPassword: string; confirmPassword: string }

const initials = (name: string) => name.trim().split(/\s+/).map((word) => word[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
const roleColor: Record<UserRole, string> = { ADMIN: t.colorTeal, MANAGER: t.colorViolet, SALES: t.colorInfo }
const authUser = (user: ManagedUser) => ({ id: user.id, username: user.username, fullName: user.fullName, email: user.email ?? undefined, role: user.role })
const requiredLabel = (text: string) => <span>{text} <i className="profile-required" aria-label="bắt buộc">*</i></span>

/** Hồ sơ tự phục vụ: chỉ dùng dữ liệu /users/me, không hiển thị số liệu hoặc phiên đăng nhập giả. */
export function ProfilePage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const storeUser = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const [profile, setProfile] = useState<ManagedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [form] = Form.useForm<ProfileInput>()
  const [passwordForm] = Form.useForm<PasswordInput>()

  useEffect(() => {
    let active = true
    api.get<ManagedUser>('/users/me').then(({ data }) => {
      if (!active) return
      setProfile(data)
      setUser(authUser(data))
      form.setFieldsValue(data)
    }).catch((error: unknown) => {
      if (active) message.error(apiErrorMessage(error))
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [form, message, setUser])

  const saveProfile = async (values: ProfileInput) => {
    setSaving(true)
    try {
      const { data } = await api.patch<ManagedUser>('/users/me/profile', {
        fullName: values.fullName.trim(), email: values.email?.trim() || null,
        phone: values.phone?.trim() || null, address: values.address?.trim() || null,
      })
      setProfile(data)
      setUser(authUser(data))
      setEditing(false)
      message.success('Đã cập nhật hồ sơ cá nhân')
    } catch (error) { message.error(apiErrorMessage(error)) } finally { setSaving(false) }
  }

  const changePassword = async (values: PasswordInput) => {
    setPasswordSaving(true)
    try {
      await api.post('/users/me/change-password', { currentPassword: values.currentPassword, newPassword: values.newPassword })
      useAuthStore.getState().clear()
      message.success('Đã đổi mật khẩu. Vui lòng đăng nhập lại.')
      navigate(paths.login, { replace: true })
    } catch (error) { message.error(apiErrorMessage(error)) } finally { setPasswordSaving(false) }
  }

  if (loading) return <Card className="stitch-card" variant="borderless"><Skeleton active avatar paragraph={{ rows: 10 }} /></Card>
  if (!profile) return <Card className="stitch-card profile-empty" variant="borderless"><Typography.Text>Không thể tải hồ sơ cá nhân.</Typography.Text><Button onClick={() => window.location.reload()}>Thử lại</Button></Card>

  const name = profile.fullName || storeUser?.fullName || profile.username
  return <div className="profile-page">
    <PageHeader breadcrumb={[{ title: 'Hệ thống' }, { title: 'Tài khoản cá nhân' }]} title="Hồ sơ cá nhân" status={<Tag color="success"><CheckCircleFilled /> Đang hoạt động</Tag>} meta="Thông tin liên hệ và cài đặt bảo mật của tài khoản." actions={<Button icon={<KeyOutlined />} onClick={() => setPasswordOpen(true)}>Đổi mật khẩu</Button>} />

    <Card className="stitch-card profile-hero" variant="borderless" styles={{ body: { padding: 24 } }}>
      <div className="profile-hero__identity"><div className="profile-avatar"><Avatar size={72}>{initials(name)}</Avatar><CheckCircleFilled aria-label="Tài khoản đang hoạt động" /></div><div><Typography.Title level={3}>{name}</Typography.Title><Space wrap size={[8, 8]}><span className="profile-username">@{profile.username}</span><Tag color={roleColor[profile.role]}>{roleLabel(profile.role)}</Tag></Space></div></div>
      <div className="profile-hero__status"><SafetyCertificateOutlined /><span>Tài khoản nội bộ đã xác thực</span></div>
    </Card>

    <Row gutter={[16, 16]}>
      <Col xs={24} xl={15}>
        <Card className="stitch-card profile-card" variant="borderless" title={<Space><IdcardOutlined />Thông tin cá nhân</Space>} extra={!editing && <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(true)}>Chỉnh sửa</Button>}>
          {editing ? <Form form={form} layout="vertical" onFinish={saveProfile} disabled={saving} requiredMark={false} className="profile-form">
            <Row gutter={[12, 0]}><Col xs={24} md={12}><Form.Item name="fullName" label={requiredLabel('Họ và tên')} rules={[{ required: true, message: 'Vui lòng nhập họ và tên.' }, { max: 100 }]}><Input autoFocus prefix={<UserOutlined />} /></Form.Item></Col><Col xs={24} md={12}><Form.Item name="email" label="Email công việc" rules={[{ type: 'email', message: 'Email không hợp lệ.' }, { max: 100 }]}><Input prefix={<MailOutlined />} /></Form.Item></Col><Col xs={24} md={12}><Form.Item name="phone" label="Số điện thoại" extra="Không bắt buộc" rules={[{ validator: (_, value) => !value?.trim() || /^\+[1-9]\d{7,14}$/.test(value.trim()) ? Promise.resolve() : Promise.reject(new Error('Dùng định dạng quốc tế, ví dụ +84912345678.')) }]}><Input prefix={<PhoneOutlined />} placeholder="+84912345678" /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Username"><Input prefix={<UserOutlined />} value={profile.username} disabled /></Form.Item></Col></Row><Form.Item name="address" label="Địa chỉ làm việc" rules={[{ max: 255 }]}><Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} /></Form.Item><Space><Button type="primary" htmlType="submit" loading={saving}>Lưu thay đổi</Button><Button onClick={() => { form.setFieldsValue(profile); setEditing(false) }} disabled={saving}>Hủy</Button></Space></Form> : <Descriptions column={{ xs: 1, sm: 2 }} size="small" className="profile-facts"><Descriptions.Item label={<><UserOutlined /> Họ và tên</>}>{name}</Descriptions.Item><Descriptions.Item label="Username">@{profile.username}</Descriptions.Item><Descriptions.Item label={<><MailOutlined /> Email công việc</>}>{profile.email || 'Chưa cập nhật'}</Descriptions.Item><Descriptions.Item label={<><PhoneOutlined /> Số điện thoại</>}>{profile.phone || 'Chưa cập nhật'}</Descriptions.Item><Descriptions.Item label={<><EnvironmentOutlined /> Địa chỉ làm việc</>} span={2}>{profile.address || 'Chưa cập nhật'}</Descriptions.Item></Descriptions>}
        </Card>
      </Col>
      <Col xs={24} xl={9}>
        <Card className="stitch-card profile-card profile-security" variant="borderless" title={<Space><LockOutlined />Bảo mật tài khoản</Space>}>
          <div className="profile-security__item"><span className="profile-security__icon is-password"><KeyOutlined /></span><div><strong>Mật khẩu đăng nhập</strong><small>Đổi mật khẩu định kỳ để bảo vệ tài khoản.</small></div><Button type="link" onClick={() => setPasswordOpen(true)}>Đổi</Button></div>
          <div className="profile-security__item"><span className={`profile-security__icon ${profile.emailVerifiedAt ? 'is-verified' : 'is-neutral'}`}><MailOutlined /></span><div><strong>Email công việc</strong><small>{profile.emailVerifiedAt ? 'Email đã được xác thực.' : 'Chưa có trạng thái xác thực từ hệ thống.'}</small></div><Tag color={profile.emailVerifiedAt ? 'success' : 'default'}>{profile.emailVerifiedAt ? 'Đã xác thực' : 'Chưa xác thực'}</Tag></div>
          <div className="profile-security__item"><span className={`profile-security__icon ${profile.is2faEnabled ? 'is-verified' : 'is-neutral'}`}><SafetyCertificateOutlined /></span><div><strong>Xác thực 2 lớp</strong><small>{profile.is2faEnabled ? '2FA đang bảo vệ tài khoản.' : '2FA chưa được bật.'}</small></div><Tag color={profile.is2faEnabled ? 'success' : 'default'}>{profile.is2faEnabled ? 'Đã bật' : 'Chưa bật'}</Tag></div>
        </Card>
      </Col>
    </Row>

    <Modal open={passwordOpen} title="Đổi mật khẩu" okText="Cập nhật mật khẩu" cancelText="Hủy" confirmLoading={passwordSaving} destroyOnHidden maskClosable={!passwordSaving} onCancel={() => { if (!passwordSaving) { setPasswordOpen(false); passwordForm.resetFields() } }} onOk={() => void passwordForm.validateFields().then(changePassword)}>
      <p className="profile-password-note">Đổi mật khẩu sẽ đăng xuất các phiên đăng nhập hiện có.</p>
      <Form form={passwordForm} layout="vertical" requiredMark={false}><Form.Item name="currentPassword" label={requiredLabel('Mật khẩu hiện tại')} rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại.' }]}><Input.Password autoComplete="current-password" /></Form.Item><Form.Item name="newPassword" label={requiredLabel('Mật khẩu mới')} dependencies={['currentPassword']} rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới.' }, { min: 8, max: 72, message: 'Mật khẩu dài 8–72 ký tự.' }, ({ getFieldValue }) => ({ validator: (_, value) => !value || getFieldValue('currentPassword') !== value ? Promise.resolve() : Promise.reject(new Error('Mật khẩu mới phải khác mật khẩu hiện tại.')) })]}><Input.Password autoComplete="new-password" /></Form.Item><Form.Item name="confirmPassword" label={requiredLabel('Xác nhận mật khẩu mới')} dependencies={['newPassword']} rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu mới.' }, ({ getFieldValue }) => ({ validator: (_, value) => !value || getFieldValue('newPassword') === value ? Promise.resolve() : Promise.reject(new Error('Mật khẩu xác nhận chưa khớp.')) })]}><Input.Password autoComplete="new-password" /></Form.Item></Form>
    </Modal>
  </div>
}
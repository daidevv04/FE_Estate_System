import { CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, EditOutlined, EnvironmentOutlined, IdcardOutlined, KeyOutlined, LockOutlined, MailOutlined, PhoneOutlined, SafetyCertificateOutlined, SaveOutlined, TeamOutlined, UnlockOutlined, UserOutlined } from '@ant-design/icons'
import { App, Avatar, Button, Card, Empty, Form, Input, Modal, Select, Skeleton, Space, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { USER_ROLES, USER_STATUSES, apiErrorMessage, roleLabel, roleScope, useUser, useUserMutations, type UserInput, type UserStatus } from '../api'
import { RolePill, StatusPill } from './UserPills'

interface Props { userId?: string; onClose: () => void }

const initials = (name: string) => name.trim().split(/\s+/).map((word) => word[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
const date = (value: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'

/** Modal nổi xem/sửa user. Password, OTP và khóa 2FA không vào state hoặc form. */
export function UserDetailDrawer({ userId, onClose }: Props) {
  const { message, modal } = App.useApp()
  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = currentUser?.role === 'ADMIN'
  const userQuery = useUser(userId)
  const { update, role, status, remove } = useUserMutations()
  const [form] = Form.useForm<UserInput>()
  const [editing, setEditing] = useState(false)
  const user = userQuery.data
  const saving = update.isPending || role.isPending || status.isPending

  useEffect(() => { setEditing(false); form.resetFields() }, [userId, form])
  useEffect(() => { if (editing && user) form.setFieldsValue(user) }, [editing, user, form])
  const close = () => {
    if (saving) return
    setEditing(false)
    form.resetFields()
    onClose()
  }
  const save = async () => {
    if (!user) return
    const body = await form.validateFields()
    if (body.role !== user.role && user.id === currentUser?.id) return message.error('Không thể đổi vai trò của chính tài khoản đang đăng nhập')
    try {
      await update.mutateAsync({ id: user.id, body })
      if (body.role !== user.role) await role.mutateAsync({ id: user.id, role: body.role })
      if (body.status !== user.status) await status.mutateAsync({ id: user.id, status: body.status })
      message.success('Đã cập nhật thông tin người dùng')
      setEditing(false)
    } catch (error) { message.error(apiErrorMessage(error)) }
  }
  const changeStatus = (next: UserStatus) => {
    if (!user || user.id === currentUser?.id) return
    modal.confirm({ title: next === 'LOCKED' ? `Khóa tài khoản ${user.fullName}?` : `Cập nhật trạng thái ${user.fullName}?`, content: next === 'LOCKED' ? 'Người dùng sẽ không thể đăng nhập cho đến khi tài khoản được mở khóa.' : `Trạng thái tài khoản sẽ chuyển thành “${USER_STATUSES.find((item) => item.value === next)?.label}”.`, okText: next === 'LOCKED' ? 'Khóa tài khoản' : 'Xác nhận', cancelText: 'Hủy', okButtonProps: next === 'LOCKED' ? { danger: true } : undefined, onOk: () => status.mutateAsync({ id: user.id, status: next }).then(() => message.success('Đã cập nhật trạng thái tài khoản')).catch((error) => { message.error(apiErrorMessage(error)); throw error }) })
  }
  const deleteUser = () => {
    if (!user || user.id === currentUser?.id) return
    modal.confirm({ title: `Xóa người dùng ${user.fullName}?`, content: 'Hành động này không hoàn tác được. Hãy khóa tài khoản nếu chỉ muốn ngừng quyền truy cập.', okText: 'Xóa người dùng', cancelText: 'Hủy', okButtonProps: { danger: true }, onOk: () => remove.mutateAsync(user.id).then(() => { message.success('Đã xóa người dùng'); onClose() }).catch((error) => { message.error(apiErrorMessage(error)); throw error }) })
  }

  return <Modal open={Boolean(userId)} onCancel={close} width="92vw" style={{ top: '5vh' }} className="user-detail-modal" destroyOnHidden maskClosable={!saving} keyboard={!saving} title="Thông tin người dùng" footer={user && <div className="user-detail-modal__footer"><Typography.Text>{editing ? 'Kiểm tra dữ liệu trước khi lưu.' : 'Thông tin được tải mới từ hệ thống.'}</Typography.Text><Space>{editing ? <><Button disabled={saving} onClick={() => { setEditing(false); form.resetFields() }}>Hủy chỉnh sửa</Button><Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => void save()}>Lưu thay đổi</Button></> : <><Button onClick={close}>Đóng</Button>{isAdmin && <Button type="primary" icon={<EditOutlined />} onClick={() => setEditing(true)}>Chỉnh sửa</Button>}</>}</Space></div>}>
    {userQuery.isLoading ? <Skeleton active avatar paragraph={{ rows: 12 }} /> : !user ? <Empty description={userQuery.isError ? 'Không thể tải thông tin người dùng.' : 'Không tìm thấy người dùng.'}><Button hidden={!userQuery.isError} onClick={() => void userQuery.refetch()}>Thử lại</Button></Empty> : editing ? <Form form={form} layout="vertical" className="user-detail-form">
      <div className="user-detail-modal__hero"><Avatar size={64} icon={<UserOutlined />}>{initials(user.fullName)}</Avatar><div><Typography.Title level={3}>{user.fullName}</Typography.Title><Typography.Text type="secondary">@{user.username} · Username không thể thay đổi</Typography.Text></div></div>
      <Card size="small" title={<Space size={7}><IdcardOutlined />Thông tin hồ sơ</Space>}><div className="user-detail-form__grid"><Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Nhập họ và tên' }, { max: 100 }]}><Input autoFocus /></Form.Item><Form.Item name="username" label="Username"><Input disabled /></Form.Item><Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }, { max: 100 }]}><Input /></Form.Item><Form.Item name="phone" label="Số điện thoại" rules={[{ pattern: /^\+[1-9]\d{7,14}$/, message: 'Dùng định dạng quốc tế, ví dụ +84912345678' }]}><Input inputMode="tel" placeholder="+84912345678" /></Form.Item></div><Form.Item name="address" label="Địa chỉ" rules={[{ max: 255 }]}><Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} /></Form.Item></Card>
      <Card size="small" title={<Space size={7}><SafetyCertificateOutlined />Quyền truy cập & trạng thái</Space>}><div className="user-detail-form__grid"><Form.Item name="role" label="Vai trò" rules={[{ required: true }]} extra={user.id === currentUser?.id ? 'Không thể đổi vai trò tài khoản đang đăng nhập.' : undefined}><Select disabled={user.id === currentUser?.id} options={USER_ROLES.map(({ value, label, scope }) => ({ value, label: `${label} · ${scope}` }))} /></Form.Item><Form.Item name="status" label="Trạng thái" rules={[{ required: true }]} extra={user.id === currentUser?.id ? 'Không thể đổi trạng thái tài khoản đang đăng nhập.' : undefined}><Select disabled={user.id === currentUser?.id} options={USER_STATUSES} /></Form.Item></div></Card>
      <div className="user-detail-modal__readonly"><LockOutlined /> Mật khẩu, OTP, khóa 2FA và trạng thái xác thực email không hiển thị hoặc chỉnh sửa tại đây.</div>
    </Form> : <div className="user-detail-modal__content">
      <div className="user-detail-modal__hero user-detail-modal__hero--full"><Avatar size={64} icon={<UserOutlined />}>{initials(user.fullName)}</Avatar><div className="user-detail-modal__identity"><Typography.Title level={3}>{user.fullName}</Typography.Title><Typography.Text type="secondary">@{user.username}</Typography.Text><Space wrap size={[6, 6]}><RolePill role={user.role} /><StatusPill status={user.status} /></Space></div><div className="user-detail-modal__audit"><span>Ngày tạo</span><strong>{date(user.createdAt)}</strong><span>Cập nhật</span><strong>{date(user.updatedAt)}</strong></div>{isAdmin && <Space className="user-detail-modal__hero-actions"><Button icon={<EditOutlined />} onClick={() => setEditing(true)}>Sửa hồ sơ</Button>{user.id !== currentUser?.id && <Button icon={user.status === 'LOCKED' ? <UnlockOutlined /> : <LockOutlined />} onClick={() => changeStatus(user.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED')}>{user.status === 'LOCKED' ? 'Mở khóa' : 'Khóa tài khoản'}</Button>}</Space>}</div>
      <div className="user-detail-modal__detail-grid">
        <Card className="user-section" size="small" title={<Space size={7}><IdcardOutlined />Hồ sơ người dùng</Space>} extra="Thông tin cơ bản"><div className="detail-facts"><div><span>Họ và tên</span><strong>{user.fullName}</strong></div><div><span>Username</span><strong>@{user.username}</strong></div><div><span><MailOutlined /> Email công việc</span><strong>{user.email || 'Chưa cập nhật'}</strong></div><div><span><PhoneOutlined /> Số điện thoại</span><strong>{user.phone || 'Chưa cập nhật'}</strong></div><div><span><EnvironmentOutlined /> Địa chỉ công tác</span><strong>{user.address || 'Chưa cập nhật'}</strong></div><div><span>Vai trò hiện tại</span><RolePill role={user.role} /></div><div><span>Trạng thái tài khoản</span><StatusPill status={user.status} /></div><div><span>ID người dùng</span><strong>{user.id}</strong></div></div><div className="user-profile-foot"><CalendarOutlined /> Tạo {date(user.createdAt)} · Cập nhật {date(user.updatedAt)}</div></Card>
        <Card className="user-section user-security-card" size="small" title={<Space size={7}><SafetyCertificateOutlined />Bảo mật tài khoản</Space>} extra={<span className="user-readonly">Chỉ xem</span>}><div className="security-state"><i className={user.is2faEnabled ? 'is-secure' : 'is-neutral'}><SafetyCertificateOutlined /></i><div><strong>Xác thực 2 lớp (2FA)</strong><span>{user.is2faEnabled === null ? 'Chưa có dữ liệu xác thực hai lớp từ API.' : user.is2faEnabled ? 'Tài khoản đang được bảo vệ bằng 2FA.' : 'Chưa bật xác thực hai lớp.'}</span></div><b className={user.is2faEnabled ? 'is-ok' : 'is-muted'}>{user.is2faEnabled === null ? 'CHƯA CÓ DỮ LIỆU' : user.is2faEnabled ? 'ĐÃ BẬT' : 'CHƯA BẬT'}</b></div><div className="security-state"><i className={user.emailVerifiedAt ? 'is-info' : 'is-neutral'}><MailOutlined /></i><div><strong>Trạng thái email</strong><span>{user.emailVerifiedAt ? `Đã xác thực ${date(user.emailVerifiedAt)}` : 'Email chưa được xác thực.'}</span></div><b className={user.emailVerifiedAt ? 'is-info' : 'is-muted'}>{user.emailVerifiedAt ? 'ĐÃ XÁC THỰC' : 'CHƯA XÁC THỰC'}</b></div><div className="security-state security-state--password"><i className="is-violet"><KeyOutlined /></i><div><strong>Mật khẩu đăng nhập</strong><span>Không hiển thị mật khẩu, OTP hoặc khóa bảo mật.</span></div><b>••••••••••••</b></div></Card>
      </div>
      <Card className="user-section" size="small" title={<Space size={7}><TeamOutlined />Vai trò & Phạm vi dữ liệu</Space>} extra={isAdmin && <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(true)}>Thay đổi vai trò</Button>}><div className="role-scope role-scope--detail"><RolePill role={user.role} /><div><strong>{roleLabel(user.role)} · {roleScope(user.role)}</strong><span>Quyền truy cập được gán theo vai trò, áp dụng ngay sau khi thay đổi và không chỉnh từng quyền riêng lẻ.</span></div></div><div className="role-access-cards"><div><b className="is-admin">ADMIN</b><strong>Toàn hệ thống</strong><span>Quản lý người dùng, cấu hình và toàn bộ dữ liệu CRM.</span></div><div><b className="is-manager">MANAGER</b><strong>Phạm vi team</strong><span>Quản lý dữ liệu, tiến độ và hiệu suất team phụ trách.</span></div><div><b className="is-sales">SALES</b><strong>Dữ liệu được giao</strong><span>Xử lý khách hàng, lead và công việc được phân công.</span></div></div></Card>
      {isAdmin && user.id !== currentUser?.id && <Card className="user-section user-danger-zone" size="small" title={<Space size={7}><CloseCircleOutlined />Thao tác tài khoản (vùng nguy hiểm)</Space>}><Typography.Paragraph>Các thao tác bên dưới ảnh hưởng trực tiếp tới quyền truy cập. Khóa hoặc vô hiệu hóa trước khi xóa nếu chỉ muốn ngừng quyền đăng nhập.</Typography.Paragraph><div className="user-danger-actions"><div><strong>{user.status === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}</strong><span>{user.status === 'LOCKED' ? 'Khôi phục quyền đăng nhập cho tài khoản này.' : 'Ngăn người dùng đăng nhập cho đến khi mở khóa.'}</span><Button icon={user.status === 'LOCKED' ? <UnlockOutlined /> : <LockOutlined />} onClick={() => changeStatus(user.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED')}>{user.status === 'LOCKED' ? 'Mở khóa' : 'Khóa tài khoản'}</Button></div><div><strong>{user.status === 'ACTIVE' ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}</strong><span>{user.status === 'ACTIVE' ? 'Tạm dừng quyền truy cập nhưng vẫn giữ dữ liệu hồ sơ.' : 'Cho phép tài khoản hoạt động trở lại.'}</span><Button danger={user.status === 'ACTIVE'} icon={user.status === 'ACTIVE' ? <LockOutlined /> : <CheckCircleOutlined />} onClick={() => changeStatus(user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}>{user.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt'}</Button></div><div className="is-delete"><strong>Xóa tài khoản vĩnh viễn</strong><span>Xóa hồ sơ người dùng. Không thể khôi phục sau khi xác nhận.</span><Button danger type="primary" icon={<DeleteOutlined />} onClick={deleteUser}>Xóa tài khoản</Button></div></div></Card>}
    </div>}
  </Modal>
}
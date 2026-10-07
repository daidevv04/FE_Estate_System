import { ArrowLeftOutlined, CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, EditOutlined, EnvironmentOutlined, IdcardOutlined, KeyOutlined, LockOutlined, MailOutlined, MoreOutlined, PhoneOutlined, SafetyCertificateOutlined, TeamOutlined, UnlockOutlined, UserOutlined } from '@ant-design/icons'
import { App, Avatar, Button, Card, Col, Dropdown, Empty, Row, Skeleton, Space, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'
import { tokens as t } from '@/theme/tokens'
import { USER_STATUSES, apiErrorMessage, roleLabel, roleScope, useUser, useUserMutations, type UserStatus } from '../api'
import { UserFormModal } from '../components/UserFormModal'
import { RolePill, StatusPill } from '../components/UserPills'
import './Users.css'

const initials = (name: string) => name.trim().split(/\s+/).map((word) => word[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
const date = (value: string | null) => value ? dayjs(value).format('DD/MM/YYYY · HH:mm') : '—'

function Loading() { return <><Card className="stitch-card" variant="borderless"><Skeleton active avatar paragraph={{ rows: 2 }} /></Card><Row gutter={[16, 16]} style={{ marginTop: 16 }}><Col xs={24} lg={14}><Card className="stitch-card" variant="borderless"><Skeleton active paragraph={{ rows: 8 }} /></Card></Col><Col xs={24} lg={10}><Card className="stitch-card" variant="borderless"><Skeleton active paragraph={{ rows: 6 }} /></Card></Col></Row></> }

/** 9.27 — read-first screen. Quyền là view theo role backend, không checkbox giả chỉnh quyền. */
export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = currentUser?.role === 'ADMIN'
  const userQuery = useUser(id)
  const { update, role: updateRole, status, remove } = useUserMutations()
  const [editOpen, setEditOpen] = useState(false)
  const user = userQuery.data
  if (userQuery.isLoading) return <Loading />
  if (!user) return <Empty description={userQuery.isError ? 'Không thể tải thông tin người dùng.' : 'Không tìm thấy người dùng.'}><Space><Button onClick={() => void userQuery.refetch()} hidden={!userQuery.isError}>Thử lại</Button><Button type="primary" onClick={() => navigate(paths.users)}>Quay lại danh sách</Button></Space></Empty>

  const changeStatus = (next: UserStatus) => modal.confirm({ title: next === 'LOCKED' ? `Khóa tài khoản ${user.fullName}?` : `Cập nhật trạng thái ${user.fullName}?`, content: next === 'LOCKED' ? 'Người dùng sẽ không thể đăng nhập cho đến khi tài khoản được mở khóa.' : `Trạng thái tài khoản sẽ chuyển thành “${USER_STATUSES.find((x) => x.value === next)?.label}”.`, okText: next === 'LOCKED' ? 'Khóa tài khoản' : 'Xác nhận', cancelText: 'Hủy', okButtonProps: next === 'LOCKED' ? { danger: true } : undefined, onOk: () => status.mutateAsync({ id: user.id, status: next }).then(() => message.success('Đã cập nhật trạng thái tài khoản')).catch((e) => { message.error(apiErrorMessage(e)); throw e }) })
  const deleteUser = () => modal.confirm({ title: `Xóa người dùng ${user.fullName}?`, content: 'Hành động này không hoàn tác được. Hãy khóa tài khoản nếu chỉ muốn ngừng quyền truy cập.', okText: 'Xóa người dùng', cancelText: 'Hủy', okButtonProps: { danger: true }, onOk: () => remove.mutateAsync(user.id).then(() => { message.success('Đã xóa người dùng'); navigate(paths.users) }).catch((e) => { message.error(apiErrorMessage(e)); throw e }) })
  const accountAction = user.status === 'LOCKED' ? { label: 'Mở khóa tài khoản', icon: <UnlockOutlined />, next: 'ACTIVE' as UserStatus } : { label: 'Khóa tài khoản', icon: <LockOutlined />, next: 'LOCKED' as UserStatus }
  const saveUser = async (body: import('../api').UserInput) => {
    await update.mutateAsync({ id: user.id, body })
    if (body.role !== user.role) await updateRole.mutateAsync({ id: user.id, role: body.role })
    if (body.status !== user.status) await status.mutateAsync({ id: user.id, status: body.status })
  }

  return <>
    <PageHeader breadcrumb={[{ title: 'Hệ thống' }, { title: 'Người dùng', href: paths.users }, { title: user.fullName }]} title="Chi tiết người dùng" meta="Hồ sơ, bảo mật và phạm vi truy cập theo vai trò." actions={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate(paths.users)}>Danh sách</Button>} />
    <Card className="stitch-card user-hero user-detail-hero" variant="borderless">
      <Avatar size={64} icon={<UserOutlined />} style={{ background: t.colorBrand, fontSize: 24 }}>{initials(user.fullName)}</Avatar>
      <div className="user-hero__identity"><Typography.Title level={3}>{user.fullName}</Typography.Title><Typography.Text type="secondary">@{user.username}</Typography.Text><Space wrap size={[6, 6]} className="user-hero__pills"><RolePill role={user.role} /><StatusPill status={user.status} /></Space></div>
      <div className="user-hero__audit"><span>Ngày tạo</span><strong>{date(user.createdAt)}</strong><span>Cập nhật</span><strong>{date(user.updatedAt)}</strong></div>
      {isAdmin && <div className="user-hero__actions"><Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>Sửa hồ sơ</Button><Button icon={accountAction.icon} onClick={() => changeStatus(accountAction.next)}>{accountAction.label}</Button><Dropdown trigger={['click']} menu={{ items: [{ key: 'delete', label: 'Xóa người dùng', icon: <DeleteOutlined />, danger: true }], onClick: () => deleteUser() }}><Button aria-label="Thao tác quản trị khác" icon={<MoreOutlined />} /></Dropdown></div>}
    </Card>
    <Row gutter={[16, 16]} className="user-detail-grid">
      <Col xs={24} xl={14}><Card className="stitch-card user-section user-profile-card" variant="borderless" title={<Space size={8}><IdcardOutlined />Hồ sơ người dùng</Space>} extra={<Typography.Text type="secondary">Thông tin cơ bản</Typography.Text>}><div className="detail-facts">
        <div><span>Họ và tên</span><strong>{user.fullName}</strong></div><div><span>Username</span><strong>@{user.username}</strong></div>
        <div><span><MailOutlined /> Email công việc</span><strong>{user.email || 'Chưa cập nhật'}</strong></div><div><span><PhoneOutlined /> Số điện thoại</span><strong>{user.phone || 'Chưa cập nhật'}</strong></div>
        <div><span><EnvironmentOutlined /> Địa chỉ</span><strong>{user.address || 'Chưa cập nhật'}</strong></div><div><span><TeamOutlined /> Phạm vi làm việc</span><strong>{roleScope(user.role)}</strong></div>
        <div><span>Vai trò hiện tại</span><RolePill role={user.role} /></div><div><span>Trạng thái tài khoản</span><StatusPill status={user.status} /></div>
      </div><div className="user-profile-foot"><CalendarOutlined /> Tạo ngày {date(user.createdAt)} · Cập nhật {date(user.updatedAt)}</div></Card></Col>
      <Col xs={24} xl={10}><Card className="stitch-card user-section user-security-card" variant="borderless" title={<Space size={8}><SafetyCertificateOutlined />Bảo mật tài khoản</Space>} extra={<span className="user-readonly">Chỉ xem</span>}><div className="security-state"><i className={user.is2faEnabled ? 'is-secure' : 'is-neutral'}><SafetyCertificateOutlined /></i><div><strong>Xác thực 2 lớp (2FA)</strong><span>{user.is2faEnabled ? 'Tài khoản đang được bảo vệ bằng 2FA.' : 'Chưa bật xác thực hai lớp.'}</span></div><b className={user.is2faEnabled ? 'is-ok' : 'is-muted'}>{user.is2faEnabled ? 'ĐÃ BẬT' : 'CHƯA BẬT'}</b></div><div className="security-state"><i className={user.emailVerifiedAt ? 'is-info' : 'is-neutral'}><MailOutlined /></i><div><strong>Trạng thái email</strong><span>{user.emailVerifiedAt ? `Đã xác thực ${date(user.emailVerifiedAt)}` : 'Email chưa được xác thực.'}</span></div><b className={user.emailVerifiedAt ? 'is-info' : 'is-muted'}>{user.emailVerifiedAt ? 'ĐÃ XÁC THỰC' : 'CHƯA XÁC THỰC'}</b></div><div className="security-state security-state--password"><i className="is-violet"><KeyOutlined /></i><div><strong>Mật khẩu đăng nhập</strong><span>Không hiển thị mật khẩu, OTP hoặc khóa bảo mật.</span></div><b>••••••••••••</b></div></Card></Col>
      <Col span={24}><Card className="stitch-card user-section" variant="borderless" title={<Space size={8}><TeamOutlined />Vai trò & phạm vi dữ liệu</Space>} extra={isAdmin && <Button size="small" icon={<EditOutlined />} onClick={() => setEditOpen(true)}>Thay đổi vai trò</Button>}><div className="role-scope role-scope--detail"><RolePill role={user.role} /><div><strong>{roleLabel(user.role)} · {roleScope(user.role)}</strong><span>Quyền truy cập được hệ thống gán theo vai trò và chỉ thay đổi khi cập nhật vai trò người dùng.</span></div></div><div className="role-access-cards"><div><b className="is-admin">ADMIN</b><strong>Toàn hệ thống</strong><span>Quản lý người dùng, cấu hình và toàn bộ dữ liệu CRM.</span></div><div><b className="is-manager">MANAGER</b><strong>Phạm vi team</strong><span>Quản lý dữ liệu, tiến độ và hiệu suất của team phụ trách.</span></div><div><b className="is-sales">SALES</b><strong>Dữ liệu được giao</strong><span>Xử lý khách hàng, lead, lịch hẹn và hợp đồng được phân công.</span></div></div></Card></Col>
      {isAdmin && <Col span={24}><Card className="stitch-card user-danger-zone" variant="borderless" title={<Space size={8}><CloseCircleOutlined />Thao tác tài khoản</Space>}><Typography.Paragraph>Chỉ dùng khi cần giới hạn hoặc xóa quyền truy cập. Hành động xóa không thể hoàn tác.</Typography.Paragraph><div className="user-danger-actions"><div><strong>{accountAction.label}</strong><span>{user.status === 'LOCKED' ? 'Khôi phục quyền đăng nhập cho tài khoản này.' : 'Ngăn người dùng đăng nhập cho đến khi mở khóa.'}</span><Button icon={accountAction.icon} onClick={() => changeStatus(accountAction.next)}>{accountAction.label}</Button></div><div><strong>{user.status === 'ACTIVE' ? 'Ngừng hoạt động' : 'Kích hoạt tài khoản'}</strong><span>{user.status === 'ACTIVE' ? 'Tạm ngừng truy cập nhưng vẫn giữ dữ liệu hồ sơ.' : 'Cho phép tài khoản hoạt động trở lại.'}</span><Button danger={user.status === 'ACTIVE'} icon={user.status === 'ACTIVE' ? <LockOutlined /> : <CheckCircleOutlined />} onClick={() => changeStatus(user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}>{user.status === 'ACTIVE' ? 'Ngừng hoạt động' : 'Kích hoạt tài khoản'}</Button></div><div className="is-delete"><strong>Xóa tài khoản vĩnh viễn</strong><span>Xóa hồ sơ người dùng. Không thể khôi phục sau khi xác nhận.</span><Button danger type="primary" icon={<DeleteOutlined />} onClick={deleteUser}>Xóa tài khoản</Button></div></div></Card></Col>}
    </Row>
    {isAdmin && <UserFormModal open={editOpen} user={user} submitting={update.isPending || updateRole.isPending || status.isPending} onCancel={() => setEditOpen(false)} onSubmit={(body) => {
      if (body.role !== user.role && user.id === currentUser?.id) { message.error('Không thể đổi vai trò của chính tài khoản đang đăng nhập'); return }
      if (body.role !== user.role) { setEditOpen(false); modal.confirm({ title: `Đổi vai trò thành ${roleLabel(body.role)}?`, content: 'Quyền truy cập của người dùng sẽ thay đổi ngay theo vai trò mới.', okText: 'Xác nhận thay đổi', cancelText: 'Hủy', onOk: () => saveUser(body).then(() => { message.success('Đã cập nhật người dùng') }).catch((e) => { message.error(apiErrorMessage(e)); throw e }) }); return }
      void saveUser(body).then(() => { message.success('Đã cập nhật người dùng'); setEditOpen(false) }).catch((e) => message.error(apiErrorMessage(e)))
    }} />}
  </>
}
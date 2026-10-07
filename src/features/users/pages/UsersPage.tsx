import { DeleteOutlined, DownloadOutlined, EyeOutlined, LockOutlined, MoreOutlined, PlusOutlined, SafetyCertificateOutlined, SearchOutlined, TeamOutlined, UnlockOutlined, UsergroupAddOutlined } from '@ant-design/icons'
import { App, Avatar, Button, Card, Dropdown, Empty, Input, Progress, Select, Table, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuthStore } from '@/store/authStore'
import { USER_ROLES, USER_STATUSES, apiErrorMessage, useUserMutations, useUsers, type CreateUserInput, type ManagedUser, type UserStatus } from '../api'
import { CreateUserModal } from '../components/CreateUserModal'
import { UserDetailDrawer } from '../components/UserDetailDrawer'
import { RolePill, StatusPill } from '../components/UserPills'
import './Users.css'

const initials = (name: string) => name.trim().split(/\s+/).map((word) => word[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
const avatarColor = (seed: string) => ['#087f43', '#0d9488', '#5b4cc4', '#0284c7'][[...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4]

/** 9.26 — bảng quản trị người dùng. Tạo user chỉ ADMIN, backend cũng chặn POST /users bằng hasRole('ADMIN'). */
export function UsersPage() {
  const { message, modal } = App.useApp()
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN')
  const { data = [], isLoading, isError, refetch } = useUsers()
  const { create, status, remove } = useUserMutations()
  const [keyword, setKeyword] = useState('')
  const [role, setRole] = useState<string>()
  const [userStatus, setUserStatus] = useState<UserStatus>()
  const [selected, setSelected] = useState<string[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [detailUserId, setDetailUserId] = useState<string>()
  const dragSelection = useRef<{ active: boolean; shouldSelect: boolean }>({ active: false, shouldSelect: false })
  useEffect(() => {
    const stopDragSelection = () => { dragSelection.current.active = false }
    window.addEventListener('mouseup', stopDragSelection)
    return () => window.removeEventListener('mouseup', stopDragSelection)
  }, [])
  const rows = useMemo(() => data.filter((user) => {
    const q = keyword.trim().toLocaleLowerCase('vi')
    return (!q || [user.fullName, user.username, user.email ?? '', user.phone ?? ''].some((value) => value.toLocaleLowerCase('vi').includes(q))) && (!role || user.role === role) && (!userStatus || user.status === userStatus)
  }), [data, keyword, role, userStatus])
  const count = (value: UserStatus) => data.filter((u) => u.status === value).length
  const activeRate = data.length ? Math.round((count('ACTIVE') / data.length) * 100) : 0
  const roleCount = (value: ManagedUser['role']) => data.filter((u) => u.role === value).length
  const selectedUsers = data.filter((u) => selected.includes(u.id))
  const dragSelect = (user: ManagedUser) => {
    const { active, shouldSelect } = dragSelection.current
    if (!active) return
    setSelected((keys) => shouldSelect ? [...new Set([...keys, user.id])] : keys.filter((key) => key !== user.id))
  }

  const setStatus = (user: ManagedUser, next: UserStatus) => modal.confirm({
    title: next === 'LOCKED' ? `Khóa tài khoản ${user.fullName}?` : `Cập nhật trạng thái ${user.fullName}?`,
    content: next === 'LOCKED' ? 'Người dùng sẽ không thể đăng nhập cho đến khi tài khoản được mở khóa.' : `Trạng thái tài khoản sẽ chuyển thành “${USER_STATUSES.find((x) => x.value === next)?.label}”.`,
    okText: next === 'LOCKED' ? 'Khóa tài khoản' : 'Xác nhận', cancelText: 'Hủy', okButtonProps: next === 'LOCKED' ? { danger: true } : undefined,
    onOk: () => status.mutateAsync({ id: user.id, status: next }).then(() => message.success('Đã cập nhật trạng thái tài khoản')).catch((e) => { message.error(apiErrorMessage(e)); throw e }),
  })
  const deleteUser = (user: ManagedUser) => modal.confirm({
    title: `Xóa người dùng ${user.fullName}?`, content: 'Hành động này không hoàn tác được. Hãy khóa tài khoản nếu chỉ muốn ngừng quyền truy cập.',
    okText: 'Xóa người dùng', cancelText: 'Hủy', okButtonProps: { danger: true },
    onOk: () => remove.mutateAsync(user.id).then(() => { if (detailUserId === user.id) setDetailUserId(undefined); message.success('Đã xóa người dùng') }).catch((e) => { message.error(apiErrorMessage(e)); throw e }),
  })
  const statusItem = (user: ManagedUser) => {
    if (user.status === 'LOCKED') return { key: 'activate', label: 'Mở khóa và kích hoạt', icon: <UnlockOutlined /> }
    if (user.status === 'INACTIVE') return { key: 'activate', label: 'Kích hoạt tài khoản', icon: <UnlockOutlined /> }
    return { key: 'deactivate', label: 'Ngừng hoạt động', icon: <LockOutlined />, danger: true }
  }
  const bulkStatus = (next: UserStatus) => {
    if (!selectedUsers.length) return
    modal.confirm({
      title: `Cập nhật trạng thái ${selectedUsers.length} người dùng?`,
      content: `Tất cả tài khoản đã chọn sẽ chuyển thành “${USER_STATUSES.find((x) => x.value === next)?.label}”.`,
      okText: 'Xác nhận', cancelText: 'Hủy', okButtonProps: next === 'LOCKED' ? { danger: true } : undefined,
      onOk: () => Promise.all(selectedUsers.map((user) => status.mutateAsync({ id: user.id, status: next }))).then(() => { setSelected([]); message.success('Đã cập nhật trạng thái tài khoản') }).catch((e) => { message.error(apiErrorMessage(e)); throw e }),
    })
  }
  const bulkDelete = () => {
    if (!selectedUsers.length) return
    modal.confirm({
      title: `Xóa ${selectedUsers.length} người dùng đã chọn?`,
      content: `Hành động này không hoàn tác được. ${selectedUsers.length} tài khoản sẽ bị xóa vĩnh viễn.`,
      okText: `Xóa ${selectedUsers.length} người dùng`, cancelText: 'Hủy', okButtonProps: { danger: true },
      onOk: () => Promise.all(selectedUsers.map((user) => remove.mutateAsync(user.id))).then(() => { setSelected([]); message.success(`Đã xóa ${selectedUsers.length} người dùng`) }).catch((e) => { message.error(apiErrorMessage(e)); throw e }),
    })
  }
  const exportUsers = (items = rows) => {
    const quote = (value: string | null | undefined) => `"${(value ?? '').replaceAll('"', '""')}"`
    const csv = ['Họ và tên,Username,Email,Số điện thoại,Vai trò,Trạng thái', ...items.map((u) => [u.fullName, u.username, u.email, u.phone, u.role, u.status].map(quote).join(','))].join('\n')
    const href = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = href; anchor.download = 'nguoi-dung.csv'; anchor.click(); URL.revokeObjectURL(href)
  }
  const createUser = (body: CreateUserInput) => create.mutate(body, { onSuccess: () => { setCreateOpen(false); message.success(`Đã tạo tài khoản ${body.username}`) }, onError: (e) => message.error(apiErrorMessage(e)) })

  const columns: ColumnsType<ManagedUser> = [
    { title: 'Người dùng', key: 'user', width: 235, render: (_, user) => <button type="button" className="user-cell" onClick={() => setDetailUserId(user.id)}><Avatar size={32} style={{ background: avatarColor(user.id) }}>{initials(user.fullName)}</Avatar><span><strong>{user.fullName}</strong><small>@{user.username}</small></span></button> },
    { title: 'Email', dataIndex: 'email', width: 210, render: (email) => <span className="user-email">{email || 'Chưa cập nhật'}</span> },
    { title: 'Vai trò', dataIndex: 'role', width: 122, render: (_, user) => <RolePill role={user.role} /> },
    { title: 'Trạng thái', dataIndex: 'status', width: 128, render: (_, user) => <StatusPill status={user.status} /> },
    { title: 'Bảo mật', key: 'security', width: 102, render: (_, user) => <Tooltip title={user.is2faEnabled === null ? 'Chưa có dữ liệu xác thực hai lớp từ API' : user.is2faEnabled ? 'Xác thực hai lớp đã bật' : 'Xác thực hai lớp chưa bật'}><span className={`user-security ${user.is2faEnabled ? 'is-enabled' : ''}`}><SafetyCertificateOutlined /> 2FA</span></Tooltip> },
    { title: 'Ngày cập nhật', dataIndex: 'updatedAt', width: 132, render: (value) => <span className="user-updated">{value ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : '—'}</span> },
    { title: '', key: 'actions', fixed: 'right', width: 56, render: (_, user) => <Dropdown trigger={['click']} menu={{ items: [
      { key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined /> },
      ...(isAdmin ? [{ type: 'divider' as const }, statusItem(user), { key: 'lock', label: user.status === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản', icon: user.status === 'LOCKED' ? <UnlockOutlined /> : <LockOutlined />, danger: user.status !== 'LOCKED' }, { key: 'delete', label: 'Xóa người dùng', icon: <DeleteOutlined />, danger: true }] : []),
    ], onClick: ({ key }) => { if (key === 'view') setDetailUserId(user.id); if (key === 'lock') setStatus(user, user.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED'); if (key === 'activate') setStatus(user, 'ACTIVE'); if (key === 'deactivate') setStatus(user, 'INACTIVE'); if (key === 'delete') deleteUser(user) } }}><Button type="text" aria-label={`Thao tác với ${user.fullName}`} icon={<MoreOutlined />} /></Dropdown> },
  ]

  return <>
    <PageHeader breadcrumb={[{ title: 'Hệ thống' }, { title: 'Người dùng' }]} title="Quản lý người dùng" meta="Quản lý tài khoản, vai trò và trạng thái truy cập trong hệ thống CRM." actions={<><Button icon={<DownloadOutlined />} onClick={() => exportUsers()}>Xuất danh sách</Button>{isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>Thêm người dùng</Button>}</>} />
    <div className="user-kpis" aria-label="Tổng quan người dùng">
      <Card className="user-kpi" variant="borderless"><div className="user-kpi__head"><span>TỔNG NGƯỜI DÙNG</span><i className="is-green"><UsergroupAddOutlined /></i></div><strong>{data.length}</strong><small>{roleCount('ADMIN')} Admin · {roleCount('MANAGER')} Manager · {roleCount('SALES')} Sales</small></Card>
      <Card className="user-kpi" variant="borderless"><div className="user-kpi__head"><span>ĐANG HOẠT ĐỘNG</span><i className="is-teal"><SafetyCertificateOutlined /></i></div><strong>{count('ACTIVE')} <em>ACTIVE</em></strong><div className="user-kpi__progress"><span>Tỷ lệ hoạt động</span><b>{activeRate}%</b></div><Progress percent={activeRate} showInfo={false} size="small" strokeColor="#16A34A" trailColor="#e6f4ea" /></Card>
      <Card className="user-kpi" variant="borderless"><div className="user-kpi__head"><span>BỊ KHÓA / VÔ HIỆU HÓA</span><i className="is-red"><LockOutlined /></i></div><strong className="is-danger">{count('LOCKED') + count('INACTIVE')}</strong><small>{count('LOCKED')} Đã khóa <b>·</b> {count('INACTIVE')} Vô hiệu hóa</small></Card>
      <Card className="user-kpi" variant="borderless"><div className="user-kpi__head"><span>PHÂN BỐ THEO VAI TRÒ</span><i className="is-blue"><TeamOutlined /></i></div><div className="user-role-distribution"><span>ADMIN <b>{roleCount('ADMIN')}</b></span><span>MANAGER <b>{roleCount('MANAGER')}</b></span><span>SALES <b>{roleCount('SALES')}</b></span></div><div className="user-role-bars"><i style={{ width: `${data.length ? (roleCount('ADMIN') / data.length) * 100 : 0}%` }} /><i style={{ width: `${data.length ? (roleCount('MANAGER') / data.length) * 100 : 0}%` }} /><i style={{ width: `${data.length ? (roleCount('SALES') / data.length) * 100 : 0}%` }} /></div><small>{roleCount('ADMIN')} quản trị · {roleCount('MANAGER')} quản lý · {roleCount('SALES')} kinh doanh</small></Card>
    </div>
    <Card className="stitch-card users-table-card" variant="borderless" styles={{ body: { padding: 20 } }}>
      <div className="users-toolbar">
        <Input allowClear prefix={<SearchOutlined />} aria-label="Tìm kiếm người dùng" placeholder="Tìm theo tên, username, email, số điện thoại..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <Select allowClear aria-label="Lọc theo vai trò" placeholder="Tất cả vai trò" value={role} onChange={setRole} options={USER_ROLES.map(({ value, label }) => ({ value, label }))} />
        <Select allowClear aria-label="Lọc theo trạng thái" placeholder="Tất cả trạng thái" value={userStatus} onChange={setUserStatus} options={USER_STATUSES} />
        <Button type="text" onClick={() => { setKeyword(''); setRole(undefined); setUserStatus(undefined) }}>Xóa lọc</Button>
      </div>
      {selected.length > 0 && <div className="users-bulkbar"><span><b>{selected.length}</b> Đã chọn {selected.length} người dùng <small>Giữ Shift rồi click checkbox để chọn dải.</small></span><div><Button size="small" danger icon={<LockOutlined />} onClick={() => bulkStatus('LOCKED')}>Khóa tài khoản</Button><Button size="small" icon={<LockOutlined />} onClick={() => bulkStatus('INACTIVE')}>Vô hiệu hóa</Button><Button size="small" danger icon={<DeleteOutlined />} onClick={bulkDelete}>Xóa ({selectedUsers.length})</Button><Button size="small" icon={<DownloadOutlined />} onClick={() => exportUsers(selectedUsers)}>Xuất dữ liệu</Button><Button size="small" type="text" onClick={() => setSelected([])}>Bỏ chọn</Button></div></div>}
      {isError ? <Empty description="Không thể tải danh sách người dùng." image={Empty.PRESENTED_IMAGE_SIMPLE}><Button type="primary" onClick={() => void refetch()}>Thử lại</Button></Empty> : <Table rowKey="id" columns={columns} dataSource={rows} loading={isLoading} rowSelection={{ selectedRowKeys: selected, onChange: (keys) => setSelected(keys.map(String)), onSelectMultiple: (checked, _rows, changedRows) => setSelected((keys) => checked ? [...new Set([...keys, ...changedRows.map((user) => user.id)])] : keys.filter((key) => !changedRows.some((user) => user.id === key))), renderCell: (checked, _user, _index, originNode) => <span onMouseDown={(event) => { if (event.button === 0) dragSelection.current = { active: true, shouldSelect: !checked } }}>{originNode}</span>, preserveSelectedRowKeys: true }} onRow={(user) => ({ onMouseEnter: () => dragSelect(user) })} scroll={{ x: 'max-content' }} pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50], showTotal: (total, range) => `Hiển thị ${range[0]}–${range[1]} trong tổng số ${total} người dùng` }} locale={{ emptyText: 'Không có người dùng phù hợp' }} />}
    </Card>
    {isAdmin && <CreateUserModal open={createOpen} submitting={create.isPending} onCancel={() => setCreateOpen(false)} onSubmit={createUser} />}
    <UserDetailDrawer userId={detailUserId} onClose={() => setDetailUserId(undefined)} />
  </>
}
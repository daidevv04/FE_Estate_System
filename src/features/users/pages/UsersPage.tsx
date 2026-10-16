import { ClockCircleOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, LockOutlined, MailOutlined, PlusOutlined, ReloadOutlined, SafetyCertificateOutlined, SearchOutlined, TeamOutlined, UserOutlined, UsergroupAddOutlined } from '@ant-design/icons'
import { App, Avatar, Button, Card, Col, Empty, Input, Row, Select, Table, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDate } from '@/lib/format'
import { useAuthStore } from '@/store/authStore'
import { tokens as t } from '@/theme/tokens'
import { USER_ROLES, USER_STATUSES, apiErrorMessage, useUserMutations, useUsers, type CreateUserInput, type ManagedUser, type UserStatus } from '../api'
import { CreateUserModal } from '../components/CreateUserModal'
import { UserDetailDrawer } from '../components/UserDetailDrawer'
import { RolePill, StatusPill } from '../components/UserPills'
import { KpiCard } from '@/components/common/KpiCard'
import { SelectableTableContainer } from '@/components/common/SelectableTableContainer'
import './Users.css'

const initials = (name: string) => name.trim().split(/\s+/).map((word) => word[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
const avatarColor = (seed: string) => ['#087f43', '#0d9488', '#5b4cc4', '#0284c7'][[...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4]

export function UsersPage() {
  const { message, modal } = App.useApp()
  const userRole = useAuthStore((s) => s.user?.role)
  const currentUserId = useAuthStore((s) => s.user?.id)
  const isAdmin = userRole === 'ADMIN'
  const isManager = userRole === 'MANAGER'
  const canManageUsers = isAdmin || isManager

  const { data = [], isLoading, isError, refetch } = useUsers()
  const { create, status, remove } = useUserMutations()
  const [keyword, setKeyword] = useState('')
  const [role, setRole] = useState<string>()
  const [userStatus, setUserStatus] = useState<UserStatus>()
  const [selected, setSelected] = useState<string[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [detailUserId, setDetailUserId] = useState<string>()

  const rows = useMemo(() => data.filter((user) => {
    const q = keyword.trim().toLocaleLowerCase('vi')
    return (!q || [user.fullName, user.username, user.email ?? '', user.phone ?? ''].some((value) => value.toLocaleLowerCase('vi').includes(q))) && (!role || user.role === role) && (!userStatus || user.status === userStatus)
  }), [data, keyword, role, userStatus])

  const count = (value: UserStatus) => data.filter((u) => u.status === value).length
  const activeRate = data.length ? Math.round((count('ACTIVE') / data.length) * 100) : 0
  const roleCount = (value: ManagedUser['role']) => data.filter((u) => u.role === value).length
  const selectedUsers = data.filter((u) => selected.includes(u.id))

  // For manager, bulk actions can only be applied to SALES accounts
  const invalidSelectionForManager = isManager && selectedUsers.some((u) => u.role !== 'SALES' || u.id === currentUserId)

  const bulkStatus = (next: UserStatus) => {
    if (!selectedUsers.length) return
    if (invalidSelectionForManager) {
      return message.error('Quản lý chỉ được phép cập nhật trạng thái của nhân viên kinh doanh (Sales) trong đội ngũ')
    }
    modal.confirm({
      title: `Cập nhật trạng thái ${selectedUsers.length} người dùng?`,
      content: `Tất cả tài khoản đã chọn sẽ chuyển thành “${USER_STATUSES.find((x) => x.value === next)?.label}”.`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      okButtonProps: next === 'LOCKED' ? { danger: true } : undefined,
      onOk: () => Promise.all(selectedUsers.map((user) => status.mutateAsync({ id: user.id, status: next }))).then(() => {
        setSelected([])
        message.success('Đã cập nhật trạng thái tài khoản')
      }).catch((e) => {
        message.error(apiErrorMessage(e))
        throw e
      }),
    })
  }

  const bulkDelete = () => {
    if (!selectedUsers.length) return
    if (invalidSelectionForManager) {
      return message.error('Quản lý chỉ được phép xóa tài khoản nhân viên kinh doanh (Sales) trong đội ngũ')
    }
    modal.confirm({
      title: `Xóa ${selectedUsers.length} tài khoản đã chọn?`,
      content: `Hành động này không hoàn tác được. ${selectedUsers.length} tài khoản sẽ bị xóa vĩnh viễn khỏi hệ thống.`,
      okText: `Xóa ${selectedUsers.length} tài khoản`,
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: () => Promise.all(selectedUsers.map((user) => remove.mutateAsync(user.id))).then(() => {
        setSelected([])
        message.success(`Đã xóa ${selectedUsers.length} tài khoản`)
      }).catch((e) => {
        message.error(apiErrorMessage(e))
        throw e
      }),
    })
  }

  const exportUsers = (items = rows) => {
    const quote = (value: string | null | undefined) => `"${(value ?? '').replaceAll('"', '""')}"`
    const csv = ['Họ và tên,Username,Email,Số điện thoại,Vai trò,Trạng thái', ...items.map((u) => [u.fullName, u.username, u.email, u.phone, u.role, u.status].map(quote).join(','))].join('\n')
    const href = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = isManager ? 'nhan-su-doi-ngu.csv' : 'nguoi-dung.csv'
    anchor.click()
    URL.revokeObjectURL(href)
  }

  const createUser = (body: CreateUserInput) => create.mutate(body, {
    onSuccess: () => {
      setCreateOpen(false)
      message.success(`Đã tạo tài khoản ${body.username}`)
    },
    onError: (e) => message.error(apiErrorMessage(e)),
  })

  const columns: ColumnsType<ManagedUser> = [
    {
      title: (
        <span>
          <UserOutlined style={{ marginRight: 6, color: '#059669' }} />
          {isManager ? 'Nhân viên' : 'Người dùng'}
        </span>
      ),
      key: 'user',
      width: 240,
      fixed: 'left',
      render: (_, user) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar size={34} style={{ background: avatarColor(user.id), fontWeight: 600, flexShrink: 0 }}>
            {initials(user.fullName)}
          </Avatar>
          <div style={{ minWidth: 0, lineHeight: 1.35 }}>
            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.fullName} {user.id === currentUserId && <span style={{ fontSize: 11, color: t.colorBrand, fontWeight: 500 }}>(Tôi)</span>}
            </div>
            <div style={{ fontSize: 12, color: t.colorTextMuted }}>@{user.username}</div>
          </div>
        </div>
      ),
    },
    {
      title: (
        <span>
          <MailOutlined style={{ marginRight: 6, color: '#059669' }} />
          Email
        </span>
      ),
      dataIndex: 'email',
      width: 220,
      ellipsis: true,
      render: (email) => <span style={{ fontSize: 13, color: '#334155' }}>{email || '—'}</span>,
    },
    {
      title: (
        <span>
          <TeamOutlined style={{ marginRight: 6, color: '#059669' }} />
          Vai trò
        </span>
      ),
      dataIndex: 'role',
      width: 140,
      render: (_, user) => <RolePill role={user.role} />,
    },
    {
      title: (
        <span>
          <SafetyCertificateOutlined style={{ marginRight: 6, color: '#059669' }} />
          Trạng thái
        </span>
      ),
      dataIndex: 'status',
      width: 140,
      render: (_, user) => <StatusPill status={user.status} />,
    },
    {
      title: (
        <span>
          <LockOutlined style={{ marginRight: 6, color: '#059669' }} />
          Bảo mật 2FA
        </span>
      ),
      key: 'security',
      width: 130,
      render: (_, user) => (
        <Tooltip title={user.is2faEnabled === null ? 'Chưa có dữ liệu 2FA từ API' : user.is2faEnabled ? 'Xác thực 2FA đã bật' : 'Xác thực 2FA chưa bật'}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            fontWeight: 500,
            color: user.is2faEnabled ? t.colorSuccessText : t.colorTextMuted,
          }}>
            <SafetyCertificateOutlined style={{ color: user.is2faEnabled ? t.colorSuccess : t.colorTextMuted }} />
            2FA
          </span>
        </Tooltip>
      ),
    },
    {
      title: (
        <span>
          <ClockCircleOutlined style={{ marginRight: 6, color: '#059669' }} />
          Cập nhật
        </span>
      ),
      dataIndex: 'updatedAt',
      width: 130,
      render: (value: string | null) => (
        <span className="stitch-num" style={{ whiteSpace: 'nowrap', fontSize: 13, color: '#64748b' }}>
          {value ? formatDate(value) : '—'}
        </span>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        breadcrumb={isAdmin
          ? [{ title: 'Hệ thống' }, { title: 'Người dùng' }]
          : [{ title: 'Nhân sự' }, { title: 'Nhân viên' }]}
        title={isAdmin ? 'Quản lý người dùng' : 'Nhân viên'}
        meta={isAdmin
          ? 'Quản lý tài khoản, vai trò và trạng thái truy cập trong hệ thống CRM.'
          : 'Quản lý chuyên viên kinh doanh (Sales) thuộc các dự án phụ trách và nhân sự do bạn quản lý.'}
        actions={(
          <>
            <Button icon={<DownloadOutlined />} onClick={() => exportUsers()}>Xuất danh sách</Button>
            {canManageUsers && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                {isAdmin ? 'Thêm người dùng' : 'Thêm nhân viên'}
              </Button>
            )}
          </>
        )}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard
            tone="green"
            label={isAdmin ? 'Tổng người dùng' : 'Tổng nhân sự'}
            value={String(data.length)}
            sub={isAdmin
              ? `${roleCount('ADMIN')} Admin · ${roleCount('MANAGER')} Manager · ${roleCount('SALES')} Sales`
              : `${roleCount('SALES')} Sales · ${roleCount('MANAGER')} Quản lý`}
            icon={<UsergroupAddOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard
            tone="teal"
            label="Đang hoạt động"
            value={String(count('ACTIVE'))}
            sub={`Tỷ lệ hoạt động đạt ${activeRate}%`}
            icon={<SafetyCertificateOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard
            tone={count('LOCKED') + count('INACTIVE') > 0 ? 'red' : 'gray'}
            label="Bị khóa / Vô hiệu hóa"
            value={String(count('LOCKED') + count('INACTIVE'))}
            sub={`${count('LOCKED')} đã khóa · ${count('INACTIVE')} vô hiệu hóa`}
            icon={<LockOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard
            tone="blue"
            label="Chuyên viên kinh doanh"
            value={String(roleCount('SALES'))}
            sub={isAdmin ? `${roleCount('MANAGER')} Quản lý · ${roleCount('ADMIN')} Quản trị` : 'Trực tiếp tư vấn khách hàng'}
            icon={<TeamOutlined />}
          />
        </Col>
      </Row>

      <Card className="stitch-card crm-filter-card" variant="borderless" style={{ marginTop: 16 }} styles={{ body: { padding: '12px 16px' } }}>
        <div className="crm-filter-bar">
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            aria-label="Tìm kiếm người dùng"
            placeholder="Tìm theo tên, email, SĐT..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ flex: '2 1 240px', minWidth: 200 }}
          />
          {isAdmin && (
            <Select
              allowClear
              aria-label="Lọc theo vai trò"
              placeholder="Tất cả vai trò"
              value={role}
              onChange={setRole}
              options={USER_ROLES.map(({ value, label }) => ({ value, label }))}
              style={{ flex: '1 1 150px', minWidth: 130 }}
            />
          )}
          <Select
            allowClear
            aria-label="Lọc theo trạng thái"
            placeholder="Tất cả trạng thái"
            value={userStatus}
            onChange={setUserStatus}
            options={USER_STATUSES}
            style={{ flex: '1 1 150px', minWidth: 130 }}
          />
          {(keyword || role || userStatus) && (
            <Button
              className="crm-filter-clear-btn"
              icon={<ReloadOutlined />}
              onClick={() => { setKeyword(''); setRole(undefined); setUserStatus(undefined) }}
            >
              Xoá lọc
            </Button>
          )}
        </div>
      </Card>

      <Card className="stitch-card" variant="borderless" style={{ marginTop: 16 }} styles={{ body: { padding: 20 } }}>
        {selected.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 14,
            padding: '10px 14px',
            borderRadius: t.radiusMd,
            background: t.colorSurfaceAlt,
          }}>
            <span style={{ fontWeight: 600 }}>Đã chọn {selected.length} người dùng</span>
            <Tooltip title={selected.length !== 1 ? 'Chỉ xem chi tiết / sửa khi chọn 1 người dùng' : undefined}>
              <span>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  disabled={selected.length !== 1}
                  style={{ opacity: selected.length !== 1 ? 0.45 : 1 }}
                  onClick={() => setDetailUserId(selected[0])}
                >
                  Chi tiết / Sửa
                </Button>
              </span>
            </Tooltip>
            <Button
              icon={<LockOutlined />}
              disabled={invalidSelectionForManager}
              onClick={() => bulkStatus('LOCKED')}
            >
              Khóa tài khoản ({selected.length})
            </Button>
            <Button
              icon={<LockOutlined />}
              disabled={invalidSelectionForManager}
              onClick={() => bulkStatus('INACTIVE')}
            >
              Vô hiệu hóa ({selected.length})
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={invalidSelectionForManager}
              onClick={bulkDelete}
            >
              Xóa ({selectedUsers.length})
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => exportUsers(selectedUsers)}>Xuất dữ liệu</Button>
            <div style={{ flex: 1 }} />
            <Button type="text" onClick={() => setSelected([])}>Bỏ chọn</Button>
          </div>
        )}
        {isError ? (
          <Empty description="Không thể tải danh sách người dùng." image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button type="primary" onClick={() => void refetch()}>Thử lại</Button>
          </Empty>
        ) : (
          <SelectableTableContainer
            items={rows}
            selectedKeys={selected}
            onSelectionChange={(keys) => setSelected(keys)}
            hintText="💡 Mẹo: Nhấn giữ chuột kéo để bôi đen chọn nhiều dòng, hoặc giữ Shift + Click để chọn dải"
          >
            <Table<ManagedUser>
              rowKey="id"
              size="middle"
              columns={columns}
              dataSource={rows}
              loading={isLoading}
              scroll={{ x: 1000 }}
              rowSelection={{
                selectedRowKeys: selected,
                onChange: (keys) => setSelected(keys.map(String)),
                preserveSelectedRowKeys: true,
              }}
              onRow={(user) => ({
                onClick: (e) => {
                  const target = e.target as HTMLElement
                  if (target.closest('.ant-checkbox-wrapper') || target.closest('button') || target.closest('a')) return
                  setDetailUserId(user.id)
                },
                style: { cursor: 'pointer' },
              })}
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50],
                showTotal: (total, range) => `Hiển thị ${range[0]} - ${range[1]} trong tổng số ${total} người dùng`,
              }}
              locale={{ emptyText: 'Không có người dùng phù hợp' }}
            />
          </SelectableTableContainer>
        )}
      </Card>
      {canManageUsers && (
        <CreateUserModal
          open={createOpen}
          isManager={isManager}
          submitting={create.isPending}
          onCancel={() => setCreateOpen(false)}
          onSubmit={createUser}
        />
      )}
      <UserDetailDrawer userId={detailUserId} onClose={() => setDetailUserId(undefined)} />
    </>
  )
}
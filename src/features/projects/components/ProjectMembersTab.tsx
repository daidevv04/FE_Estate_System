import {
  CrownOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  App,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import { useMemo, useState } from 'react'
import { formatDate } from '@/lib/format'
import { useUsers } from '@/features/users/api'
import { useAuthStore } from '@/store/authStore'
import { tokens } from '@/theme/tokens'
import {
  apiErrorMessage,
  useProjectMembers,
  useProjectMutations,
  type ProjectAssignmentRole,
  type ProjectMember,
  type UUID,
} from '../api'

interface Props {
  projectId: UUID
  projectName: string
  isAdmin: boolean
}

export function ProjectMembersTab({ projectId, projectName, isAdmin }: Props) {
  const { message, modal } = App.useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'MANAGER' | 'SALES'>('ALL')
  const [selectedRole, setSelectedRole] = useState<ProjectAssignmentRole>('MANAGER')
  const [form] = Form.useForm()

  const membersQuery = useProjectMembers(projectId)
  const usersQuery = useUsers()
  const mutations = useProjectMutations()
  const currentUser = useAuthStore((s) => s.user)

  const members = membersQuery.data ?? []
  const allUsers = usersQuery.data ?? []

  const isProjectManager = useMemo(
    () => members.some((m) => m.userId === currentUser?.id && m.assignedRole === 'MANAGER'),
    [members, currentUser?.id]
  )
  const canManageMembers = isAdmin || isProjectManager

  // Map user ID to user details for display
  const userMap = useMemo(() => {
    const map = new Map<string, (typeof allUsers)[0]>()
    allUsers.forEach((u) => map.set(u.id, u))
    return map
  }, [allUsers])

  // Count stats
  const managerCount = useMemo(
    () => members.filter((m) => m.assignedRole === 'MANAGER').length,
    [members]
  )
  const salesCount = useMemo(
    () => members.filter((m) => m.assignedRole === 'SALES').length,
    [members]
  )

  // Available active users not yet assigned to this project
  const assignedUserIds = useMemo(() => new Set(members.map((m) => m.userId)), [members])
  const assignableUsers = useMemo(
    () => allUsers.filter((u) => !assignedUserIds.has(u.id) && u.status === 'ACTIVE'),
    [allUsers, assignedUserIds]
  )

  // Filtered members by search and role
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (roleFilter !== 'ALL' && m.assignedRole !== roleFilter) {
        return false
      }
      if (!searchKeyword.trim()) return true
      const u = userMap.get(m.userId)
      const q = searchKeyword.toLowerCase().trim()
      const fullName = (u?.fullName || '').toLowerCase()
      const username = (u?.username || '').toLowerCase()
      const email = (u?.email || '').toLowerCase()
      const phone = (u?.phone || '').toLowerCase()
      return (
        fullName.includes(q) ||
        username.includes(q) ||
        email.includes(q) ||
        phone.includes(q)
      )
    })
  }, [members, roleFilter, searchKeyword, userMap])

  const handleRemove = (member: ProjectMember) => {
    const targetUser = userMap.get(member.userId)
    const name = targetUser?.fullName || targetUser?.username || 'nhân sự này'
    const isManager = member.assignedRole === 'MANAGER'

    modal.confirm({
      title: `Gỡ phân công ${name}?`,
      icon: <ExclamationCircleFilled style={{ color: '#BA1A1A' }} />,
      content: (
        <div style={{ marginTop: 8 }}>
          <p style={{ color: tokens.colorText, marginBottom: 8 }}>
            Bạn đang yêu cầu gỡ phân công <strong>{name}</strong> khỏi dự án{' '}
            <strong>{projectName}</strong>.
          </p>
          {isManager ? (
            <div
              style={{
                backgroundColor: tokens.tones.red.bg,
                border: `1px solid ${tokens.tones.red.border}`,
                padding: '10px 14px',
                borderRadius: tokens.radiusSm,
                color: tokens.tones.red.fg,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <strong>Cảnh báo quan trọng:</strong> Khi bị gỡ, Manager này sẽ lập tức mất quyền truy
              cập, giám sát danh sách Leads, phê duyệt Deals và theo dõi Doanh thu thuộc dự án này.
            </div>
          ) : (
            <div
              style={{
                backgroundColor: tokens.tones.amber.bg,
                border: `1px solid ${tokens.tones.amber.border}`,
                padding: '10px 14px',
                borderRadius: tokens.radiusSm,
                color: tokens.tones.amber.fg,
                fontSize: 13,
              }}
            >
              Sales này sẽ không còn quyền tạo giao dịch hoặc được phân bổ giỏ hàng cho dự án{' '}
              {projectName}.
            </div>
          )}
        </div>
      ),
      okText: 'Xác nhận gỡ',
      cancelText: 'Giữ lại',
      okButtonProps: { danger: true, size: 'middle' },
      cancelButtonProps: { size: 'middle' },
      onOk: async () => {
        try {
          await mutations.removeMember.mutateAsync({ projectId, userId: member.userId })
          message.success(`Đã gỡ ${name} khỏi dự án thành công`)
        } catch (error) {
          message.error(apiErrorMessage(error))
          throw error
        }
      },
    })
  }

  const handleAssign = async () => {
    try {
      const values = await form.validateFields()
      await mutations.assignMember.mutateAsync({
        projectId,
        userId: values.userId,
        assignedRole: selectedRole,
      })
      message.success('Đã phân công nhân sự vào dự án thành công')
      form.resetFields()
      setSelectedRole('MANAGER')
      setModalOpen(false)
    } catch (error) {
      if ((error as { errorFields?: unknown }).errorFields) return
      message.error(apiErrorMessage(error))
    }
  }

  const columns = [
    {
      title: 'Nhân sự',
      key: 'user',
      render: (_: unknown, record: ProjectMember) => {
        const u = userMap.get(record.userId)
        const isManager = record.assignedRole === 'MANAGER'
        const initials = (u?.fullName || u?.username || 'U')
          .split(' ')
          .filter(Boolean)
          .slice(-2)
          .map((n) => n[0])
          .join('')
          .toUpperCase()

        return (
          <Space size={14} direction="horizontal" align="center">
            <Badge
              count={
                isManager ? (
                  <CrownOutlined style={{ color: '#F59E0B', fontSize: 13 }} />
                ) : null
              }
              offset={[-2, 34]}
            >
              <Avatar
                size={44}
                style={{
                  background: isManager
                    ? 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)'
                    : 'linear-gradient(135deg, #0EA5E9 0%, #0D9488 100%)',
                  fontWeight: 600,
                  fontSize: 16,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                {initials}
              </Avatar>
            </Badge>
            <div>
              <Typography.Text
                strong
                style={{
                  display: 'block',
                  fontSize: 15,
                  color: tokens.colorText,
                  lineHeight: 1.3,
                }}
              >
                {u?.fullName || u?.username || record.userId}
              </Typography.Text>
              <Space size={8} wrap style={{ marginTop: 4 }}>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  @{u?.username || 'unknown'}
                </Typography.Text>
                {u?.email && (
                  <Tooltip title="Email liên hệ">
                    <span
                      style={{
                        fontSize: 12,
                        color: tokens.colorTextMuted,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <MailOutlined /> {u.email}
                    </span>
                  </Tooltip>
                )}
                {u?.phone && (
                  <Tooltip title="Số điện thoại">
                    <span
                      style={{
                        fontSize: 12,
                        color: tokens.colorTextMuted,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <PhoneOutlined /> {u.phone}
                    </span>
                  </Tooltip>
                )}
              </Space>
            </div>
          </Space>
        )
      },
    },
    {
      title: 'Vai trò trong dự án',
      dataIndex: 'assignedRole',
      key: 'assignedRole',
      width: 260,
      render: (role: ProjectAssignmentRole) => {
        if (role === 'MANAGER') {
          return (
            <Tooltip title="Toàn quyền theo dõi Leads, duyệt hợp đồng Deals và xem báo cáo tài chính của dự án này">
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 9999,
                  backgroundColor: tokens.tones.purple.bg,
                  color: tokens.tones.purple.fg,
                  border: `1px solid ${tokens.tones.purple.border}`,
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                <CrownOutlined style={{ color: tokens.tones.purple.dot }} />
                Trưởng ban quản lý (Manager)
              </span>
            </Tooltip>
          )
        }
        return (
          <Tooltip title="Được phân bổ tư vấn sản phẩm, tạo khách hàng tiềm năng và thực hiện giao dịch cho dự án này">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 9999,
                backgroundColor: tokens.tones.blue.bg,
                color: tokens.tones.blue.fg,
                border: `1px solid ${tokens.tones.blue.border}`,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              <UserOutlined style={{ color: tokens.tones.blue.dot }} />
              Chuyên viên kinh doanh (Sales)
            </span>
          </Tooltip>
        )
      },
    },
    {
      title: 'Ngày phân công',
      dataIndex: 'assignedAt',
      key: 'assignedAt',
      width: 180,
      render: (date: string) => (
        <span style={{ fontSize: 13, color: tokens.colorTextSub }}>
          {formatDate(date)}
        </span>
      ),
    },
    ...(canManageMembers
      ? [
          {
            title: 'Hành động',
            key: 'action',
            width: 110,
            align: 'center' as const,
            render: (_: unknown, record: ProjectMember) => {
              const canRemoveThis = isAdmin || (isProjectManager && record.assignedRole === 'SALES')
              if (!canRemoveThis) {
                return (
                  <Tooltip title="Chỉ Quản trị viên (Admin) mới có quyền gỡ bỏ Quản lý dự án">
                    <span style={{ color: tokens.colorTextMuted, fontSize: 13 }}>—</span>
                  </Tooltip>
                )
              }
              return (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemove(record)}
                  style={{
                    borderRadius: tokens.radiusSm,
                    fontWeight: 500,
                  }}
                >
                  Gỡ bỏ
                </Button>
              )
            },
          },
        ]
      : []),
  ]

  return (
    <Card className="stitch-card" variant="borderless" style={{ borderRadius: tokens.radiusLg }}>
      {/* Top Banner & KPI Stat Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <div
            style={{
              padding: '14px 18px',
              borderRadius: tokens.radiusMd,
              backgroundColor: tokens.colorCanvas,
              border: `1px solid ${tokens.colorBorder}`,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: tokens.tones.green.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: tokens.tones.green.fg,
                fontSize: 20,
              }}
            >
              <TeamOutlined />
            </div>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Tổng quy mô đội ngũ
              </Typography.Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: tokens.colorText }}>
                {members.length} <span style={{ fontSize: 13, fontWeight: 400 }}>nhân sự</span>
              </div>
            </div>
          </div>
        </Col>

        <Col xs={12} sm={8}>
          <div
            style={{
              padding: '14px 18px',
              borderRadius: tokens.radiusMd,
              backgroundColor: tokens.tones.purple.bg,
              border: `1px solid ${tokens.tones.purple.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: '#EDE9FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: tokens.tones.purple.fg,
                fontSize: 20,
              }}
            >
              <CrownOutlined />
            </div>
            <div>
              <Typography.Text style={{ fontSize: 12, color: tokens.tones.purple.fg }}>
                Trưởng ban quản lý
              </Typography.Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: tokens.tones.purple.fg }}>
                {managerCount} <span style={{ fontSize: 13, fontWeight: 400 }}>Manager</span>
              </div>
            </div>
          </div>
        </Col>

        <Col xs={12} sm={8}>
          <div
            style={{
              padding: '14px 18px',
              borderRadius: tokens.radiusMd,
              backgroundColor: tokens.tones.blue.bg,
              border: `1px solid ${tokens.tones.blue.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: '#BAE6FD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: tokens.tones.blue.fg,
                fontSize: 20,
              }}
            >
              <UserOutlined />
            </div>
            <div>
              <Typography.Text style={{ fontSize: 12, color: tokens.tones.blue.fg }}>
                Chuyên viên kinh doanh
              </Typography.Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: tokens.tones.blue.fg }}>
                {salesCount} <span style={{ fontSize: 13, fontWeight: 400 }}>Sales</span>
              </div>
            </div>
          </div>
        </Col>
      </Row>


      {/* Toolbar: Search, Role Filter, Add Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Space size={12} wrap>
          <Input
            placeholder="Tìm kiếm nhân sự theo tên, username, email..."
            prefix={<SearchOutlined style={{ color: tokens.colorTextMuted }} />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: 320, borderRadius: tokens.radiusSm }}
            allowClear
          />
          <Segmented
            value={roleFilter}
            onChange={(val) => setRoleFilter(val as 'ALL' | 'MANAGER' | 'SALES')}
            options={[
              { label: `Tất cả (${members.length})`, value: 'ALL' },
              { label: `Manager (${managerCount})`, value: 'MANAGER' },
              { label: `Sales (${salesCount})`, value: 'SALES' },
            ]}
          />
        </Space>

        {canManageMembers && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields()
              setSelectedRole(isAdmin ? 'MANAGER' : 'SALES')
              setModalOpen(true)
            }}
            style={{
              background: tokens.colorBrandGradient,
              borderColor: tokens.colorBrand,
              borderRadius: tokens.radiusSm,
              height: 40,
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)',
            }}
          >
            {isAdmin ? 'Phân công nhân sự' : 'Thêm Sales vào dự án'}
          </Button>
        )}
      </div>

      {/* Table */}
      <Table
        dataSource={filteredMembers}
        columns={columns}
        rowKey="id"
        loading={membersQuery.isLoading || usersQuery.isLoading}
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Tổng cộng ${total} nhân sự`,
          hideOnSinglePage: true,
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                searchKeyword || roleFilter !== 'ALL' ? (
                  <span>Không tìm thấy nhân sự phù hợp với bộ lọc hiện tại.</span>
                ) : (
                  <div>
                    <Typography.Text strong style={{ display: 'block', fontSize: 15, marginBottom: 6 }}>
                      Dự án chưa được phân công nhân sự
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                      Hiện tại chỉ có Admin giám sát dự án. Hãy gán Manager và Sales để bắt đầu chiến dịch kinh doanh.
                    </Typography.Text>
                    {isAdmin && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          form.resetFields()
                          setSelectedRole('MANAGER')
                          setModalOpen(true)
                        }}
                        style={{
                          background: tokens.colorBrandGradient,
                          borderColor: tokens.colorBrand,
                        }}
                      >
                        Phân công nhân sự đầu tiên
                      </Button>
                    )}
                  </div>
                )
              }
            />
          ),
        }}
      />

      {/* Modal Phân Công Nhân Sự */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 6 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: tokens.tones.green.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: tokens.tones.green.fg,
              }}
            >
              <TeamOutlined style={{ fontSize: 18 }} />
            </div>
            <div>
              <Typography.Title level={5} style={{ margin: 0 }}>
                Phân công nhân sự vào dự án
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                {projectName}
              </Typography.Text>
            </div>
          </div>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleAssign}
        confirmLoading={mutations.assignMember.isPending}
        okText="Lưu phân công"
        cancelText="Hủy"
        destroyOnHidden
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            name="userId"
            label={<strong style={{ fontSize: 14 }}>Chọn nhân sự hệ thống</strong>}
            rules={[{ required: true, message: 'Vui lòng chọn nhân sự' }]}
            extra="Chỉ hiển thị các tài khoản đang hoạt động (ACTIVE) chưa được gán vào dự án này."
          >
            <Select
              placeholder="Gõ tìm kiếm họ tên, username hoặc email..."
              showSearch
              size="large"
              style={{ borderRadius: tokens.radiusSm }}
              filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
              options={assignableUsers.map((u) => ({
                value: u.id,
                label: `${u.fullName || u.username} (@${u.username} · ${u.role})`,
              }))}
            />
          </Form.Item>

          <Form.Item label={<strong style={{ fontSize: 14 }}>Chọn vai trò trong dự án</strong>} required>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Option Manager */}
              <div
                onClick={() => {
                  if (isAdmin) setSelectedRole('MANAGER')
                }}
                style={{
                  padding: '14px 16px',
                  borderRadius: tokens.radiusMd,
                  border: `2px solid ${
                    selectedRole === 'MANAGER' ? tokens.tones.purple.dot : tokens.colorBorder
                  }`,
                  backgroundColor:
                    selectedRole === 'MANAGER' ? tokens.tones.purple.bg : tokens.colorSurface,
                  cursor: isAdmin ? 'pointer' : 'not-allowed',
                  opacity: isAdmin ? 1 : 0.6,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: '#EDE9FE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: tokens.tones.purple.fg,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <CrownOutlined style={{ fontSize: 18 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography.Text strong style={{ fontSize: 15, color: tokens.tones.purple.fg }}>
                      Trưởng ban quản lý (Manager)
                    </Typography.Text>
                    {selectedRole === 'MANAGER' ? (
                      <Tag color="purple" style={{ margin: 0, borderRadius: 999 }}>
                        Đang chọn
                      </Tag>
                    ) : !isAdmin ? (
                      <Tag color="default" style={{ margin: 0, borderRadius: 999 }}>
                        Chỉ Admin
                      </Tag>
                    ) : null}
                  </div>
                  <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 4 }}>
                    Toàn quyền giám sát Lead, duyệt Deals, theo dõi Pipeline và phân tích doanh số của dự án này.
                  </Typography.Text>
                </div>
              </div>

              {/* Option Sales */}
              <div
                onClick={() => setSelectedRole('SALES')}
                style={{
                  padding: '14px 16px',
                  borderRadius: tokens.radiusMd,
                  border: `2px solid ${
                    selectedRole === 'SALES' ? tokens.tones.blue.dot : tokens.colorBorder
                  }`,
                  backgroundColor:
                    selectedRole === 'SALES' ? tokens.tones.blue.bg : tokens.colorSurface,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: '#BAE6FD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: tokens.tones.blue.fg,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <UserOutlined style={{ fontSize: 18 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography.Text strong style={{ fontSize: 15, color: tokens.tones.blue.fg }}>
                      Chuyên viên kinh doanh (Sales)
                    </Typography.Text>
                    {selectedRole === 'SALES' && (
                      <Tag color="blue" style={{ margin: 0, borderRadius: 999 }}>
                        Đang chọn
                      </Tag>
                    )}
                  </div>
                  <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 4 }}>
                    Được phân bổ tư vấn quỹ căn, tạo khách hàng tiềm năng và thực hiện giao dịch cho dự án.
                  </Typography.Text>
                </div>
              </div>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

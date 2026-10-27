import React, { useMemo, useState } from 'react'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileDoneOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  UserOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import {
  Button,
  Alert,
  Card,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Progress,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { KpiCard } from '@/components/common/KpiCard'
import { paths } from '@/routes/paths'
import { formatDate, formatDateTime, formatMoney } from '@/lib/format'
import { useDeals } from '@/features/deals/api'
import { useProjects } from '@/features/projects/api'
import {
  type CommissionMilestoneStatus,
  type DealCommission,
  type DealCommissionMilestone,
  useAllCommissions,
  useApproveMilestone,
  useMyCommissions,
  usePayoutMilestone,
} from '../api'
import { ProjectCommissionPolicyCard } from '../components/ProjectCommissionPolicyCard'
import './CommissionsPage.css'

export function CommissionsPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN'
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const [activeTab, setActiveTab] = useState(isAdmin ? 'all' : 'my')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [payoutModalMilestone, setPayoutModalMilestone] = useState<DealCommissionMilestone | null>(null)
  const [payoutNote, setPayoutNote] = useState('')

  // Đảm bảo Admin luôn ở tab quản lý chung
  React.useEffect(() => {
    if (isAdmin && activeTab === 'my') {
      setActiveTab('all')
    }
  }, [isAdmin, activeTab])

  // Queries
  const myQuery = useMyCommissions()
  const allQuery = useAllCommissions()
  const dealsQuery = useDeals()
  const projectsQuery = useProjects({})

  // Mutations
  const approveMutation = useApproveMilestone()
  const payoutMutation = usePayoutMilestone()

  const projects = projectsQuery.data?.content ?? []
  const deals = dealsQuery.data?.content ?? []

  // Default select first project for policy tab
  React.useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  const activeQuery = (isAdmin || activeTab === 'all') && canManage ? allQuery : myQuery
  const activeData = activeQuery.data
  const summary = activeData?.summary ?? {
    totalExpected: 0,
    totalPaid: 0,
    totalEligible: 0,
    totalPending: 0,
  }
  const commissions = activeData?.commissions ?? []
  const legacyCount = commissions.filter((commission) => commission.status === 'APPROVED' && !commission.milestones?.length).length

  const dealMap = useMemo(() => {
    const map = new Map<string, (typeof deals)[0]>()
    deals.forEach((d) => map.set(d.id, d))
    return map
  }, [deals])

  const handleApprove = (milestoneId: string) => {
    approveMutation.mutate(
      { milestoneId },
      {
        onSuccess: () => {
          message.success('Đã phê duyệt đợt giải ngân hoa hồng!')
        },
        onError: (err: any) => {
          message.error(err?.response?.data?.message || 'Lỗi phê duyệt đợt hoa hồng')
        },
      },
    )
  }

  const handlePayout = () => {
    if (!payoutModalMilestone) return
    payoutMutation.mutate(
      { milestoneId: payoutModalMilestone.id, note: payoutNote },
      {
        onSuccess: () => {
          message.success('Xác nhận chi trả hoa hồng thành công!')
          setPayoutModalMilestone(null)
          setPayoutNote('')
        },
        onError: (err: any) => {
          message.error(err?.response?.data?.message || 'Lỗi ghi nhận chi trả')
        },
      },
    )
  }

  const renderMilestoneStatusTag = (status: CommissionMilestoneStatus) => {
    switch (status) {
      case 'PAID':
        return <span className="milestone-pill milestone-pill--paid"><CheckCircleOutlined /> Đã chi trả</span>
      case 'APPROVED':
        return <span className="milestone-pill milestone-pill--approved"><CheckCircleOutlined /> Đã duyệt chi</span>
      case 'ELIGIBLE':
        return <span className="milestone-pill milestone-pill--eligible"><ThunderboltOutlined /> Đủ điều kiện nhận</span>
      default:
        return <span className="milestone-pill milestone-pill--pending"><ClockCircleOutlined /> Chưa đạt mốc</span>
    }
  }

  // Cột bảng cá nhân Sales
  const salesColumns: ColumnsType<DealCommission> = [
    {
      title: 'Hợp đồng / Căn hộ',
      key: 'deal',
      render: (_, record) => {
        const deal = dealMap.get(record.dealId)
        return (
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{deal?.contractCode || record.dealId}</div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Ký ngày: {deal?.signedDate ? formatDate(deal.signedDate) : '—'}
            </Typography.Text>
          </div>
        )
      },
    },
    {
      title: 'Giá trị căn',
      dataIndex: 'contractValue',
      align: 'right',
      render: (v: number) => <span style={{ fontWeight: 600 }}>{formatMoney(v)}</span>,
    },
    {
      title: 'Tỷ lệ %',
      dataIndex: 'commissionRate',
      align: 'center',
      render: (v: number) => <Tag color="blue">{v}%</Tag>,
    },
    {
      title: 'Hoa hồng cơ bản',
      dataIndex: 'commissionAmount',
      align: 'right',
      render: (v: number) => formatMoney(v),
    },
    {
      title: 'Thưởng nóng',
      dataIndex: 'bonusAmount',
      align: 'right',
      render: (v: number) => (v > 0 ? <span style={{ color: '#d97706', fontWeight: 600 }}>+{formatMoney(v)}</span> : '—'),
    },
    {
      title: 'Tổng kỳ vọng',
      dataIndex: 'totalExpected',
      align: 'right',
      render: (v: number) => <span style={{ fontWeight: 700, color: '#059669' }}>{formatMoney(v)}</span>,
    },
    {
      title: 'Đã thực nhận',
      dataIndex: 'totalPaid',
      align: 'right',
      render: (v: number, record) => {
        const pct = record.totalExpected > 0 ? Math.round((v / record.totalExpected) * 100) : 0
        return (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: v > 0 ? '#059669' : '#64748b' }}>{formatMoney(v)}</div>
            <Progress percent={pct} size="small" strokeColor="#059669" style={{ marginBottom: 0 }} />
          </div>
        )
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      align: 'center',
      render: (status) => {
        if (status === 'APPROVED') return <Tag color="orange">Đã duyệt (dữ liệu cũ)</Tag>
        if (status === 'FULLY_PAID') return <Tag color="green">Đã chi đủ 100%</Tag>
        if (status === 'PARTIALLY_PAID') return <Tag color="cyan">Đã chi 1 phần</Tag>
        return <Tag color="default">Chờ giải ngân</Tag>
      },
    },
  ]

  // Bảng con chi tiết các đợt giải ngân
  const expandedRowRender = (record: DealCommission) => {
    const milestones = record.milestones || []
    return (
      <div style={{ margin: '8px 0', padding: '12px 16px', background: '#f8fafc', borderRadius: 8 }}>
        <Typography.Text strong style={{ fontSize: 13, marginBottom: 8, display: 'block' }}>
          Các đợt giải ngân hoa hồng theo tiến độ thanh toán của khách ({milestones.length} đợt):
        </Typography.Text>
        {milestones.map((m) => (
          <div key={m.id} className="sub-milestone-row">
            <div>
              <span style={{ fontWeight: 600, marginRight: 8 }}>Đợt {m.milestoneNo}: {m.name}</span>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                (Điều kiện: Khách nộp đủ ≥ {m.customerPaidThresholdPct}% · Giải ngân {m.payoutPercentage}%)
              </Typography.Text>
            </div>
            <Space size={16}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatMoney(m.amountExpected)}</span>
              {renderMilestoneStatusTag(m.status)}
              {canManage && m.status === 'ELIGIBLE' && (
                <Popconfirm
                  title="Duyệt chi hoa hồng cho Sales?"
                  description={`Xác nhận duyệt đợt ${m.milestoneNo} với số tiền ${formatMoney(m.amountExpected)}?`}
                  onConfirm={() => handleApprove(m.id)}
                  okText="Duyệt"
                  cancelText="Hủy"
                >
                  <Button size="small" type="primary" loading={approveMutation.isPending}>
                    Duyệt chi
                  </Button>
                </Popconfirm>
              )}
              {canManage && m.status === 'APPROVED' && (
                <Button size="small" type="primary" style={{ background: '#059669' }} onClick={() => setPayoutModalMilestone(m)}>
                  Chi trả
                </Button>
              )}
            </Space>
          </div>
        ))}
      </div>
    )
  }

  // Bảng tổng hợp duyệt chi cho Manager
  const flatMilestones = useMemo(() => {
    const list: Array<DealCommissionMilestone & { contractCode: string; salesId: string }> = []
    commissions.forEach((c) => {
      const deal = dealMap.get(c.dealId)
      const code = deal?.contractCode || c.dealId
      ;(c.milestones || []).forEach((m) => {
        list.push({ ...m, contractCode: code, salesId: c.salesId })
      })
    })
    return list
  }, [commissions, dealMap])

  const managerColumns: ColumnsType<any> = [
    {
      title: 'Hợp đồng',
      dataIndex: 'contractCode',
      render: (v) => <span style={{ fontWeight: 700 }}>{v}</span>,
    },
    {
      title: 'Đợt giải ngân',
      key: 'name',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>Đợt {r.milestoneNo}: {r.name}</div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Ngưỡng nộp: ≥ {r.customerPaidThresholdPct}% · Tỷ lệ chi: {r.payoutPercentage}%
          </Typography.Text>
        </div>
      ),
    },
    {
      title: 'Tiền hoa hồng đợt',
      dataIndex: 'amountExpected',
      align: 'right',
      render: (v) => <span style={{ fontWeight: 700, color: '#059669' }}>{formatMoney(v)}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      align: 'center',
      render: (status: CommissionMilestoneStatus) => renderMilestoneStatusTag(status),
    },
    {
      title: 'Thao tác phê duyệt & chi trả',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space>
          {record.status === 'ELIGIBLE' && (
            <Popconfirm
              title="Xác nhận duyệt đợt giải ngân này?"
              onConfirm={() => handleApprove(record.id)}
              okText="Duyệt"
              cancelText="Hủy"
            >
              <Button size="small" type="primary" loading={approveMutation.isPending}>
                Duyệt chi
              </Button>
            </Popconfirm>
          )}
          {record.status === 'APPROVED' && (
            <Button
              size="small"
              type="primary"
              style={{ background: '#059669', borderColor: '#059669' }}
              onClick={() => setPayoutModalMilestone(record)}
            >
              Chi trả tiền
            </Button>
          )}
          {record.status === 'PAID' && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Đã chi lúc {formatDateTime(record.paidAt)} {record.note ? `(${record.note})` : ''}
            </Typography.Text>
          )}
          {record.status === 'PENDING_MILESTONE' && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Chờ khách nộp tiền
            </Typography.Text>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="commissions-page">
      <PageHeader title="Hoa hồng và thưởng doanh số"
        breadcrumb={[{ title: 'Tổng quan', href: paths.dashboard }, { title: 'Hoa hồng và thưởng' }]}
        meta="Theo dõi hoa hồng và các đợt chi trả theo tiến độ thanh toán của khách hàng."
        actions={<Button icon={<ReloadOutlined />} onClick={() => void activeQuery.refetch()} loading={activeQuery.isFetching}>Làm mới</Button>}
      />
      {activeQuery.isError && <Alert type="error" showIcon message="Không thể tải dữ liệu hoa hồng"
        description="Vui lòng thử lại để cập nhật số liệu."
        action={<Button onClick={() => void activeQuery.refetch()} loading={activeQuery.isFetching}>Thử lại</Button>} />}
      {!activeQuery.isError && legacyCount > 0 && <Alert type="warning" showIcon
        message={`Có ${legacyCount} khoản hoa hồng cũ chưa có lịch giải ngân`}
        description="Giữ nguyên trạng thái và số tiền đã ghi nhận. Hai chỉ số theo đợt tạm để trống; cần đối soát trước khi tạo lịch và duyệt chi." />}

      {/* 4 KPI Cards */}
      <div className="commissions-kpis">
        <KpiCard label="Hoa hồng kỳ vọng" icon={<TrophyOutlined />} tone="green" loading={activeQuery.isLoading} value={activeQuery.isError ? '—' : formatMoney(summary.totalExpected)} />
        <KpiCard label="Đã thực nhận" icon={<CheckCircleOutlined />} tone="teal" loading={activeQuery.isLoading} value={activeQuery.isError ? '—' : formatMoney(summary.totalPaid)} />
        <KpiCard label="Đủ điều kiện, chờ chi" icon={<ThunderboltOutlined />} tone="amber" loading={activeQuery.isLoading} value={activeQuery.isError || legacyCount > 0 ? '—' : formatMoney(summary.totalEligible)} />
        <KpiCard label="Chờ khách thanh toán" icon={<ClockCircleOutlined />} tone="gray" loading={activeQuery.isLoading} value={activeQuery.isError || legacyCount > 0 ? '—' : formatMoney(summary.totalPending)} />
      </div>

      {/* Tabs */}
      <Card className="commissions-content-card stitch-card" variant="borderless" size="small">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            ...(!isAdmin
              ? [
                  {
                    key: 'my',
                    label: (
                      <span>
                        <UserOutlined />
                        Hoa hồng của tôi ({commissions.length})
                      </span>
                    ),
                    children: (
                      <Table<DealCommission>
                        rowKey="id"
                        columns={salesColumns}
                        locale={{ emptyText: 'Chưa có hoa hồng được ghi nhận' }}
                        dataSource={commissions}
                        loading={myQuery.isLoading}
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 900 }}
                        expandable={{
                          expandedRowRender,
                          defaultExpandAllRows: true,
                        }}
                      />
                    ),
                  },
                ]
              : []),
            ...(canManage
              ? [
                  {
                    key: 'all',
                    label: (
                      <span>
                        <FileDoneOutlined />
                        Phê duyệt & Chi trả toàn hệ thống ({flatMilestones.length} đợt)
                      </span>
                    ),
                    children: (
                      <Table
                        rowKey="id"
                        columns={managerColumns}
                        locale={{ emptyText: 'Chưa có đợt hoa hồng cần xử lý' }}
                        dataSource={flatMilestones}
                        loading={allQuery.isLoading}
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 1000 }}
                      />
                    ),
                  },
                  {
                    key: 'policy',
                    label: (
                      <span>
                        <SettingOutlined />
                        Chính sách hoa hồng dự án
                      </span>
                    ),
                    children: (
                      <div style={{ maxWidth: 720, padding: '16px 0' }}>
                        <div style={{ marginBottom: 16 }}>
                          <Typography.Text strong style={{ marginRight: 12 }}>
                            Chọn Dự án áp dụng:
                          </Typography.Text>
                          <Select
                            style={{ width: 280 }}
                            value={selectedProjectId}
                            onChange={setSelectedProjectId}
                            options={projects.map((p) => ({ label: p.name, value: p.id }))}
                          />
                        </div>

                        {selectedProjectId && (
                          <ProjectCommissionPolicyCard projectId={selectedProjectId} canManage={canManage} />
                        )}
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Card>

      {/* Modal Chi trả hoa hồng */}
      <Modal
        open={Boolean(payoutModalMilestone)}
        title="Xác nhận chi trả hoa hồng cho Sales"
        onCancel={() => setPayoutModalMilestone(null)}
        onOk={handlePayout}
        confirmLoading={payoutMutation.isPending}
        okText="Xác nhận chi trả"
        cancelText="Hủy"
      >
        {payoutModalMilestone && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <span>Đợt giải ngân: </span>
              <strong>Đợt {payoutModalMilestone.milestoneNo} - {payoutModalMilestone.name}</strong>
            </div>
            <div style={{ marginBottom: 16 }}>
              <span>Số tiền chi trả: </span>
              <strong style={{ color: '#059669', fontSize: 16 }}>
                {formatMoney(payoutModalMilestone.amountExpected)}
              </strong>
            </div>
            <Form.Item label="Ghi chú chứng từ chi (Số UNC, ngân hàng...)">
              <Input
                placeholder="VD: UNC Techcombank ngày 18/10..."
                value={payoutNote}
                onChange={(e) => setPayoutNote(e.target.value)}
              />
            </Form.Item>
          </div>
        )}
      </Modal>
    </div>
  )
}

import { useState } from 'react'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Progress,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime, formatMoney } from '@/lib/format'
import { useAuthStore } from '@/store/authStore'
import type { Deal } from '@/features/deals/api'
import {
  type CommissionMilestoneStatus,
  type DealCommissionMilestone,
  useApproveMilestone,
  useDealCommission,
  usePayoutMilestone,
} from '../api'

interface Props {
  deal: Deal | null
}

export function DealCommissionSection({ deal }: Props) {
  const user = useAuthStore((s) => s.user)
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const [payoutMilestone, setPayoutMilestone] = useState<DealCommissionMilestone | null>(null)
  const [payoutNote, setPayoutNote] = useState('')

  const { data: commission, isLoading } = useDealCommission(deal?.id)
  const approveMutation = useApproveMilestone()
  const payoutMutation = usePayoutMilestone()

  if (isLoading) {
    return <Card size="small" loading={true} style={{ marginTop: 16 }} />
  }

  if (!commission) {
    return (
      <Card
        size="small"
        style={{ marginTop: 16 }}
        title={
          <Space>
            <TrophyOutlined style={{ color: '#059669' }} />
            <span>Hoa hồng & Thưởng Sales</span>
          </Space>
        }
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Chưa phát sinh bản ghi hoa hồng cho hợp đồng này (chỉ áp dụng với hợp đồng đã ký và dự án có chính sách hoa hồng)."
        />
      </Card>
    )
  }

  const renderStatus = (status: CommissionMilestoneStatus) => {
    switch (status) {
      case 'PAID':
        return <Tag color="green" icon={<CheckCircleOutlined />}>Đã chi trả</Tag>
      case 'APPROVED':
        return <Tag color="blue" icon={<CheckCircleOutlined />}>Đã duyệt chi</Tag>
      case 'ELIGIBLE':
        return <Tag color="warning" icon={<ThunderboltOutlined />}>Đủ điều kiện nhận</Tag>
      default:
        return <Tag color="default" icon={<ClockCircleOutlined />}>Chờ khách nộp tiền</Tag>
    }
  }

  const handleApprove = (milestoneId: string) => {
    approveMutation.mutate(
      { milestoneId },
      {
        onSuccess: () => message.success('Đã phê duyệt đợt giải ngân hoa hồng!'),
        onError: (err: any) => message.error(err?.response?.data?.message || 'Lỗi phê duyệt'),
      },
    )
  }

  const handlePayout = () => {
    if (!payoutMilestone) return
    payoutMutation.mutate(
      { milestoneId: payoutMilestone.id, note: payoutNote },
      {
        onSuccess: () => {
          message.success('Ghi nhận chi trả hoa hồng thành công!')
          setPayoutMilestone(null)
          setPayoutNote('')
        },
        onError: (err: any) => message.error(err?.response?.data?.message || 'Lỗi chi trả'),
      },
    )
  }

  const paidPct = commission.totalExpected > 0 ? Math.round((commission.totalPaid / commission.totalExpected) * 100) : 0

  const columns: ColumnsType<DealCommissionMilestone> = [
    {
      title: 'Đợt',
      dataIndex: 'milestoneNo',
      width: 70,
      align: 'center',
      render: (v) => <span style={{ fontWeight: 600 }}>#{v}</span>,
    },
    {
      title: 'Tên đợt giải ngân',
      dataIndex: 'name',
      render: (name, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            Khách nộp đủ ≥ {r.customerPaidThresholdPct}% · Chi {r.payoutPercentage}%
          </Typography.Text>
        </div>
      ),
    },
    {
      title: 'Số tiền đợt',
      dataIndex: 'amountExpected',
      align: 'right',
      render: (v) => <span style={{ fontWeight: 700, color: '#059669' }}>{formatMoney(v)}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      align: 'center',
      render: (s: CommissionMilestoneStatus) => renderStatus(s),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center',
      render: (_, r) => (
        <Space size="small">
          {canManage && r.status === 'ELIGIBLE' && (
            <Popconfirm
              title="Xác nhận duyệt đợt giải ngân?"
              onConfirm={() => handleApprove(r.id)}
              okText="Duyệt"
              cancelText="Hủy"
            >
              <Button size="small" type="primary" loading={approveMutation.isPending}>
                Duyệt chi
              </Button>
            </Popconfirm>
          )}
          {canManage && r.status === 'APPROVED' && (
            <Button
              size="small"
              type="primary"
              style={{ background: '#059669', borderColor: '#059669' }}
              onClick={() => setPayoutMilestone(r)}
            >
              Chi trả
            </Button>
          )}
          {r.status === 'PAID' && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {r.paidAt ? formatDateTime(r.paidAt) : 'Đã chi'}
            </Typography.Text>
          )}
          {r.status === 'PENDING_MILESTONE' && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Chờ đủ %
            </Typography.Text>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Card
      size="small"
      style={{ marginTop: 16 }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <TrophyOutlined style={{ color: '#059669', fontSize: 16 }} />
            <span style={{ fontWeight: 700 }}>Hoa hồng & Thưởng Doanh Số Sales</span>
          </Space>
          <Tag color={commission.status === 'APPROVED' ? 'orange' : commission.status === 'FULLY_PAID' ? 'green' : 'blue'}>
            {commission.status === 'APPROVED' ? 'Đã duyệt (dữ liệu cũ)' : commission.status === 'FULLY_PAID' ? 'Đã chi đủ 100%' : commission.status === 'PARTIALLY_PAID' ? 'Đã chi 1 phần' : 'Chờ giải ngân'}
          </Tag>
        </div>
      }
    >
      <Descriptions column={3} size="small" colon={false} style={{ marginBottom: 12 }}>
        <Descriptions.Item label="Tỷ lệ hoa hồng">
          <Tag color="cyan">{commission.commissionRate}%</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Hoa hồng cơ bản">
          <span style={{ fontWeight: 600 }}>{formatMoney(commission.commissionAmount)}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Thưởng nóng">
          <span style={{ color: commission.bonusAmount > 0 ? '#d97706' : '#64748b', fontWeight: 600 }}>
            {commission.bonusAmount > 0 ? `+${formatMoney(commission.bonusAmount)}` : '0 đ'}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="Tổng kỳ vọng">
          <span style={{ color: '#059669', fontWeight: 700 }}>{formatMoney(commission.totalExpected)}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Đã thực nhận">
          <span style={{ color: '#0d9488', fontWeight: 700 }}>{formatMoney(commission.totalPaid)}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Tiến độ giải ngân">
          <div style={{ width: 140 }}>
            <Progress percent={paidPct} size="small" strokeColor="#059669" />
          </div>
        </Descriptions.Item>
      </Descriptions>

      <Table<DealCommissionMilestone>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={commission.milestones || []}
        locale={commission.status === 'APPROVED' ? { emptyText: 'Khoản hoa hồng cũ chưa có lịch giải ngân; cần đối soát trước khi duyệt chi.' } : undefined}
        pagination={false}
      />

      {/* Modal xác nhận chi trả */}
      <Modal
        open={Boolean(payoutMilestone)}
        title="Xác nhận chi trả hoa hồng"
        onCancel={() => setPayoutMilestone(null)}
        onOk={handlePayout}
        confirmLoading={payoutMutation.isPending}
        okText="Xác nhận chi trả"
        cancelText="Hủy"
      >
        {payoutMilestone && (
          <div>
            <p>
              Chi trả <strong>Đợt {payoutMilestone.milestoneNo} - {payoutMilestone.name}</strong>
            </p>
            <p>
              Số tiền: <strong style={{ color: '#059669', fontSize: 16 }}>{formatMoney(payoutMilestone.amountExpected)}</strong>
            </p>
            <Form.Item label="Ghi chú chứng từ">
              <Input
                placeholder="VD: Số UNC, tài khoản chuyển..."
                value={payoutNote}
                onChange={(e) => setPayoutNote(e.target.value)}
              />
            </Form.Item>
          </div>
        )}
      </Modal>
    </Card>
  )
}

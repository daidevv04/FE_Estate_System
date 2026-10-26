import {
  AlertOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  PlusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import {
  Alert,
  App,
  Button,
  Card,
  Dropdown,
  message,
  Progress,
  Space,
  Table,
  Typography,
} from 'antd'
import type { MenuProps, TableColumnsType } from 'antd'
import { formatDate, formatMoney } from '@/lib/format'
import {
  type Deal,
  type DealPaymentSchedule,
  useApplyScheduleTemplate,
  useDealPaymentSchedules,
  apiErrorMessage,
} from '../api'
import './DealPaymentScheduleSection.css'

interface Props {
  deal: Deal
  onRecordPayment?: () => void
}

export function DealPaymentScheduleSection({ deal, onRecordPayment }: Props) {
  const { modal } = App.useApp()
  const { data: schedules = [], isLoading } = useDealPaymentSchedules(deal.id)
  const applyTemplate = useApplyScheduleTemplate()

  const overdueCount = schedules.filter((s) => s.status === 'OVERDUE').length
  const dueSoonCount = schedules.filter((s) => s.status === 'DUE_SOON').length
  const totalPaid = schedules.reduce((sum, s) => sum + (s.amountPaid || 0), 0)
  const totalDue = schedules.reduce((sum, s) => sum + (s.amountDue || 0), 0)
  const progressPct =
    totalDue > 0 ? Math.min(100, Math.round((totalPaid / totalDue) * 100)) : 0

  const handleApplyTemplate = (templateCode: string, templateLabel: string) => {
    const apply = () => applyTemplate.mutate(
      { dealId: deal.id, templateCode },
      {
        onSuccess: () => {
          message.success(`Đã áp dụng ${templateLabel} thành công!`)
        },
        onError: (err: unknown) => {
          message.error(apiErrorMessage(err))
        },
      },
    )
    if (schedules.length === 0) {
      apply()
      return
    }
    modal.confirm({
      title: 'Thay thế tiến độ thanh toán hiện tại?',
      content: 'Các đợt thanh toán sẽ được tạo lại theo mẫu đã chọn. Các khoản thu đã ghi nhận vẫn được giữ nguyên.',
      okText: 'Thay thế tiến độ',
      cancelText: 'Giữ tiến độ hiện tại',
      onOk: apply,
    })
  }

  const templateMenuItems: MenuProps['items'] = [
    {
      key: 'TEMPLATE_CONSTRUCTION_7',
      icon: <CalendarOutlined style={{ color: '#059669' }} />,
      label: 'Mẫu 1: Tiến độ xây dựng chuẩn (7 đợt)',
      onClick: () =>
        handleApplyTemplate(
          'TEMPLATE_CONSTRUCTION_7',
          'Mẫu tiến độ xây dựng chuẩn 7 đợt',
        ),
    },
    {
      key: 'TEMPLATE_FAST_DISCOUNT_3',
      icon: <ThunderboltOutlined style={{ color: '#d97706' }} />,
      label: 'Mẫu 2: Thanh toán sớm 95% (Chiết khấu cao - 3 đợt)',
      onClick: () =>
        handleApplyTemplate(
          'TEMPLATE_FAST_DISCOUNT_3',
          'Mẫu thanh toán sớm 95%',
        ),
    },
    {
      key: 'TEMPLATE_BANK_LOAN_4',
      icon: <DollarOutlined style={{ color: '#0284c7' }} />,
      label: 'Mẫu 3: Vay ngân hàng HTLS 0% (4 đợt)',
      onClick: () =>
        handleApplyTemplate(
          'TEMPLATE_BANK_LOAN_4',
          'Mẫu vay ngân hàng hỗ trợ lãi suất',
        ),
    },
  ]

  const columns: TableColumnsType<DealPaymentSchedule> = [
    {
      title: 'Đợt',
      dataIndex: 'installmentNo',
      key: 'installmentNo',
      width: 70,
      align: 'center',
      render: (no: number) => <strong>Đợt {no}</strong>,
    },
    {
      title: 'Mốc thanh toán căn hộ',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>{name}</div>
          {record.notes && (
            <div style={{ fontSize: 12, color: '#64748b' }}>{record.notes}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Tỷ lệ',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 80,
      align: 'right',
      render: (pct: number | null) => (pct != null ? `${pct}%` : '—'),
    },
    {
      title: 'Phải nộp (VNĐ)',
      dataIndex: 'amountDue',
      key: 'amountDue',
      width: 140,
      align: 'right',
      render: (amount: number) => (
        <span style={{ fontWeight: 600 }}>{formatMoney(amount)}</span>
      ),
    },
    {
      title: 'Hạn thanh toán',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Đã thu (FIFO)',
      dataIndex: 'amountPaid',
      key: 'amountPaid',
      width: 140,
      align: 'right',
      render: (paid: number) => (
        <span style={{ fontWeight: 600, color: '#059669' }}>
          {formatMoney(paid)}
        </span>
      ),
    },
    {
      title: 'Còn thiếu',
      dataIndex: 'amountRemaining',
      key: 'amountRemaining',
      width: 140,
      align: 'right',
      render: (rem: number) => (
        <span style={{ fontWeight: 600, color: rem > 0 ? '#dc2626' : '#64748b' }}>
          {formatMoney(rem)}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 150,
      align: 'center',
      render: (_, record) => {
        if (record.status === 'PAID') {
          return (
            <span className="schedule-pill schedule-pill--paid">
              <CheckCircleOutlined /> Đã thu đủ
            </span>
          )
        }
        if (record.status === 'OVERDUE') {
          return (
            <span className="schedule-pill schedule-pill--overdue">
              <AlertOutlined /> Quá hạn {record.daysDiff ?? 0} ngày
            </span>
          )
        }
        if (record.status === 'DUE_SOON') {
          return (
            <span className="schedule-pill schedule-pill--due-soon">
              <ClockCircleOutlined /> Còn {record.daysDiff ?? 0} ngày
            </span>
          )
        }
        return (
          <span className="schedule-pill schedule-pill--pending">
            Chưa đến hạn
          </span>
        )
      },
    },
  ]

  return (
    <Card
      size="small"
      className="deal-schedule-card"
      title={
        <Space size={8}>
          <CalendarOutlined style={{ color: '#059669' }} />
          <span>Kế hoạch & Tiến độ thanh toán căn hộ ({schedules.length} đợt)</span>
        </Space>
      }
      extra={
        <Space>
          <Dropdown menu={{ items: templateMenuItems }} trigger={['click']}>
            <Button
              size="small"
              icon={<ThunderboltOutlined />}
              loading={applyTemplate.isPending}
            >
              Áp dụng mẫu tiến độ BĐS
            </Button>
          </Dropdown>
          {onRecordPayment && (
            <Button
              size="small"
              type="primary"
              icon={<PlusOutlined />}
              onClick={onRecordPayment}
            >
              Ghi nhận thanh toán
            </Button>
          )}
        </Space>
      }
    >
      {/* Cảnh báo nợ nếu có */}
      {overdueCount > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<AlertOutlined />}
          style={{ marginBottom: 12 }}
          message={`Cảnh báo: Có ${overdueCount} đợt thanh toán đã quá hạn!`}
          description="Khách hàng chưa hoàn tất nộp tiền theo đúng hạn cam kết trên Hợp đồng. Vui lòng liên hệ Sales đôn đốc thu tiền."
        />
      )}

      {dueSoonCount > 0 && overdueCount === 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={`Nhắc nhở: Có ${dueSoonCount} đợt sắp đến hạn trong vòng 7 ngày tới.`}
        />
      )}

      {/* KPIs & Progress Bar */}
      {schedules.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="deal-schedule-header">
            <div className="deal-schedule-kpis">
              <div className="deal-schedule-kpi-item">
                <span>Tổng phải nộp:</span>
                <span className="deal-schedule-kpi-val">{formatMoney(totalDue)}</span>
              </div>
              <div className="deal-schedule-kpi-item">
                <span>Đã thu (Lũy kế):</span>
                <span className="deal-schedule-kpi-val" style={{ color: '#059669' }}>
                  {formatMoney(totalPaid)}
                </span>
              </div>
              <div className="deal-schedule-kpi-item">
                <span>Công nợ còn lại:</span>
                <span className="deal-schedule-kpi-val" style={{ color: totalDue - totalPaid > 0 ? '#dc2626' : '#64748b' }}>
                  {formatMoney(Math.max(0, totalDue - totalPaid))}
                </span>
              </div>
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#059669' }}>
              Tiến độ thu: {progressPct}%
            </div>
          </div>
          <Progress percent={progressPct} strokeColor="#059669" size={['100%', 8]} />
        </div>
      )}

      {/* Bảng danh sách hoặc Empty */}
      {schedules.length === 0 ? (
        <div className="deal-schedule-empty">
          <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
            Hợp đồng này chưa có bảng tiến độ thanh toán theo đợt.
          </Typography.Paragraph>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            loading={applyTemplate.isPending}
            onClick={() =>
              handleApplyTemplate(
                'TEMPLATE_CONSTRUCTION_7',
                'Mẫu tiến độ xây dựng chuẩn 7 đợt',
              )
            }
          >
            Áp dụng ngay Mẫu tiến độ xây dựng 7 đợt
          </Button>
        </div>
      ) : (
        <Table<DealPaymentSchedule>
          rowKey="id"
          size="small"
          loading={isLoading}
          columns={columns}
          dataSource={schedules}
          pagination={false}
          scroll={{ x: 800 }}
        />
      )}
    </Card>
  )
}

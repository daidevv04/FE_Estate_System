import { CheckCircleOutlined, ClockCircleOutlined, DollarOutlined, WarningOutlined } from '@ant-design/icons'
import { Col, Row } from 'antd'
import { KpiCard } from '@/components/common/KpiCard'
import { formatMoney } from '@/lib/format'
import type { DebtAgingSummary } from '../api'

interface Props {
  summary?: DebtAgingSummary | null
  loading?: boolean
}

export function DebtKpiCards({ summary, loading }: Props) {
  const totalReceivable = summary?.totalReceivable ?? 0
  const expectedThisMonth = summary?.expectedThisMonth ?? 0
  const collectedThisMonth = summary?.collectedThisMonth ?? 0
  const dueSoonAmount = summary?.dueSoonAmount ?? 0
  const overdueAmount = summary?.overdueAmount ?? 0
  const overdueCount = summary?.overdueCount ?? 0

  const dueSoonCount = (summary?.items ?? []).filter((i) => i.agingBucket === 'DUE_SOON').length
  const monthPct = expectedThisMonth > 0 ? Math.round((collectedThisMonth / expectedThisMonth) * 100) : 0

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <KpiCard
          label="Tổng công nợ còn lại"
          value={loading ? '...' : formatMoney(totalReceivable)}
          sub={`Kế hoạch tháng này: ${formatMoney(expectedThisMonth)}`}
          icon={<DollarOutlined />}
          tone="blue"
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <KpiCard
          label="Đã thu thực tế tháng này"
          value={loading ? '...' : formatMoney(collectedThisMonth)}
          sub={expectedThisMonth > 0 ? `Đạt ${monthPct}% kế hoạch thu tháng` : 'Đang cập nhật kế hoạch'}
          icon={<CheckCircleOutlined />}
          tone="green"
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <KpiCard
          label="Sắp đến hạn (≤ 7 ngày)"
          value={loading ? '...' : formatMoney(dueSoonAmount)}
          sub={`${dueSoonCount} đợt cần gọi nhắc nộp tiền`}
          icon={<ClockCircleOutlined />}
          tone="amber"
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <KpiCard
          label="Công nợ quá hạn nộp"
          value={loading ? '...' : formatMoney(overdueAmount)}
          sub={`${overdueCount} đợt chậm tiến độ thanh toán`}
          icon={<WarningOutlined />}
          tone="red"
        />
      </Col>
    </Row>
  )
}

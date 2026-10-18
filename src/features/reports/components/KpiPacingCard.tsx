import { CheckCircleOutlined, FireOutlined, FlagOutlined, RiseOutlined } from '@ant-design/icons'
import { Card, Col, Progress, Row, Space, Tag, Typography } from 'antd'
import { formatMoney } from '@/lib/format'
import type { SalesLeaderboardSummary } from '../leaderboardApi'

interface Props {
  summary?: SalesLeaderboardSummary
  loading?: boolean
}

export function KpiPacingCard({ summary, loading = false }: Props) {
  const target = summary?.teamTargetRevenue ?? 30_000_000_000
  const achieved = summary?.teamAchievedRevenue ?? 0
  const pacingRate = summary?.teamPacingRate ?? 0
  const dealsCount = summary?.totalDealsCount ?? 0

  const getStatusTag = () => {
    if (pacingRate >= 100) {
      return <Tag color="green" icon={<CheckCircleOutlined />}>VƯỢT CHỈ TIÊU</Tag>
    }
    if (pacingRate >= 60) {
      return <Tag color="blue" icon={<RiseOutlined />}>ĐÚNG TIẾN ĐỘ</Tag>
    }
    return <Tag color="orange" icon={<FireOutlined />}>CẦN TĂNG TỐC</Tag>
  }

  return (
    <Card
      className="stitch-card"
      variant="borderless"
      style={{ marginBottom: 20 }}
      styles={{ body: { padding: '20px 24px' } }}
      loading={loading}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Space>
            <FlagOutlined style={{ color: '#059669', fontSize: 18 }} />
            <Typography.Text strong style={{ fontSize: 16, color: '#0f172a' }}>
              TIẾN ĐỘ DOANH SỐ TOÀN SÀN (KPI PACING)
            </Typography.Text>
          </Space>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Chỉ tiêu thi đua và nhịp độ chốt cọc toàn bộ đội ngũ kinh doanh nội bộ
          </div>
        </div>
        <div>{getStatusTag()}</div>
      </div>

      <Row gutter={[24, 16]} align="middle">
        <Col xs={24} md={14}>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#475569' }}>
              Thực đạt: <strong className="stitch-num" style={{ color: '#047857' }}>{formatMoney(achieved)}</strong> /{' '}
              {formatMoney(target)}
            </span>
            <span className="stitch-num" style={{ fontSize: 14, fontWeight: 800, color: '#059669' }}>
              {pacingRate}%
            </span>
          </div>
          <Progress
            percent={Math.min(100, Math.round(pacingRate))}
            status={pacingRate >= 100 ? 'success' : 'active'}
            strokeColor={
              pacingRate >= 100
                ? '#10b981'
                : pacingRate >= 60
                ? { '0%': '#38bdf8', '100%': '#059669' }
                : '#f59e0b'
            }
            strokeWidth={14}
            showInfo={false}
          />
        </Col>

        <Col xs={24} md={10}>
          <div
            style={{
              display: 'flex',
              gap: 16,
              background: '#f8fafc',
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid #f1f5f9',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#64748b' }}>SẢN PHẨM ĐÃ CHỐT</div>
              <div className="stitch-num" style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                {dealsCount} căn/lô
              </div>
            </div>

            <div style={{ width: 1, background: '#e2e8f0' }} />

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#64748b' }}>CÒN THIẾU CHỈ TIÊU</div>
              <div className="stitch-num" style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', marginTop: 2 }}>
                {formatMoney(Math.max(0, target - achieved))}
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  )
}

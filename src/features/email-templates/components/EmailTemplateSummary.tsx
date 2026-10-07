import { AppstoreOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons'
import { Card, Col, Progress, Row, Typography } from 'antd'
import type { ReactNode } from 'react'
import { tokens as t } from '@/theme/tokens'

interface Item { label: string; value: number; percent: number; caption: string; icon: ReactNode; color: string; bg: string; fg: string }

function KpiCard({ item, loading }: { item: Item; loading: boolean }) {
  return (
    <Card className="stitch-card" variant="borderless" loading={loading} style={{ height: '100%' }} styles={{ body: { padding: 20 } }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
        <Typography.Text className="stitch-label" style={{ color: t.colorTextMuted }}>{item.label}</Typography.Text>
        <span style={{ flex: '0 0 auto', width: 36, height: 36, borderRadius: t.radiusMd, display: 'grid', placeItems: 'center', background: item.bg, color: item.fg, fontSize: 17 }}>
          {item.icon}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
        <span className="stitch-num" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, color: item.color }}>{item.value}</span>
        <span style={{ fontSize: 13, color: t.colorTextMuted }}>mẫu email</span>
        {item.percent < 100 && <span className="product-kpi-pct" style={{ background: item.bg, color: item.fg }}>{new Intl.NumberFormat('vi-VN').format(item.percent)}%</span>}
      </div>
      <div style={{ marginTop: 10 }}><Progress percent={item.percent} showInfo={false} strokeColor={item.color} trailColor={t.colorSurfaceContainer} size="small" /></div>
      <Typography.Text style={{ display: 'block', marginTop: 8, fontSize: 12, color: t.colorTextSub }}>{item.caption}</Typography.Text>
    </Card>
  )
}

interface Props { total: number; active: number; inactive: number; loading: boolean }

/**
 * 9.12 KPI: chỉ 3 chỉ số suy ra được từ chính GET /email-templates (tổng / đang dùng / ngừng dùng).
 * Stitch còn "Đã sử dụng" và "Email đã gửi" nhưng backend chưa có lịch sử gửi → không dựng thẻ rỗng.
 */
export function EmailTemplateSummary({ total, active, inactive, loading }: Props) {
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0)
  const items: Item[] = [
    { label: 'TỔNG SỐ MẪU', value: total, percent: 100, caption: 'Toàn bộ mẫu email trong kho', icon: <AppstoreOutlined />, color: t.colorBrand, bg: t.colorSurfaceContainer, fg: t.colorBrand },
    { label: 'ĐANG HOẠT ĐỘNG (ACTIVE)', value: active, percent: pct(active), caption: 'Được phép dùng để gửi khách hàng', icon: <CheckCircleOutlined />, color: t.colorSuccessText, bg: t.colorSuccessBg, fg: t.colorSuccessText },
    { label: 'NGỪNG HOẠT ĐỘNG (INACTIVE)', value: inactive, percent: pct(inactive), caption: 'Tạm ẩn, không dùng để gửi', icon: <StopOutlined />, color: t.colorTextMuted, bg: '#F1F5F9', fg: t.colorTextMuted },
  ]
  return (
    <Row gutter={[16, 16]}>
      {items.map((item) => (
        <Col key={item.label} xs={24} sm={12} xl={8}>
          <KpiCard item={item} loading={loading} />
        </Col>
      ))}
    </Row>
  )
}

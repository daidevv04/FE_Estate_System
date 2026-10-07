import { AppstoreOutlined, CheckCircleOutlined, ClockCircleOutlined, HomeOutlined } from '@ant-design/icons'
import { Card, Col, Progress, Row, Typography } from 'antd'
import type { ReactNode } from 'react'
import { tokens as t } from '@/theme/tokens'
import type { ProductStatus } from '@/features/projects/api'

interface Item { label: string; value: number; percent: number; caption: string; icon: ReactNode; color: string; bg: string; fg: string }

function KpiCard({ item }: { item: Item }) {
  return (
    <Card className="stitch-card" variant="borderless" style={{ height: '100%' }} styles={{ body: { padding: 20 } }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
        <Typography.Text className="stitch-label" style={{ color: t.colorTextMuted }}>{item.label}</Typography.Text>
        <span style={{ flex: '0 0 auto', width: 36, height: 36, borderRadius: t.radiusMd, display: 'grid', placeItems: 'center', background: item.bg, color: item.fg, fontSize: 17 }}>
          {item.icon}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
        <span className="stitch-num" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, color: item.color }}>{item.value}</span>
        <span style={{ fontSize: 13, color: t.colorTextMuted }}>căn hộ / lô</span>
        {item.percent < 100 && <span className="product-kpi-pct" style={{ background: item.bg, color: item.fg }}>{new Intl.NumberFormat('vi-VN').format(item.percent)}%</span>}
      </div>
      <div style={{ marginTop: 10 }}><Progress percent={item.percent} showInfo={false} strokeColor={item.color} trailColor={t.colorSurfaceContainer} size="small" /></div>
      <Typography.Text style={{ display: 'block', marginTop: 8, fontSize: 12, color: t.colorTextSub }}>{item.caption}</Typography.Text>
    </Card>
  )
}

interface Props { total: number; counts: Record<ProductStatus, number> }

/** 9.16: 4 thẻ KPI — nhãn hoa + icon tint góc phải + số lớn + thanh tỉ lệ + caption. */
export function ProductSummary({ total, counts }: Props) {
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0)
  const items: Item[] = [
    { label: 'TỔNG SẢN PHẨM', value: total, percent: 100, caption: 'Toàn bộ bảng hàng trên hệ thống', icon: <AppstoreOutlined />, color: t.colorBrand, bg: t.colorSurfaceContainer, fg: t.colorBrand },
    { label: 'CÒN TRỐNG (AVAILABLE)', value: counts.AVAILABLE, percent: pct(counts.AVAILABLE), caption: 'Sẵn sàng mở bán & giao dịch', icon: <HomeOutlined />, color: t.colorSuccess, bg: t.colorSuccessBg, fg: t.colorSuccessText },
    { label: 'ĐANG GIỮ CHỖ (RESERVED)', value: counts.RESERVED, percent: pct(counts.RESERVED), caption: 'Đang rắp cọc & giữ chỗ 24h', icon: <ClockCircleOutlined />, color: t.colorWarningText, bg: t.colorAccentBg, fg: t.colorWarningText },
    { label: 'ĐÃ BÁN (SOLD)', value: counts.SOLD, percent: pct(counts.SOLD), caption: 'Đã vào hợp đồng & bàn giao', icon: <CheckCircleOutlined />, color: '#0F766E', bg: t.colorTealBg, fg: t.colorTeal },
  ]
  return (
    <Row gutter={[16, 16]}>
      {items.map((item) => (
        <Col key={item.label} xs={24} sm={12} xl={6}>
          <KpiCard item={item} />
        </Col>
      ))}
    </Row>
  )
}
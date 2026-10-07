import { AimOutlined, HomeOutlined, TagsOutlined } from '@ant-design/icons'
import { Card, Col, Row } from 'antd'
import { formatNumber } from '@/lib/format'
import { tokens as t } from '@/theme/tokens'
import { PRODUCT_STATUS, labelOf, type Product } from '../../projects/api'

interface Props { product: Product; projectName: string | null }

interface Kpi {
  label: string
  value: string
  tone: 'amber' | 'teal' | 'green' | 'slate'
  icon: React.ReactNode
  meta: { text: string; accent?: boolean }[]
}

/** 9.17 — 4 thẻ KPI dưới header: nhãn hoa + icon bo tròn góc phải + giá trị lớn + pill metadata. Toàn bộ số lấy từ API. */
export function ProductKpis({ product, projectName }: Props) {
  const perM2 = product.price && product.area ? Math.round(product.price / product.area) : null
  const statusLabel = labelOf(PRODUCT_STATUS, product.status)

  const kpis: Kpi[] = [
    {
      label: 'GIÁ NIÊM YẾT',
      value: product.price == null ? '—' : `${formatNumber(product.price)} ₫`,
      tone: 'amber',
      icon: <TagsOutlined />,
      meta: [{ text: projectName ?? 'Chưa có dự án' }, ...(perM2 ? [{ text: `${formatNumber(perM2)} ₫/m²`, accent: true }] : [])],
    },
    {
      label: 'DIỆN TÍCH',
      value: product.area == null ? '—' : `${formatNumber(product.area)} m²`,
      tone: 'teal',
      icon: <HomeOutlined />,
      meta: [{ text: product.bedroom == null ? 'Chưa có số phòng' : `${product.bedroom} phòng ngủ`, accent: true }, { text: product.block ?? 'Chưa có block' }],
    },
    {
      label: 'PHÂN KHU & BLOCK',
      value: product.block ?? '—',
      tone: 'green',
      icon: <AimOutlined />,
      meta: [{ text: projectName ?? '—' }, { text: labelOf(PRODUCT_STATUS, product.status) }],
    },
    {
      label: 'TRẠNG THÁI',
      value: statusLabel,
      tone: product.status === 'AVAILABLE' ? 'green' : product.status === 'RESERVED' ? 'amber' : 'slate',
      icon: <TagsOutlined />,
      meta: [{ text: `Mã: ${product.code}`, accent: true }],
    },
  ]

  return (
    <Row gutter={[16, 16]}>
      {kpis.map((kpi) => (
        <Col key={kpi.label} xs={24} sm={12} xl={6}>
          <Card className={`stitch-card pd-kpi pd-kpi--${kpi.tone}`} variant="borderless" style={{ height: '100%' }}>
            <div className="pd-kpi__head">
              <span className="stitch-label">{kpi.label}</span>
              <span className="pd-kpi__icon">{kpi.icon}</span>
            </div>
            <div className="pd-kpi__value">{kpi.value}</div>
            <div className="pd-kpi__meta">
              {kpi.meta.map((m) => (
                <span className="pd-pill" key={m.text} style={m.accent ? { color: t.colorBrand } : undefined}>{m.text}</span>
              ))}
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  )
}
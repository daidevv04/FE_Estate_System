import { formatNumber } from '@/lib/format'
import { tokens as t } from '@/theme/tokens'
import { DIRECTION, PRODUCT_TYPE, labelOf, type Product } from '../../projects/api'
import { ProductSection } from './ProductSection'

interface Props { product: Product; projectName: string | null }

/** 9.17 — lưới 2 cột nhãn/giá trị. Chỉ hiện field backend THỰC SỰ có, không bịa dữ liệu pháp lý. */
export function ProductSpecs({ product, projectName }: Props) {
  const rows: { label: string; value: string }[] = [
    { label: 'Mã căn hộ', value: product.code },
    { label: 'Dự án', value: projectName ?? '—' },
    { label: 'Phân khu / Block', value: product.block ?? '—' },
    { label: 'Loại hình', value: labelOf(PRODUCT_TYPE, product.type) },
    { label: 'Diện tích', value: product.area ? `${formatNumber(product.area)} m²` : '—' },
    { label: 'Hướng', value: labelOf(DIRECTION, product.direction) },
    { label: 'Số phòng ngủ', value: product.bedroom == null ? '—' : `${product.bedroom} phòng` },
    { label: 'Đơn giá / m²', value: product.price && product.area ? `${formatNumber(Math.round(product.price / product.area))} ₫` : '—' },
  ]

  return (
    <ProductSection title="Thông số & Đặc tính Bất động sản" subtitle={projectName ? `Thuộc dự án ${projectName}` : undefined}>
      <div className="pd-specs">
        {rows.map((row) => (
          <div className="pd-spec" key={row.label}>
            <span className="pd-spec__label">{row.label}</span>
            <span className="pd-spec__value" style={row.value === '—' ? { color: t.colorTextMuted } : undefined}>{row.value}</span>
          </div>
        ))}
      </div>
    </ProductSection>
  )
}
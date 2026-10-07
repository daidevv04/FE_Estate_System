import { Typography } from 'antd'
import { tokens as t } from '@/theme/tokens'
import type { ProductStatus } from '@/features/projects/api'

interface Props {
  total: number
  counts: Record<ProductStatus, number>
  active?: ProductStatus
  onPick: (status?: ProductStatus) => void
}

/** 9.16: hàng "Lọc nhanh" — số đếm lấy từ API, bấm là đổi filter trạng thái. */
export function ProductQuickFilter({ total, counts, active, onPick }: Props) {
  const chips: { key: string; label: string; value: number; bg: string; fg: string; dot?: string; status?: ProductStatus }[] = [
    { key: 'all', label: 'Tất cả', value: total, bg: active ? '#006B2C' : '#E0F2FE', fg: active ? '#fff' : '#0369A1' },
    { key: 'AVAILABLE', label: 'Còn trống', value: counts.AVAILABLE, status: 'AVAILABLE', bg: active === 'AVAILABLE' ? '#15803D' : '#DCFCE7', fg: active === 'AVAILABLE' ? '#fff' : '#15803D', dot: t.colorSuccess },
    { key: 'RESERVED', label: 'Giữ chỗ 24h', value: counts.RESERVED, status: 'RESERVED', bg: active === 'RESERVED' ? '#B45309' : '#FEF3C7', fg: active === 'RESERVED' ? '#fff' : '#B45309', dot: '#B45309' },
    { key: 'SOLD', label: 'Đã bán', value: counts.SOLD, status: 'SOLD', bg: active === 'SOLD' ? '#0F766E' : '#E0F2FE', fg: active === 'SOLD' ? '#fff' : '#0369A1', dot: t.colorTeal },
  ]
  return (
    <div className="products-quick">
      <Typography.Text className="stitch-label" style={{ color: t.colorTextMuted }}>Lọc nhanh:</Typography.Text>
      {chips.map((chip) => (
        <button key={chip.key} type="button" className="products-quick__chip" style={{ background: chip.bg, color: chip.fg }} onClick={() => onPick(chip.status)}>
          {chip.dot && <span className="stitch-pill__dot" style={{ background: chip.dot }} />}
          {chip.label} <strong>{chip.value}</strong>
        </button>
      ))}
    </div>
  )
}
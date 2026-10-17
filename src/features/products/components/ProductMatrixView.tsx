import {
  CheckCircleOutlined,
  EyeOutlined,
  FileDoneOutlined,
  HomeOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons'
import { Dropdown, Empty, Segmented, Skeleton, Space } from 'antd'
import type { MenuProps } from 'antd'
import { useMemo, useState } from 'react'
import { formatMoney } from '@/lib/format'
import type { Product } from '@/features/projects/api'
import './ProductMatrixView.css'

interface Props {
  rows: Product[]
  loading?: boolean
  projectNames: Record<string, string>
  onView: (product: Product) => void
  onLock: (product: Product) => void
  onUnlock: (product: Product) => void
  onConvertDeal?: (product: Product) => void
}

/**
 * Trích xuất số tầng từ mã căn hộ hoặc block
 * Ví dụ: RL-A101 -> 1, A1204 -> 12, P-0502 -> 5
 */
export function extractFloor(code: string): number {
  const digits = code.match(/\d+/g)
  if (!digits || digits.length === 0) return 1
  const lastNum = parseInt(digits[digits.length - 1], 10)
  if (lastNum >= 100) {
    return Math.floor(lastNum / 100)
  }
  return lastNum || 1
}

export function ProductMatrixView({
  rows,
  loading,
  onView,
  onLock,
  onUnlock,
  onConvertDeal,
}: Props) {
  // Lấy danh sách các Block có trong tập sản phẩm
  const blockList = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((p) => {
      set.add(p.block?.trim() || 'Chung')
    })
    return Array.from(set).sort()
  }, [rows])

  const [activeBlock, setActiveBlock] = useState<string>('ALL')

  // Sản phẩm thuộc block đang chọn
  const filteredProducts = useMemo(() => {
    if (activeBlock === 'ALL') return rows
    return rows.filter((p) => (p.block?.trim() || 'Chung') === activeBlock)
  }, [rows, activeBlock])

  // Thống kê nhanh của Block đang chọn
  const stats = useMemo(() => {
    const total = filteredProducts.length
    const available = filteredProducts.filter((p) => p.status === 'AVAILABLE').length
    const reserved = filteredProducts.filter((p) => p.status === 'RESERVED').length
    const sold = filteredProducts.filter((p) => p.status === 'SOLD').length
    const rate = total > 0 ? (((reserved + sold) / total) * 100).toFixed(1) : '0'
    return { total, available, reserved, sold, rate }
  }, [filteredProducts])

  // Nhóm theo Tầng, sắp xếp từ tầng cao nhất xuống tầng thấp nhất (chuẩn kiến trúc BĐS)
  const floorMap = useMemo(() => {
    const map = new Map<number, Product[]>()
    filteredProducts.forEach((p) => {
      const fl = extractFloor(p.code)
      const list = map.get(fl) || []
      list.push(p)
      map.set(fl, list)
    })

    // Sort các căn trong mỗi tầng theo code
    map.forEach((list) => {
      list.sort((a, b) => a.code.localeCompare(b.code))
    })

    // Sắp xếp tầng giảm dần (Tầng cao nhất lên đầu)
    const sortedFloors = Array.from(map.keys()).sort((a, b) => b - a)
    return sortedFloors.map((fl) => ({
      floor: fl,
      units: map.get(fl) || [],
    }))
  }, [filteredProducts])

  const renderUnitCard = (product: Product) => {
    const isAvail = product.status === 'AVAILABLE'
    const isRes = product.status === 'RESERVED'

    const menuItems: MenuProps['items'] = [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: 'Xem chi tiết căn',
        onClick: () => onView(product),
      },
    ]

    if (isAvail) {
      menuItems.push({
        key: 'lock',
        icon: <LockOutlined style={{ color: '#d97706' }} />,
        label: 'Khóa căn / Giữ chỗ',
        onClick: () => onLock(product),
      })
    }

    if (isRes) {
      menuItems.push(
        {
          key: 'unlock',
          icon: <UnlockOutlined style={{ color: '#059669' }} />,
          label: 'Mở khóa căn',
          onClick: () => onUnlock(product),
        },
        {
          key: 'deal',
          icon: <FileDoneOutlined style={{ color: '#0284c7' }} />,
          label: 'Lên hợp đồng / Vào cọc',
          onClick: () => onConvertDeal?.(product),
        }
      )
    }

    const cardClass = isAvail
      ? 'matrix-unit-card matrix-unit-card--available'
      : isRes
        ? 'matrix-unit-card matrix-unit-card--reserved'
        : 'matrix-unit-card matrix-unit-card--sold'

    const badgeClass = isAvail
      ? 'unit-card__badge unit-card__badge--available'
      : isRes
        ? 'unit-card__badge unit-card__badge--reserved'
        : 'unit-card__badge unit-card__badge--sold'

    const badgeLabel = isAvail ? 'Trống' : isRes ? 'Giữ chỗ' : 'Đã bán'

    return (
      <Dropdown key={product.id} menu={{ items: menuItems }} trigger={['click']}>
        <div className={cardClass} title={`${product.code} - Nhấp chuột để thao tác`}>
          <div className="unit-card__top">
            <span className="unit-card__code">{product.code}</span>
            <span className={badgeClass}>{badgeLabel}</span>
          </div>

          <div className="unit-card__specs">
            <span>{product.area ? `${product.area} m²` : '—'}</span>
            {product.bedroom != null && <span> · {product.bedroom}PN</span>}
          </div>

          <div className="unit-card__price">
            {formatMoney(product.price)}
          </div>

          {isRes && product.lockExpiresAt && (
            <div className="unit-card__expiry">
              Hạn: {product.lockExpiresAt}
            </div>
          )}
        </div>
      </Dropdown>
    )
  }

  if (loading) {
    return <Skeleton active paragraph={{ rows: 10 }} />
  }

  if (rows.length === 0) {
    return <Empty description="Chưa có dữ liệu bảng hàng căn hộ" />
  }

  const blockOptions = [
    { label: 'Tất cả Block', value: 'ALL' },
    ...blockList.map((b) => ({ label: `Block ${b}`, value: b })),
  ]

  return (
    <div className="matrix-container">
      {/* Header Bar */}
      <div className="matrix-stats-bar">
        <Space size={16} wrap>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
            <HomeOutlined style={{ marginRight: 6, color: '#059669' }} />
            Phân khu / Block:
          </span>
          <Segmented
            options={blockOptions}
            value={activeBlock}
            onChange={(v) => setActiveBlock(v as string)}
          />
        </Space>

        <div className="matrix-kpis">
          <div className="matrix-kpi-item">
            <span className="matrix-kpi-dot matrix-kpi-dot--available" />
            <span>Còn trống:</span>
            <span className="matrix-kpi-val" style={{ color: '#15803d' }}>{stats.available}</span>
          </div>

          <div className="matrix-kpi-item">
            <span className="matrix-kpi-dot matrix-kpi-dot--reserved" />
            <span>Đang giữ chỗ:</span>
            <span className="matrix-kpi-val" style={{ color: '#b45309' }}>{stats.reserved}</span>
          </div>

          <div className="matrix-kpi-item">
            <span className="matrix-kpi-dot matrix-kpi-dot--sold" />
            <span>Đã bán:</span>
            <span className="matrix-kpi-val" style={{ color: '#0369a1' }}>{stats.sold}</span>
          </div>

          <div className="matrix-rate">
            <CheckCircleOutlined style={{ marginRight: 5, color: '#059669' }} />
            Tỷ lệ hấp thụ: {stats.rate}% ({stats.reserved + stats.sold}/{stats.total} căn)
          </div>
        </div>
      </div>

      {/* Sơ đồ mặt bằng Matrix Grid */}
      <div className="matrix-grid-scroll">
        {floorMap.map(({ floor, units }) => (
          <div key={floor} className="matrix-floor-row">
            <div className="matrix-floor-label">
              Tầng {floor}
            </div>
            <div className="matrix-units-list">
              {units.map((unit) => renderUnitCard(unit))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

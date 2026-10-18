import {
  EyeOutlined,
  FileDoneOutlined,
  LockOutlined,
  RedoOutlined,
  UnlockOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons'
import { Button, Dropdown, Segmented, Space, Tag } from 'antd'
import type { MenuProps } from 'antd'
import { useMemo, useState, useRef } from 'react'
import { formatMoney } from '@/lib/format'
import type { Product, ProductStatus } from '@/features/projects/api'
import './ProductFloorplanSvgView.css'

interface Props {
  rows: Product[]
  loading?: boolean
  projectNames?: Record<string, string>
  onView: (product: Product) => void
  onLock: (product: Product) => void
  onUnlock: (product: Product) => void
  onConvertDeal?: (product: Product) => void
}

interface SvgLotDefinition {
  id: string
  code: string
  zone: 'LK' | 'BT' | 'NV'
  zoneName: string
  x: number
  y: number
  width: number
  height: number
  direction: string
  area: number
  defaultPrice: number
  defaultStatus: ProductStatus
  bedrooms: number
}

// 26 lô đất & căn hộ đại diện cho đại dự án phân lô
const LOT_DEFINITIONS: SvgLotDefinition[] = [
  // 1. Phân khu Shophouse Diamond (LK-01 -> LK-10)
  { id: 'lk-01', code: 'LK-01', zone: 'LK', zoneName: 'Shophouse Diamond', x: 80, y: 130, width: 70, height: 75, direction: 'Đông Nam', area: 120, defaultPrice: 6800000000, defaultStatus: 'AVAILABLE', bedrooms: 4 },
  { id: 'lk-02', code: 'LK-02', zone: 'LK', zoneName: 'Shophouse Diamond', x: 160, y: 130, width: 70, height: 75, direction: 'Đông Nam', area: 120, defaultPrice: 6800000000, defaultStatus: 'RESERVED', bedrooms: 4 },
  { id: 'lk-03', code: 'LK-03', zone: 'LK', zoneName: 'Shophouse Diamond', x: 240, y: 130, width: 70, height: 75, direction: 'Đông Nam', area: 120, defaultPrice: 6800000000, defaultStatus: 'AVAILABLE', bedrooms: 4 },
  { id: 'lk-04', code: 'LK-04', zone: 'LK', zoneName: 'Shophouse Diamond', x: 320, y: 130, width: 70, height: 75, direction: 'Đông Nam', area: 120, defaultPrice: 6800000000, defaultStatus: 'SOLD', bedrooms: 4 },
  { id: 'lk-05', code: 'LK-05', zone: 'LK', zoneName: 'Shophouse Diamond', x: 400, y: 130, width: 70, height: 75, direction: 'Đông Nam (Góc)', area: 145, defaultPrice: 8500000000, defaultStatus: 'AVAILABLE', bedrooms: 4 },

  { id: 'lk-06', code: 'LK-06', zone: 'LK', zoneName: 'Shophouse Diamond', x: 80, y: 215, width: 70, height: 75, direction: 'Tây Bắc', area: 120, defaultPrice: 6500000000, defaultStatus: 'AVAILABLE', bedrooms: 4 },
  { id: 'lk-07', code: 'LK-07', zone: 'LK', zoneName: 'Shophouse Diamond', x: 160, y: 215, width: 70, height: 75, direction: 'Tây Bắc', area: 120, defaultPrice: 6500000000, defaultStatus: 'SOLD', bedrooms: 4 },
  { id: 'lk-08', code: 'LK-08', zone: 'LK', zoneName: 'Shophouse Diamond', x: 240, y: 215, width: 70, height: 75, direction: 'Tây Bắc', area: 120, defaultPrice: 6500000000, defaultStatus: 'AVAILABLE', bedrooms: 4 },
  { id: 'lk-09', code: 'LK-09', zone: 'LK', zoneName: 'Shophouse Diamond', x: 320, y: 215, width: 70, height: 75, direction: 'Tây Bắc', area: 120, defaultPrice: 6500000000, defaultStatus: 'RESERVED', bedrooms: 4 },
  { id: 'lk-10', code: 'LK-10', zone: 'LK', zoneName: 'Shophouse Diamond', x: 400, y: 215, width: 70, height: 75, direction: 'Tây Bắc (Góc)', area: 145, defaultPrice: 8200000000, defaultStatus: 'AVAILABLE', bedrooms: 4 },

  // 2. Phân khu Biệt Thự Hồ Sapphire (BT-01 -> BT-08)
  { id: 'bt-01', code: 'BT-01', zone: 'BT', zoneName: 'Villas Sapphire Ven Hồ', x: 550, y: 130, width: 95, height: 85, direction: 'Chính Nam', area: 240, defaultPrice: 14500000000, defaultStatus: 'AVAILABLE', bedrooms: 5 },
  { id: 'bt-02', code: 'BT-02', zone: 'BT', zoneName: 'Villas Sapphire Ven Hồ', x: 655, y: 130, width: 95, height: 85, direction: 'Chính Nam', area: 240, defaultPrice: 14500000000, defaultStatus: 'RESERVED', bedrooms: 5 },
  { id: 'bt-03', code: 'BT-03', zone: 'BT', zoneName: 'Villas Sapphire Ven Hồ', x: 760, y: 130, width: 95, height: 85, direction: 'Chính Nam', area: 240, defaultPrice: 14500000000, defaultStatus: 'AVAILABLE', bedrooms: 5 },
  { id: 'bt-04', code: 'BT-04', zone: 'BT', zoneName: 'Villas Sapphire Ven Hồ', x: 865, y: 130, width: 95, height: 85, direction: 'Đông Nam (Vip)', area: 320, defaultPrice: 21000000000, defaultStatus: 'SOLD', bedrooms: 5 },

  { id: 'bt-05', code: 'BT-05', zone: 'BT', zoneName: 'Villas Sapphire Ven Hồ', x: 550, y: 225, width: 95, height: 85, direction: 'View Hồ', area: 260, defaultPrice: 16800000000, defaultStatus: 'AVAILABLE', bedrooms: 5 },
  { id: 'bt-06', code: 'BT-06', zone: 'BT', zoneName: 'Villas Sapphire Ven Hồ', x: 655, y: 225, width: 95, height: 85, direction: 'View Hồ', area: 260, defaultPrice: 16800000000, defaultStatus: 'AVAILABLE', bedrooms: 5 },
  { id: 'bt-07', code: 'BT-07', zone: 'BT', zoneName: 'Villas Sapphire Ven Hồ', x: 760, y: 225, width: 95, height: 85, direction: 'View Hồ', area: 260, defaultPrice: 16800000000, defaultStatus: 'RESERVED', bedrooms: 5 },
  { id: 'bt-08', code: 'BT-08', zone: 'BT', zoneName: 'Villas Sapphire Ven Hồ', x: 865, y: 225, width: 95, height: 85, direction: 'View Hồ (Đơn lập)', area: 350, defaultPrice: 25000000000, defaultStatus: 'AVAILABLE', bedrooms: 6 },

  // 3. Phân khu Căn Hộ Novotel Grand Towers (NV-0501 -> NV-0508)
  { id: 'nv-501', code: 'NV-0501', zone: 'NV', zoneName: 'Tháp Căn Hộ Novotel', x: 80, y: 370, width: 85, height: 60, direction: 'Đông Nam', area: 85.5, defaultPrice: 4250000000, defaultStatus: 'AVAILABLE', bedrooms: 2 },
  { id: 'nv-502', code: 'NV-0502', zone: 'NV', zoneName: 'Tháp Căn Hộ Novotel', x: 175, y: 370, width: 85, height: 60, direction: 'Đông Bắc', area: 98.0, defaultPrice: 5100000000, defaultStatus: 'RESERVED', bedrooms: 3 },
  { id: 'nv-503', code: 'NV-0503', zone: 'NV', zoneName: 'Tháp Căn Hộ Novotel', x: 270, y: 370, width: 85, height: 60, direction: 'Tây Nam', area: 72.0, defaultPrice: 3800000000, defaultStatus: 'SOLD', bedrooms: 2 },
  { id: 'nv-504', code: 'NV-0504', zone: 'NV', zoneName: 'Tháp Căn Hộ Novotel', x: 365, y: 370, width: 85, height: 60, direction: 'Tây Bắc', area: 68.0, defaultPrice: 3500000000, defaultStatus: 'AVAILABLE', bedrooms: 2 },

  { id: 'nv-505', code: 'NV-0505', zone: 'NV', zoneName: 'Tháp Căn Hộ Novotel', x: 80, y: 440, width: 85, height: 60, direction: 'Đông Nam', area: 85.5, defaultPrice: 4250000000, defaultStatus: 'AVAILABLE', bedrooms: 2 },
  { id: 'nv-506', code: 'NV-0506', zone: 'NV', zoneName: 'Tháp Căn Hộ Novotel', x: 175, y: 440, width: 85, height: 60, direction: 'Đông Bắc', area: 98.0, defaultPrice: 5100000000, defaultStatus: 'AVAILABLE', bedrooms: 3 },
  { id: 'nv-507', code: 'NV-0507', zone: 'NV', zoneName: 'Tháp Căn Hộ Novotel', x: 270, y: 440, width: 85, height: 60, direction: 'Tây Nam', area: 72.0, defaultPrice: 3800000000, defaultStatus: 'RESERVED', bedrooms: 2 },
  { id: 'nv-508', code: 'NV-0508', zone: 'NV', zoneName: 'Tháp Căn Hộ Novotel', x: 365, y: 440, width: 85, height: 60, direction: 'Tây Bắc', area: 68.0, defaultPrice: 3500000000, defaultStatus: 'AVAILABLE', bedrooms: 2 },
]

export function ProductFloorplanSvgView({
  rows,
  onView,
  onLock,
  onUnlock,
  onConvertDeal,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState<number>(1)
  const [zoneFilter, setZoneFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Tooltip state
  const [hoveredLot, setHoveredLot] = useState<{
    lot: SvgLotDefinition
    product: Product
    x: number
    y: number
  } | null>(null)

  // Mapping thực tế từ rows sản phẩm vào mã căn
  const productByCode = useMemo(() => {
    const map = new Map<string, Product>()
    rows.forEach((p) => {
      map.set(p.code.toUpperCase(), p)
    })
    return map
  }, [rows])

  // Lấy product data thực tế hoặc sinh fallback
  const getProductForLot = (def: SvgLotDefinition): Product => {
    const existing = productByCode.get(def.code.toUpperCase())
    if (existing) return existing

    return {
      id: def.id,
      code: def.code,
      projectId: 'pj-001',
      block: def.zoneName,
      floor: 1,
      status: def.defaultStatus,
      price: def.defaultPrice,
      area: def.area,
      direction: def.direction,
      bedrooms: def.bedrooms,
      bathrooms: 2,
    } as unknown as Product
  }

  // Lọc danh sách lô
  const visibleLots = useMemo(() => {
    return LOT_DEFINITIONS.filter((lot) => {
      if (zoneFilter !== 'ALL' && lot.zone !== zoneFilter) return false
      const prod = getProductForLot(lot)
      if (statusFilter !== 'ALL' && prod.status !== statusFilter) return false
      return true
    })
  }, [zoneFilter, statusFilter, productByCode])

  // Thống kê nhanh
  const stats = useMemo(() => {
    let available = 0
    let reserved = 0
    let sold = 0
    LOT_DEFINITIONS.forEach((lot) => {
      const prod = getProductForLot(lot)
      if (prod.status === 'AVAILABLE') available++
      else if (prod.status === 'RESERVED') reserved++
      else if (prod.status === 'SOLD') sold++
    })
    const total = LOT_DEFINITIONS.length
    const soldRate = (((reserved + sold) / total) * 100).toFixed(1)
    return { total, available, reserved, sold, soldRate }
  }, [productByCode])

  const getStatusColor = (status: ProductStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return { fill: '#10B981', stroke: '#059669', label: 'Đang trống' }
      case 'RESERVED':
        return { fill: '#F59E0B', stroke: '#D97706', label: 'Đã giữ chỗ / cọc' }
      case 'SOLD':
        return { fill: '#64748B', stroke: '#475569', label: 'Đã bán' }
      default:
        return { fill: '#94A3B8', stroke: '#64748B', label: 'Không xác định' }
    }
  }

  const handleMouseMove = (e: React.MouseEvent, def: SvgLotDefinition) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const product = getProductForLot(def)
    setHoveredLot({ lot: def, product, x, y })
  }

  const getActionMenu = (product: Product): MenuProps => {
    const isAvailable = product.status === 'AVAILABLE'
    const isReserved = product.status === 'RESERVED'

    const items: MenuProps['items'] = [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: 'Xem chi tiết lô đất',
        onClick: () => onView(product),
      },
    ]

    if (isAvailable) {
      items.push({
        key: 'lock',
        icon: <LockOutlined style={{ color: '#F59E0B' }} />,
        label: 'Khóa lô / Giữ chỗ 24h',
        onClick: () => onLock(product),
      })
    }

    if (isReserved) {
      items.push({
        key: 'unlock',
        icon: <UnlockOutlined style={{ color: '#10B981' }} />,
        label: 'Mở khóa lô đất',
        onClick: () => onUnlock(product),
      })
    }

    if (onConvertDeal) {
      items.push({
        key: 'convert-deal',
        icon: <FileDoneOutlined style={{ color: '#006A61' }} />,
        label: 'Tạo Hợp đồng cọc',
        onClick: () => onConvertDeal(product),
      })
    }

    return { items }
  }

  return (
    <div className="floorplan-container">
      {/* 1. Thanh công cụ điều khiển & Bộ lọc */}
      <div className="floorplan-toolbar">
        <Space size={12} wrap>
          <span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>Phân khu:</span>
          <Segmented
            value={zoneFilter}
            onChange={(v) => setZoneFilter(v as string)}
            options={[
              { label: 'Tất cả phân khu', value: 'ALL' },
              { label: 'Shophouse Diamond (LK)', value: 'LK' },
              { label: 'Villas Sapphire (BT)', value: 'BT' },
              { label: 'Tháp Novotel (NV)', value: 'NV' },
            ]}
          />

          <span style={{ fontWeight: 600, fontSize: 13, color: '#334155', marginLeft: 8 }}>Trạng thái:</span>
          <Segmented
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as string)}
            options={[
              { label: 'Tất cả', value: 'ALL' },
              { label: 'Chỉ lô còn trống', value: 'AVAILABLE' },
              { label: 'Đang giữ chỗ', value: 'RESERVED' },
              { label: 'Đã bán', value: 'SOLD' },
            ]}
          />
        </Space>

        <Space size={12}>
          <div className="floorplan-legend">
            <div className="floorplan-legend__item">
              <span className="floorplan-legend__dot" style={{ background: '#10B981' }} />
              <span>Trống ({stats.available})</span>
            </div>
            <div className="floorplan-legend__item">
              <span className="floorplan-legend__dot" style={{ background: '#F59E0B' }} />
              <span>Đã cọc ({stats.reserved})</span>
            </div>
            <div className="floorplan-legend__item">
              <span className="floorplan-legend__dot" style={{ background: '#64748B' }} />
              <span>Đã bán ({stats.sold})</span>
            </div>
            <Tag color="cyan" style={{ fontWeight: 700 }}>Đã bán: {stats.soldRate}%</Tag>
          </div>

          <Space.Compact>
            <Button icon={<ZoomInOutlined />} onClick={() => setZoom((z) => Math.min(z + 0.2, 1.8))} title="Phóng to" />
            <Button icon={<ZoomOutOutlined />} onClick={() => setZoom((z) => Math.max(z - 0.2, 0.7))} title="Thu nhỏ" />
            <Button icon={<RedoOutlined />} onClick={() => setZoom(1)} title="Đặt lại zoom">100%</Button>
          </Space.Compact>
        </Space>
      </div>

      {/* 2. Sơ đồ SVG Mặt Bằng Phân Lô Tương Tác */}
      <div className="floorplan-viewport" ref={containerRef} onMouseLeave={() => setHoveredLot(null)}>
        {/* Floating Tooltip */}
        {hoveredLot && (
          <div
            className="floorplan-tooltip"
            style={{
              left: `${hoveredLot.x}px`,
              top: `${hoveredLot.y}px`,
            }}
          >
            <div className="floorplan-tooltip__header">
              <span className="floorplan-tooltip__title">{hoveredLot.lot.code}</span>
              <Tag
                color={
                  hoveredLot.product.status === 'AVAILABLE'
                    ? 'success'
                    : hoveredLot.product.status === 'RESERVED'
                      ? 'warning'
                      : 'default'
                }
                style={{ margin: 0, fontSize: 11, fontWeight: 700 }}
              >
                {getStatusColor(hoveredLot.product.status).label}
              </Tag>
            </div>
            <div style={{ color: '#cbd5e1', fontSize: 11, marginBottom: 4 }}>{hoveredLot.lot.zoneName}</div>
            <div className="floorplan-tooltip__price">{formatMoney(hoveredLot.product.price)}</div>
            <div className="floorplan-tooltip__row">
              <span>Diện tích:</span>
              <strong>{hoveredLot.product.area} m²</strong>
            </div>
            <div className="floorplan-tooltip__row">
              <span>Hướng phong thủy:</span>
              <strong>{hoveredLot.product.direction || hoveredLot.lot.direction}</strong>
            </div>
            <div className="floorplan-tooltip__row">
              <span>Quy cách:</span>
              <strong>{hoveredLot.lot.bedrooms} Phòng ngủ</strong>
            </div>
            <div style={{ marginTop: 6, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 11, color: '#38bdf8', textAlign: 'center' }}>
              💡 Click để thao tác (Khóa lô / Tạo deal)
            </div>
          </div>
        )}

        <svg
          className="floorplan-svg"
          viewBox="0 0 1020 540"
          style={{ transform: `scale(${zoom})` }}
        >
          <defs>
            {/* Họa tiết sân vườn / cây xanh */}
            <linearGradient id="lakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="parkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#065f46" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>

          {/* Nền quy hoạch dự án */}
          <rect x="0" y="0" width="1020" height="540" fill="#0f172a" rx="8" />

          {/* Đại Lộ Võ Nguyên Giáp (Trục chính ven biển 24m) */}
          <rect x="40" y="30" width="940" height="60" fill="#1e293b" rx="6" />
          <line x1="40" y1="60" x2="980" y2="60" stroke="#f8fafc" strokeWidth="2" strokeDasharray="12,12" opacity="0.6" />
          <text x="510" y="52" fill="#94a3b8" fontSize="13" fontWeight="800" textAnchor="middle" letterSpacing="3">
            ĐẠI LỘ VÕ NGUYÊN GIÁP (TRỤC ĐƯỜNG 24M - KẾT NỐI BIỂN)
          </text>

          {/* Đường nội khu phân nhánh */}
          <rect x="495" y="90" width="30" height="420" fill="#1e293b" rx="4" />
          <line x1="510" y1="90" x2="510" y2="510" stroke="#f8fafc" strokeWidth="2" strokeDasharray="8,8" opacity="0.4" />
          <text x="510" y="320" fill="#64748b" fontSize="10" fontWeight="700" textAnchor="middle" transform="rotate(-90 510 320)" letterSpacing="2">
            ĐƯỜNG HOA HẢI ĐƯỜNG
          </text>

          {/* Hồ cảnh quan trung tâm Central Lake */}
          <ellipse cx="730" cy="410" rx="170" ry="75" fill="url(#lakeGrad)" opacity="0.85" />
          <ellipse cx="730" cy="410" rx="160" ry="68" fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.6" strokeDasharray="6,4" />
          <text x="730" y="415" fill="#e0f2fe" fontSize="12" fontWeight="800" textAnchor="middle" letterSpacing="1">
            HỒ ĐIỀU HÒA TRUNG TÂM (CENTRAL LAKE 2.4 HA)
          </text>

          {/* Công viên ánh sáng & Tiện ích nội khu */}
          <rect x="80" y="300" width="390" height="45" fill="url(#parkGrad)" rx="6" opacity="0.85" />
          <text x="275" y="328" fill="#a7f3d0" fontSize="12" fontWeight="700" textAnchor="middle">
            🌲 CÔNG VIÊN ÁNH SÁNG & KHU THỂ THAO ĐA NĂNG
          </text>

          {/* Nhãn Tiêu đề Phân Khu */}
          <text x="80" y="118" fill="#38bdf8" fontSize="13" fontWeight="800">
            ◆ PHÂN KHU A: LIỀN KỀ SHOPHOUSE DIAMOND
          </text>
          <text x="550" y="118" fill="#fbbf24" fontSize="13" fontWeight="800">
            ◆ PHÂN KHU B: BIỆT THỰ VEN HỒ SAPPHIRE
          </text>
          <text x="80" y="360" fill="#c084fc" fontSize="13" fontWeight="800">
            ◆ PHÂN KHU C: TỔ HỢP CĂN HỘ NOVOTEL GRAND TOWERS
          </text>

          {/* Vẽ các ô đất / căn hộ */}
          {visibleLots.map((lot) => {
            const product = getProductForLot(lot)
            const color = getStatusColor(product.status)

            return (
              <Dropdown key={lot.id} menu={getActionMenu(product)} trigger={['click']}>
                <g
                  className="floorplan-lot"
                  onMouseEnter={(e) => handleMouseMove(e, lot)}
                  onMouseMove={(e) => handleMouseMove(e, lot)}
                  onClick={() => onView(product)}
                >
                  <rect
                    x={lot.x}
                    y={lot.y}
                    width={lot.width}
                    height={lot.height}
                    rx="5"
                    fill={color.fill}
                    stroke={color.stroke}
                    strokeWidth="1.5"
                    opacity={hoveredLot?.lot.id === lot.id ? 1 : 0.92}
                  />
                  <text
                    x={lot.x + lot.width / 2}
                    y={lot.y + lot.height / 2 - 3}
                    fill="#ffffff"
                    fontSize="11"
                    textAnchor="middle"
                  >
                    {lot.code}
                  </text>
                  <text
                    x={lot.x + lot.width / 2}
                    y={lot.y + lot.height / 2 + 12}
                    fill="rgba(255,255,255,0.85)"
                    fontSize="9"
                    fontWeight="500"
                    textAnchor="middle"
                  >
                    {lot.area}m²
                  </text>
                </g>
              </Dropdown>
            )
          })}

          {/* La bàn hướng Bắc (Compass) */}
          <g transform="translate(950, 480)">
            <circle cx="0" cy="0" r="22" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <polygon points="0,-18 5,-2 0,-6 -5,-2" fill="#ef4444" />
            <polygon points="0,18 5,2 0,6 -5,2" fill="#94a3b8" />
            <text x="0" y="-8" fill="#ffffff" fontSize="9" fontWeight="800" textAnchor="middle">N</text>
          </g>
        </svg>
      </div>
    </div>
  )
}

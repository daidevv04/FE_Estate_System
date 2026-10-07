import { EyeOutlined, HomeOutlined, LayoutOutlined, ShopOutlined } from '@ant-design/icons'
import { Button, Dropdown, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ReactNode } from 'react'
import { formatMoney } from '@/lib/format'
import { tokens as t } from '@/theme/tokens'
import { DIRECTION, PRODUCT_STATUS, PRODUCT_TYPE, labelOf, type Direction, type Product, type ProductStatus, type ProductType } from '@/features/projects/api'

interface Props {
  rows: Product[]
  loading: boolean
  emptyText: string
  selected: string[]
  projectNames: Record<string, string>
  onSelect: (keys: string[]) => void
  onEdit: (product: Product) => void
  onView: (product: Product) => void
}

/** Loại hình -> pill màu nhạt + icon (đúng nhánh icon Stitch 9.16). */
const TYPE_PILL: Record<ProductType, { icon: ReactNode; bg: string; fg: string }> = {
  APARTMENT: { icon: <HomeOutlined />, bg: '#EEF2FF', fg: '#4F46E5' },
  LAND: { icon: <LayoutOutlined />, bg: '#F1F5F9', fg: '#334155' },
  TOWNHOUSE: { icon: <ShopOutlined />, bg: '#EFF6FF', fg: '#1D4ED8' },
}

const STATUS_PILL: Record<ProductStatus, { bg: string; fg: string; dot: string }> = {
  AVAILABLE: { bg: '#DCFCE7', fg: '#15803D', dot: t.colorSuccess },
  RESERVED: { bg: '#FEF3C7', fg: '#B45309', dot: '#B45309' },
  SOLD: { bg: '#E0F2FE', fg: '#0369A1', dot: t.colorTeal },
}

/** 9.16: bảng là khu vực trọng tâm — mã căn + giá nổi bật, chi tiết phụ là text nhỏ hơn. */
export function ProductTable({ rows, loading, emptyText, selected, projectNames, onSelect, onEdit, onView }: Props) {
  const columns: ColumnsType<Product> = [
    { title: 'MÃ SẢN PHẨM', dataIndex: 'code', width: 140, render: (value, row) => <button type="button" className="product-code product-code--button" onClick={() => onView(row)}>{value}</button> },
    { title: 'DỰ ÁN', width: 185, render: (_, row) => <span className="product-project"><HomeOutlined />{projectNames[row.projectId] || '—'}</span> },
    { title: 'PHÂN KHU / BLOCK', dataIndex: 'block', width: 150, render: (value) => value || '—' },
    { title: 'LOẠI HÌNH', dataIndex: 'type', width: 140, render: (value: ProductType) => { const p = TYPE_PILL[value]; return <span className="product-type" style={{ background: p.bg, color: p.fg }}>{p.icon}{labelOf(PRODUCT_TYPE, value)}</span> } },
    { title: 'DIỆN TÍCH', dataIndex: 'area', width: 110, render: (value: number) => <strong>{value} m²</strong> },
    { title: 'HƯỚNG', dataIndex: 'direction', width: 100, render: (value: Direction | null) => <span className="product-muted">{labelOf(DIRECTION, value)}</span> },
    { title: 'SỐ PN', dataIndex: 'bedroom', width: 85, render: (value: number | null) => <span className="product-muted">{value == null ? '—' : `${value} PN`}</span> },
    { title: 'GIÁ NIÊM YẾT', dataIndex: 'price', width: 190, render: (value: number | null, row) => <span className="product-price" data-status={row.status}>{formatMoney(value)}</span> },
    { title: 'TRẠNG THÁI', dataIndex: 'status', width: 140, render: (value: ProductStatus) => { const p = STATUS_PILL[value]; return <span className="stitch-pill" style={{ background: p.bg, color: p.fg }}><span className="stitch-pill__dot" style={{ background: p.dot }} />{labelOf(PRODUCT_STATUS, value)}</span> } },
    { title: 'THAO TÁC', width: 64, render: (_, row) => <Dropdown menu={{ items: [{ key: 'view', icon: <EyeOutlined />, label: 'Xem chi tiết' }, { key: 'edit', label: 'Chỉnh sửa' }], onClick: ({ key }) => key === 'view' ? onView(row) : onEdit(row) }}><Button type="text" aria-label={`Thao tác với ${row.code}`} icon={<EyeOutlined />} /></Dropdown> },
  ]

  return (
    <Table<Product>
      className="product-table"
      rowKey="id"
      size="middle"
      loading={loading}
      columns={columns}
      dataSource={rows}
      pagination={false}
      scroll={{ x: 1400 }}
      locale={{ emptyText }}
      rowSelection={{ selectedRowKeys: selected, onChange: (keys) => onSelect(keys.map(String)), preserveSelectedRowKeys: true }}
    />
  )
}
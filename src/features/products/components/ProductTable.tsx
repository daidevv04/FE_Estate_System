import {
  BankOutlined,
  BarcodeOutlined,
  BuildOutlined,
  CheckCircleOutlined,
  ColumnWidthOutlined,
  CompassOutlined,
  DollarOutlined,
  HomeOutlined,
  LayoutOutlined,
  LockOutlined,
  PictureOutlined,
  ShopOutlined,
  UnlockOutlined,
} from '@ant-design/icons'
import { Button, Space, Table, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ReactNode } from 'react'
import { SelectableTableContainer } from '@/components/common/SelectableTableContainer'
import { formatMoney } from '@/lib/format'
import { tokens as t } from '@/theme/tokens'
import { DIRECTION, PRODUCT_STATUS, PRODUCT_TYPE, labelOf, type Direction, type Product, type ProductStatus, type ProductType } from '@/features/projects/api'

interface Props {
  rows: Product[]
  loading: boolean
  emptyText: string
  selected: string[]
  projectNames: Record<string, string>
  canManage?: boolean
  onSelect: (keys: string[]) => void
  onEdit: (product: Product) => void
  onView: (product: Product) => void
  onLock?: (product: Product) => void
  onUnlock?: (product: Product) => void
}

const DEFAULT_TYPE_PILL = { icon: <HomeOutlined />, bg: '#F1F5F9', fg: '#334155' }
const DEFAULT_STATUS_PILL = { bg: '#F1F5F9', fg: '#475569', dot: '#94A3B8' }

const TYPE_PILL: Record<string, { icon: ReactNode; bg: string; fg: string }> = {
  APARTMENT: { icon: <HomeOutlined />, bg: '#EEF2FF', fg: '#4F46E5' },
  LAND: { icon: <LayoutOutlined />, bg: '#F1F5F9', fg: '#334155' },
  TOWNHOUSE: { icon: <ShopOutlined />, bg: '#EFF6FF', fg: '#1D4ED8' },
}

const STATUS_PILL: Record<string, { bg: string; fg: string; dot: string }> = {
  AVAILABLE: { bg: '#DCFCE7', fg: '#15803D', dot: t.colorSuccess },
  RESERVED: { bg: '#FEF3C7', fg: '#B45309', dot: '#B45309' },
  SOLD: { bg: '#E0F2FE', fg: '#0369A1', dot: t.colorTeal },
}

export function ProductTable({ rows, loading, emptyText, selected, projectNames, onSelect, onView, onLock, onUnlock }: Props) {
  const columns: ColumnsType<Product> = [
    {
      title: (
        <span>
          <PictureOutlined style={{ marginRight: 5, color: '#059669' }} />
          Ảnh
        </span>
      ),
      dataIndex: 'imageUrl',
      width: 72,
      render: (value: string | undefined, row) =>
        value ? (
          <div className="project-product-thumb" onClick={() => onView(row)} title={`Xem chi tiết ${row.code}`}>
            <img src={value} alt="" />
          </div>
        ) : (
          <div className="project-product-thumb project-product-thumb--mock" title="Chưa có ảnh (Minh họa)">
            <BankOutlined />
          </div>
        ),
    },
    {
      title: (
        <span>
          <BarcodeOutlined style={{ marginRight: 5, color: '#059669' }} />
          Mã SP
        </span>
      ),
      dataIndex: 'code',
      width: 120,
      ellipsis: true,
      render: (value, row) => <button type="button" className="product-code product-code--button" onClick={() => onView(row)}>{value}</button>,
    },
    {
      title: (
        <span>
          <HomeOutlined style={{ marginRight: 5, color: '#64748b' }} />
          Dự án
        </span>
      ),
      width: 155,
      ellipsis: true,
      render: (_, row) => <Tooltip title={projectNames[row.projectId]}><span className="product-project"><HomeOutlined />{projectNames[row.projectId] || '—'}</span></Tooltip>,
    },
    {
      title: (
        <span>
          <BuildOutlined style={{ marginRight: 5, color: '#64748b' }} />
          Block
        </span>
      ),
      dataIndex: 'block',
      width: 85,
      ellipsis: true,
      render: (value) => value || '—',
    },
    {
      title: (
        <span>
          <LayoutOutlined style={{ marginRight: 5, color: '#64748b' }} />
          Loại
        </span>
      ),
      dataIndex: 'type',
      width: 110,
      render: (value: ProductType) => {
        const p = (value && TYPE_PILL[value]) || DEFAULT_TYPE_PILL
        return <span className="product-type" style={{ background: p.bg, color: p.fg }}>{p.icon}{labelOf(PRODUCT_TYPE, value)}</span>
      },
    },
    {
      title: (
        <span>
          <ColumnWidthOutlined style={{ marginRight: 5, color: '#64748b' }} />
          DT (m²)
        </span>
      ),
      dataIndex: 'area',
      width: 90,
      align: 'right',
      render: (value: number) => <strong>{value}</strong>,
    },
    {
      title: (
        <span>
          <CompassOutlined style={{ marginRight: 5, color: '#64748b' }} />
          Hướng
        </span>
      ),
      dataIndex: 'direction',
      width: 80,
      render: (value: Direction | null) => <span className="product-muted">{labelOf(DIRECTION, value)}</span>,
    },
    {
      title: 'PN',
      dataIndex: 'bedroom',
      width: 50,
      align: 'center',
      render: (value: number | null) => <span className="product-muted">{value ?? '—'}</span>,
    },
    {
      title: (
        <span>
          <DollarOutlined style={{ marginRight: 5, color: '#059669' }} />
          Giá niêm yết
        </span>
      ),
      dataIndex: 'price',
      width: 140,
      align: 'right',
      render: (value: number | null, row) => <span className="product-price" data-status={row.status}>{formatMoney(value)}</span>,
    },
    {
      title: (
        <span>
          <CheckCircleOutlined style={{ marginRight: 5, color: '#059669' }} />
          Trạng thái
        </span>
      ),
      dataIndex: 'status',
      width: 130,
      render: (value: ProductStatus, row) => {
        const p = (value && STATUS_PILL[value]) || DEFAULT_STATUS_PILL
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span className="stitch-pill stitch-pill--sm" style={{ background: p.bg, color: p.fg }}>
              <span className="stitch-pill__dot" style={{ background: p.dot }} />
              {labelOf(PRODUCT_STATUS, value)}
            </span>
            {value === 'RESERVED' && row.lockExpiresAt && (
              <span style={{ fontSize: 11, color: '#b45309', fontWeight: 600 }}>
                Hạn: {row.lockExpiresAt}
              </span>
            )}
          </div>
        )
      },
    },
    {
      title: 'Thao tác',
      width: 105,
      align: 'center',
      render: (_, row) => (
        <Space size={2} onClick={(e) => e.stopPropagation()}>
          {row.status === 'AVAILABLE' && onLock && (
            <Button
              size="small"
              type="primary"
              ghost
              style={{ borderColor: '#d97706', color: '#d97706', fontSize: 12, height: 26, padding: '0 8px' }}
              icon={<LockOutlined />}
              onClick={() => onLock(row)}
              title="Khóa căn / Giữ chỗ"
            >
              Giữ chỗ
            </Button>
          )}
          {row.status === 'RESERVED' && onUnlock && (
            <Button
              size="small"
              danger
              style={{ fontSize: 12, height: 26, padding: '0 8px' }}
              icon={<UnlockOutlined />}
              onClick={() => onUnlock(row)}
              title="Mở khóa căn"
            >
              Mở khóa
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <SelectableTableContainer
      selectedKeys={selected}
      onSelectChange={onSelect}
    >
      <Table<Product>
        className="product-table crm-compact-table"
        rowKey="id"
        size="small"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={false}
        scroll={{ x: 920 }}
        locale={{ emptyText }}
        onRow={(row) => ({
          onClick: (e) => {
            if ((e.target as HTMLElement).closest('.ant-checkbox-wrapper')) return
            onView(row)
          },
          style: { cursor: 'pointer' },
        })}
        rowSelection={{ selectedRowKeys: selected, onChange: (keys) => onSelect(keys.map(String)), preserveSelectedRowKeys: true }}
      />
    </SelectableTableContainer>
  )
}
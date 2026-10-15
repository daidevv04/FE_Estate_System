import { ReloadOutlined, SearchOutlined, SlidersOutlined } from '@ant-design/icons'
import { Button, Card, Col, Input, InputNumber, Row, Select } from 'antd'
import { useState } from 'react'
import { PRODUCT_STATUS, PRODUCT_TYPE, type Product, type ProductFilters as Filters, type ProductStatus, type ProductType } from '@/features/projects/api'

export interface FilterState extends Filters { projectId?: string }

interface Props {
  value: FilterState
  projects: { value: string; label: string }[]
  blocks: string[]
  onChange: (next: FilterState) => void
}

const money = { formatter: (v: number | string | undefined) => v == null ? '' : new Intl.NumberFormat('vi-VN').format(Number(v)), parser: (v: string | undefined) => Number((v ?? '').replace(/[^\d]/g, '')) as unknown as number }
const blank: FilterState = { page: 0, size: 10 }

export function ProductFiltersBar({ value, projects, blocks, onChange }: Props) {
  const [advanced, setAdvanced] = useState(false)
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch, page: 0 })
  const blockOptions = [...new Set(blocks)].sort().map((b) => ({ value: b, label: b }))

  return (
    <Card className="stitch-card crm-filter-card" variant="borderless" styles={{ body: { padding: '12px 16px' } }}>
      <div className="crm-filter-bar">
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          placeholder="Tìm theo mã sản phẩm, block..."
          value={value.keyword}
          onChange={(e) => set({ keyword: e.target.value || undefined })}
          style={{ flex: '1.6 1 200px', minWidth: 170 }}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Tất cả dự án"
          value={value.projectId}
          onChange={(v) => set({ projectId: v })}
          options={projects}
          style={{ flex: '1.2 1 150px', minWidth: 130 }}
        />
        <Select
          allowClear
          placeholder="Tất cả loại hình"
          value={value.type}
          onChange={(v) => set({ type: v as ProductType })}
          options={PRODUCT_TYPE}
          style={{ flex: '1 1 130px', minWidth: 120 }}
        />
        <Select
          allowClear
          placeholder="Tất cả trạng thái"
          value={value.status}
          onChange={(v) => set({ status: v as ProductStatus })}
          options={PRODUCT_STATUS}
          style={{ flex: '1 1 130px', minWidth: 120 }}
        />
        <Button
          type={advanced ? 'primary' : 'default'}
          icon={<SlidersOutlined />}
          onClick={() => setAdvanced((a) => !a)}
          style={{ flex: '0 0 auto' }}
        >
          {advanced ? 'Ẩn bộ lọc' : 'Lọc nâng cao'}
        </Button>
        <Button
          className="crm-filter-clear-btn"
          icon={<ReloadOutlined />}
          onClick={() => { setAdvanced(false); onChange({ ...blank }) }}
        >
          Xoá lọc
        </Button>
      </div>

      {advanced && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={12} lg={10}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Khoảng giá (VNĐ)</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <InputNumber style={{ width: '100%' }} placeholder="Giá thấp nhất" {...money} value={value.minPrice ?? null} onChange={(v) => set({ minPrice: v ?? undefined })} />
                <InputNumber style={{ width: '100%' }} placeholder="Giá cao nhất" {...money} value={value.maxPrice ?? null} onChange={(v) => set({ maxPrice: v ?? undefined })} />
              </div>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Block / phân khu</div>
              <Select allowClear showSearch placeholder="Chọn block" style={{ width: '100%' }} value={value.block} onChange={(v) => set({ block: v })} options={blockOptions} notFoundContent="Chưa có block" />
            </Col>
          </Row>
        </div>
      )}
    </Card>
  )
}

export const productBlocksOf = (rows: Product[]) => rows.map((p) => p.block).filter((b): b is string => Boolean(b))
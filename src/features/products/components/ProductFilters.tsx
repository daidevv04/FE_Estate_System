import { ClearOutlined, SearchOutlined, SlidersOutlined } from '@ant-design/icons'
import { Button, Card, Col, Input, InputNumber, Row, Select, Tooltip } from 'antd'
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

/** 9.16: hàng lọc chính (từ khoá + dự án + loại hình + trạng thái + nút nâng cao + xoá lọc),
 *  hàng nâng cao chỉ chứa tham số GET /products thật sự nhận (minPrice/maxPrice/block). */
export function ProductFiltersBar({ value, projects, blocks, onChange }: Props) {
  const [advanced, setAdvanced] = useState(false)
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch, page: 0 })
  const blockOptions = [...new Set(blocks)].sort().map((b) => ({ value: b, label: b }))

  return (
    <Card className="stitch-card" variant="borderless" styles={{ body: { padding: 16 } }}>
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} lg={6} xl={6}>
          <Input size="large" allowClear prefix={<SearchOutlined />} placeholder="Tìm theo mã sản phẩm, dự án, block, loại hình..." value={value.keyword} onChange={(e) => set({ keyword: e.target.value || undefined })} />
        </Col>
        <Col xs={12} md={8} lg={4} xl={4}>
          <Select size="large" allowClear showSearch optionFilterProp="label" style={{ width: '100%' }} placeholder="Tất cả dự án" value={value.projectId} onChange={(v) => set({ projectId: v })} options={projects} />
        </Col>
        <Col xs={12} md={8} lg={4} xl={4}>
          <Select size="large" allowClear style={{ width: '100%' }} placeholder="Tất cả loại hình" value={value.type} onChange={(v) => set({ type: v as ProductType })} options={PRODUCT_TYPE} />
        </Col>
        <Col xs={12} md={8} lg={4} xl={4}>
          <Select size="large" allowClear style={{ width: '100%' }} placeholder="Tất cả trạng thái" value={value.status} onChange={(v) => set({ status: v as ProductStatus })} options={PRODUCT_STATUS} />
        </Col>
        <Col xs={12} md={8} lg={4} xl={4}>
          <Button size="large" block type={advanced ? 'primary' : 'default'} icon={<SlidersOutlined />} onClick={() => setAdvanced((a) => !a)}>Bộ lọc nâng cao</Button>
        </Col>
        <Col xs={12} md={8} lg={2} xl={2}>
          <Tooltip title="Xóa lọc">
            <Button size="large" block danger icon={<ClearOutlined />} aria-label="Xóa lọc" onClick={() => { setAdvanced(false); onChange({ ...blank }) }} />
          </Tooltip>
        </Col>
      </Row>

      {advanced && (
        <div className="products-filters__advanced">
          <Row gutter={[12, 12]}>
            <Col xs={24} md={12} lg={6}>
              <div className="products-filters__label">Khoảng giá (VNĐ)</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <InputNumber size="large" style={{ width: '100%' }} placeholder="Giá thấp nhất" {...money} value={value.minPrice ?? null} onChange={(v) => set({ minPrice: v ?? undefined })} />
                <InputNumber size="large" style={{ width: '100%' }} placeholder="Giá cao nhất" {...money} value={value.maxPrice ?? null} onChange={(v) => set({ maxPrice: v ?? undefined })} />
              </div>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <div className="products-filters__label">Tất cả phân khu / block</div>
              <Select size="large" allowClear showSearch placeholder="Chọn block" style={{ width: '100%' }} value={value.block} onChange={(v) => set({ block: v })} options={blockOptions} notFoundContent="Chưa có block trong trang hiện tại" />
            </Col>
          </Row>
        </div>
      )}
    </Card>
  )
}

export const productBlocksOf = (rows: Product[]) => rows.map((p) => p.block).filter((b): b is string => Boolean(b))
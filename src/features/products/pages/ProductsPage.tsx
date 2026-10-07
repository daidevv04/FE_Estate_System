import { CloseOutlined, DownloadOutlined, PlusOutlined, SwapOutlined } from '@ant-design/icons'
import { App, Button, Card, Modal, Pagination, Select, Space, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatMoney } from '@/lib/format'
import { paths } from '@/routes/paths'
import { tokens as t } from '@/theme/tokens'
import { ProductFormModal } from '@/features/projects/components/ProductFormModal'
import {
  PRODUCT_STATUS, apiErrorMessage, useProductMutations, useProducts, useProductTotals, useProjects,
  type Product, type ProductInput, type ProductStatus,
} from '../api'
import { ProductFiltersBar, productBlocksOf, type FilterState } from '../components/ProductFilters'
import { ProductQuickFilter } from '../components/ProductQuickFilter'
import { ProductSummary } from '../components/ProductSummary'
import { ProductTable } from '../components/ProductTable'
import { ProductDetailModal } from '../components/ProductDetailModal'

const INITIAL: FilterState = { page: 0, size: 10 }
const PAGE_SIZE = [{ value: 10, label: '10' }, { value: 20, label: '20' }, { value: 50, label: '50' }]

/** 9.16: danh sách sản phẩm toàn hệ thống — KPI + lọc + bảng + phân trang, dữ liệu 100% từ API. */
export function ProductsPage() {
  const { message } = App.useApp()
  const [filters, setFilters] = useState<FilterState>(INITIAL)
  const [selected, setSelected] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState<ProductStatus | undefined>()
  const [editing, setEditing] = useState<Product | null | undefined>(undefined)
  const [detailProductId, setDetailProductId] = useState<string>()
  const mutations = useProductMutations()

  // Tham số chỉ gửi field ProductController.list thực sự nhận.
  const list = useProducts(filters)
  const projects = useProjects({ page: 0, size: 200, sort: 'name,asc' })
  const totals = useProductTotals()

  const rows = list.data?.content ?? []
  const total = list.data?.totalElements ?? 0
  const size = filters.size ?? 10
  const from = total === 0 ? 0 : (filters.page ?? 0) * size + 1
  const pageTotal = rows.reduce((sum, p) => sum + (p.price ?? 0), 0)
  const projectNames = useMemo(
    () => Object.fromEntries((projects.data?.content ?? []).map((p) => [p.id, p.name])),
    [projects.data],
  )
  const projectOptions = (projects.data?.content ?? []).map((p) => ({ value: p.id, label: p.name }))
  const submitting = mutations.createProduct.isPending || mutations.updateProduct.isPending || mutations.uploadProductImage.isPending

  /** Backend chỉ có PATCH /products/{id} — cập nhật từng bản ghi thật, không giả bulk endpoint. */
  const applyBulk = async (status: ProductStatus) => {
    const targets = rows.filter((p) => selected.includes(p.id))
    const failed: string[] = []
    for (const item of targets) {
      try {
        await mutations.updateProduct.mutateAsync({ id: item.id, body: { status } })
      } catch {
        failed.push(item.code)
      }
    }
    if (failed.length === 0) message.success(`Đã cập nhật ${targets.length} sản phẩm`)
    else message.warning(`Cập nhật ${targets.length - failed.length}/${targets.length} sản phẩm. Thất bại: ${failed.join(', ')}`)
    setSelected([])
  }

  const save = (body: ProductInput, image?: File) => {
    void (async () => {
      try {
        const saved = editing
          ? await mutations.updateProduct.mutateAsync({ id: editing.id, body })
          : await mutations.createProduct.mutateAsync(body)
        if (image) await mutations.uploadProductImage.mutateAsync({ id: saved.id, file: image })
        message.success(editing ? 'Đã cập nhật sản phẩm' : 'Đã tạo sản phẩm')
        setEditing(undefined)
      } catch (error) {
        message.error(apiErrorMessage(error))
      }
    })()
  }

  return (
    <>
      <PageHeader
        breadcrumb={[{ title: 'Danh mục' }, { title: 'Sản phẩm', href: paths.products }]}
        title="Quản lý sản phẩm"
        status={<span className="products-scope">● Admin Scope · Toàn hệ thống</span>}
        meta="Quản lý toàn bộ danh sách căn hộ, đất nền và nhà phố trên toàn hệ thống."
        actions={
          <>
            <Button icon={<DownloadOutlined />} onClick={() => message.info('Chức năng xuất bảng hàng cần API xuất dữ liệu')}>Xuất bảng hàng</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing(null)}>Thêm sản phẩm</Button>
          </>
        }
      />
      <div style={{ marginBottom: 16 }}>
        <ProductSummary total={totals.all} counts={totals.counts} />
      </div>

      <ProductFiltersBar
        value={filters}
        projects={projectOptions}
        blocks={productBlocksOf(rows)}
        onChange={setFilters}
      />

      <Card className="stitch-card" variant="borderless" style={{ marginTop: 16 }} styles={{ body: { padding: 20 } }}>
        <ProductQuickFilter total={totals.all} counts={totals.counts} active={filters.status} onPick={(status) => setFilters((f) => ({ ...f, status, page: 0 }))} />

        {selected.length > 0 && (
          <div className="products-bulk">
            <span className="products-bulk__count">Đã chọn <strong>{selected.length}</strong> sản phẩm</span>
            <Button icon={<SwapOutlined />} onClick={() => setBulkStatus('AVAILABLE')}>Đổi trạng thái</Button>
            <Button type="text" icon={<CloseOutlined />} onClick={() => setSelected([])}>Bỏ chọn</Button>
            <div className="products-bulk__meta">
              <span>Đang xem {from} - {from + rows.length - 1} của {total} sản phẩm</span>
              <span>Tổng niêm yết trang này: <strong>{formatMoney(pageTotal)}</strong></span>
            </div>
          </div>
        )}

        <ProductTable
          rows={rows}
          loading={list.isLoading}
          emptyText={list.isError ? apiErrorMessage(list.error) : 'Chưa có sản phẩm phù hợp bộ lọc'}
          selected={selected}
          projectNames={projectNames}
          onSelect={setSelected}
          onEdit={setEditing}
          onView={(product) => setDetailProductId(product.id)}
        />

        <div className="products-pager">
          <Typography.Text style={{ fontSize: 13, color: t.colorTextSub }}>Đang xem {from} - {from + rows.length - 1} của {total} sản phẩm</Typography.Text>
          <Space size={8}>
            <Typography.Text style={{ fontSize: 13, color: t.colorTextMuted }}>Xem</Typography.Text>
            <Select size="small" value={size} onChange={(v) => setFilters((f) => ({ ...f, size: v, page: 0 }))} options={PAGE_SIZE} />
            <Typography.Text style={{ fontSize: 13, color: t.colorTextMuted }}>/ trang</Typography.Text>
          </Space>
          <Pagination current={(filters.page ?? 0) + 1} pageSize={size} total={total} showSizeChanger={false} size="small" onChange={(p) => setFilters((f) => ({ ...f, page: p - 1 }))} />
        </div>
      </Card>

      <Modal
        open={bulkStatus !== undefined}
        title="Đổi trạng thái sản phẩm"
        okText="Áp dụng"
        cancelText="Hủy"
        onCancel={() => setBulkStatus(undefined)}
        onOk={() => { if (bulkStatus) void applyBulk(bulkStatus); setBulkStatus(undefined) }}
      >
        <Select style={{ width: '100%', marginTop: 12 }} value={bulkStatus} onChange={setBulkStatus} options={PRODUCT_STATUS} />
      </Modal>

      <ProductFormModal
        open={editing !== undefined}
        projectId={editing?.projectId}
        projects={projectOptions}
        editing={editing ?? null}
        submitting={submitting}
        onCancel={() => setEditing(undefined)}
        onSubmit={save}
      />
      <ProductDetailModal productId={detailProductId} onClose={() => setDetailProductId(undefined)} onEdit={(product) => { setDetailProductId(undefined); setEditing(product) }} />
    </>
  )
}
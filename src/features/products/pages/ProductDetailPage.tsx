import { EditOutlined, HistoryOutlined, SwapOutlined } from '@ant-design/icons'
import { App, Button, Dropdown, Empty, Modal, Skeleton, Tag } from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCustomers, useStaff, type Customer } from '@/features/customers/api'
import { useLeads, type Lead } from '@/features/leads/api'
import { ProductFormModal } from '@/features/projects/components/ProductFormModal'
import { useProject } from '@/features/projects/api'
import { formatDate } from '@/lib/format'
import { paths } from '@/routes/paths'
import { useProduct } from '../api'
import { ProductCustomerPanel } from '../components/ProductCustomerPanel'
import { ProductFloorPlans } from '../components/ProductFloorPlans'
import { ProductGallery } from '../components/ProductGallery'
import { ProductHistory } from '../components/ProductHistory'
import { ProductKpis } from '../components/ProductKpis'
import { ProductLocation } from '../components/ProductLocation'
import { ProductPaymentPolicy } from '../components/ProductPaymentPolicy'
import { ProductSpecs } from '../components/ProductSpecs'
import { PRODUCT_STATUS, PRODUCT_TYPE, apiErrorMessage, labelOf, useProductMutations, type ProductInput, type ProductStatus } from '../api'

/** 9.17: chi tiết sản phẩm — header + KPI + 2 cột, dữ liệu 100% từ API (product / project / leads / customers). */
export function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const product = useProduct(id)
  const project = useProject(product.data?.projectId)
  const leads = useLeads()
  const customers = useCustomers()
  const staff = useStaff()
  const mutations = useProductMutations()
  const [editing, setEditing] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  const item = product.data
  const productLeads = useMemo(
    () => (leads.data?.content ?? []).filter((l: Lead) => l.productId === id),
    [leads.data, id],
  )
  const customerById = useMemo(
    () => new Map((customers.data?.content ?? []).map((c: Customer) => [c.id, c])),
    [customers.data],
  )
  const ownerName = (uid: string) => staff.data?.find((u) => u.id === uid)?.fullName ?? 'Chưa phân công'
  const customerName = (cid: string) => customerById.get(cid)?.fullName ?? 'Khách hàng ẩn danh'

  if (product.isLoading) return <div className="pd-loading"><Skeleton active /></div>
  if (!item) {
    return (
      <Empty description={product.isError ? apiErrorMessage(product.error) : 'Không tìm thấy sản phẩm'}>
        <Button type="primary" onClick={() => navigate(paths.products)}>Về danh sách sản phẩm</Button>
      </Empty>
    )
  }

  const setStatus = (status: ProductStatus) => {
    void mutations.updateProduct.mutateAsync({ id: item.id, body: { status } })
      .then(() => message.success(`Đã chuyển sang ${labelOf(PRODUCT_STATUS, status)}`))
      .catch((error) => message.error(apiErrorMessage(error)))
  }
  const save = (body: ProductInput, image?: File) => {
    void (async () => {
      try {
        const saved = await mutations.updateProduct.mutateAsync({ id: item.id, body })
        if (image) await mutations.uploadProductImage.mutateAsync({ id: saved.id, file: image })
        message.success('Đã cập nhật sản phẩm')
        setEditing(false)
      } catch (error) {
        message.error(apiErrorMessage(error))
      }
    })()
  }
return (
    <>
      <section className="stitch-card pd-head">
        <div className="pd-head__top">
          <div className="pd-head__id">
            <h1>{labelOf(PRODUCT_TYPE, item.type)} {item.code}</h1>
            <Tag color={item.status === 'AVAILABLE' ? 'green' : item.status === 'RESERVED' ? 'gold' : 'default'}>
              {labelOf(PRODUCT_STATUS, item.status)} ({item.status})
            </Tag>
          </div>
          <span className="pd-head__brand"><HistoryOutlined /> Bất động sản Đất Xanh Miền Trung độc quyền</span>
        </div>
        <div className="pd-head__meta">
          <span><em>Mã sản phẩm:</em> <b className="pd-chip">{item.code}</b></span>
          <i>·</i>
          <span><em>Dự án:</em> <b>{project.data?.name ?? '—'}</b></span>
          <i>·</i>
          <span><em>Block:</em> <b>{item.block ?? '—'}</b></span>
          <i>·</i>
          <span><em>Cập nhật:</em> <b>{formatDate(item.updatedAt)}</b></span>
        </div>
        <div className="pd-head__actions">
          <Dropdown
            menu={{
              items: PRODUCT_STATUS.filter((s) => s.value !== item.status).map((s) => ({ key: s.value, label: s.label })),
              onClick: ({ key }) => setStatus(key as ProductStatus),
            }}
          >
            <Button icon={<SwapOutlined />} loading={mutations.updateProduct.isPending}>Đổi trạng thái</Button>
          </Dropdown>
          <Button type="primary" icon={<EditOutlined />} onClick={() => setEditing(true)}>Chỉnh sửa</Button>
        </div>
      </section>

      <div className="pd-kpis"><ProductKpis product={item} projectName={project.data?.name ?? null} /></div>

      <div className="pd-grid">
        <div className="pd-col">
          <ProductGallery imageUrl={item.imageUrl} code={item.code} caption={project.data?.name ?? undefined} onOpen={() => setLightbox(true)} />
          <ProductSpecs product={item} projectName={project.data?.name ?? null} />
          <ProductFloorPlans plans={[]} />
          <ProductLocation location={project.data?.location ?? null} code={item.code} />
        </div>
        <div className="pd-side">
          <ProductCustomerPanel leads={productLeads} customerById={customerById} ownerName={ownerName} loading={leads.isLoading} />
          <ProductPaymentPolicy terms={[]} />
          <ProductHistory product={item} leads={productLeads} customerName={customerName} onRefresh={() => void product.refetch()} />
        </div>
      </div>

      <Modal open={lightbox} footer={null} onCancel={() => setLightbox(false)} centered width="min(92vw, 1120px)">
        {item.imageUrl && <img src={item.imageUrl} alt={`Ảnh lớn ${item.code}`} />}
      </Modal>

      <ProductFormModal
        open={editing}
        projectId={item.projectId}
        editing={item}
        submitting={mutations.updateProduct.isPending || mutations.uploadProductImage.isPending}
        onCancel={() => setEditing(false)}
        onSubmit={save}
      />
    </>
  )
}
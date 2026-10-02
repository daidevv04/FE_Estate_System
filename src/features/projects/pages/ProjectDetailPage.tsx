import { AppstoreOutlined, EditOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Descriptions, Dropdown, Empty, Modal, Row, Tabs, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDate, formatMoneyShort } from '@/lib/format'
import { paths } from '@/routes/paths'
import { PROJECT_STATUS, apiErrorMessage, labelOf, useProject, useProjectMutations, useProjectProducts, type Product, type ProductFilters } from '../api'
import { ProductFormModal } from '../components/ProductFormModal'
import { ProjectHero } from '../components/ProjectHero'
import { ProjectProductsTable } from '../components/ProjectProductsTable'
import { ProjectFormModal } from '../components/ProjectFormModal'

/** 9.15: hero duy nhất + KPI API thật + nội dung tab không render đồng thời. */
export function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const project = useProject(id)
  const [tab, setTab] = useState('products')
  const [filters, setFilters] = useState<ProductFilters>({ page: 0, size: 10 })
  const [projectEdit, setProjectEdit] = useState(false)
  const [editing, setEditing] = useState<Product | null | undefined>(undefined)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const mutations = useProjectMutations()
  const products = useProjectProducts(id, filters)
  const item = project.data
  const pageValue = useMemo(() => (products.data?.content ?? []).reduce((sum, product) => sum + (product.price ?? 0), 0), [products.data])
  const pageAvailable = useMemo(() => (products.data?.content ?? []).filter((product) => product.status === 'AVAILABLE').length, [products.data])

  if (project.isLoading) return <Card className="stitch-card" loading />
  if (!item) return <Empty description={project.isError ? apiErrorMessage(project.error) : 'Không tìm thấy dự án'}><Button type="primary" onClick={() => navigate(paths.projects)}>Về danh sách dự án</Button></Empty>

  const removeProduct = (product: Product) => modal.confirm({ title: `Xóa sản phẩm ${product.code}?`, content: 'Sản phẩm có lead hoặc đang nằm trong hợp đồng sẽ không xóa được.', okText: 'Xóa', cancelText: 'Hủy', okButtonProps: { danger: true }, onOk: () => mutations.removeProduct.mutateAsync(product.id).then(() => message.success('Đã xóa sản phẩm')).catch((error) => { message.error(apiErrorMessage(error)); throw error }) })
  const saveProject = (body: Parameters<React.ComponentProps<typeof ProjectFormModal>['onSubmit']>[0], image?: File) => { void (async () => { try { const saved = await mutations.update.mutateAsync({ id: item.id, body }); if (image) await mutations.uploadProjectImage.mutateAsync({ id: saved.id, file: image }); message.success('Đã cập nhật dự án'); setProjectEdit(false) } catch (error) { message.error(apiErrorMessage(error)) } })() }
  const saveProduct = (body: Parameters<React.ComponentProps<typeof ProductFormModal>['onSubmit']>[0], image?: File) => { void (async () => { try { const saved = editing ? await mutations.updateProduct.mutateAsync({ id: editing.id, body }) : await mutations.createProduct.mutateAsync(body); if (image) await mutations.uploadProductImage.mutateAsync({ id: saved.id, file: image }); message.success(editing ? 'Đã cập nhật sản phẩm' : 'Đã tạo sản phẩm'); setEditing(undefined) } catch (error) { message.error(apiErrorMessage(error)) } })() }

  return <>
    <PageHeader breadcrumb={[{ title: 'Danh mục' }, { title: 'Dự án', href: paths.projects }, { title: item.name }]} title={item.name} status={<Tag color={item.status === 'SELLING' ? 'green' : item.status === 'PLANNING' ? 'gold' : 'default'}>{labelOf(PROJECT_STATUS, item.status)}</Tag>} meta={`${item.location || 'Chưa cập nhật địa điểm'} · Cập nhật ${formatDate(item.updatedAt)}`} actions={<><Button icon={<EditOutlined />} onClick={() => setProjectEdit(true)}>Sửa dự án</Button><Button type="primary" icon={<PlusOutlined />} onClick={() => { setTab('products'); setEditing(null) }}>Thêm sản phẩm</Button><Dropdown menu={{ items: [{ key: 'export', label: 'Xuất thông tin', icon: <MoreOutlined /> }], onClick: () => message.info('Xuất thông tin dự án cần API báo cáo') }}><Button aria-label="Thao tác bổ sung" icon={<MoreOutlined />} /></Dropdown></>} />
    <ProjectHero key={item.id} project={item} onEdit={() => setProjectEdit(true)} onOpenImage={() => setLightbox(item.imageUrl ?? null)} />
    <Row className="project-kpis" gutter={[16, 16]}>
      <Col xs={24} sm={8}><Card className="project-kpi project-kpi--green" variant="borderless"><AppstoreOutlined /><div><Typography.Text>Tổng sản phẩm</Typography.Text><strong>{products.data?.totalElements ?? 0}</strong><span>Toàn bộ dự án</span></div></Card></Col>
      <Col xs={24} sm={8}><Card className="project-kpi project-kpi--amber" variant="borderless"><span className="project-kpi__currency">₫</span><div><Typography.Text>Giá niêm yết</Typography.Text><strong>{formatMoneyShort(pageValue)}</strong><span>Trên {products.data?.content.length ?? 0} sản phẩm trang hiện tại</span></div></Card></Col>
      <Col xs={24} sm={8}><Card className="project-kpi project-kpi--teal" variant="borderless"><span className="project-kpi__check">✓</span><div><Typography.Text>Còn trống</Typography.Text><strong>{pageAvailable}</strong><span>Trên {products.data?.content.length ?? 0} sản phẩm trang hiện tại</span></div></Card></Col>
    </Row>
    <Tabs className="project-detail-tabs" activeKey={tab} onChange={setTab} items={[
      { key: 'overview', label: 'Tổng quan', children: <Card className="stitch-card project-detail-overview" variant="borderless"><Descriptions title="Thông tin dự án" column={{ xs: 1, md: 2 }}><Descriptions.Item label="Trạng thái">{labelOf(PROJECT_STATUS, item.status)}</Descriptions.Item><Descriptions.Item label="Ngày tạo">{formatDate(item.createdAt)}</Descriptions.Item><Descriptions.Item label="Địa điểm">{item.location || 'Chưa cập nhật'}</Descriptions.Item><Descriptions.Item label="Chủ đầu tư">{item.investor || 'Chưa cập nhật'}</Descriptions.Item><Descriptions.Item label="Mô tả" span={2}><div className="project-detail-overview__description">{item.description || 'Chưa có mô tả dự án.'}</div></Descriptions.Item></Descriptions></Card> },
      { key: 'products', label: `Danh sách sản phẩm (${products.data?.totalElements ?? 0})`, children: <ProjectProductsTable data={products.data} error={products.error} loading={products.isLoading} filters={filters} onFiltersChange={setFilters} onEdit={setEditing} onDelete={removeProduct} onPreview={setLightbox} /> },
    ]} />
    <Modal open={Boolean(lightbox)} footer={null} onCancel={() => setLightbox(null)} centered keyboard width="min(92vw, 1120px)" className="project-image-lightbox">{lightbox && <img src={lightbox} alt={`Ảnh lớn ${item.name}`} />}</Modal>
    <ProjectFormModal open={projectEdit} editing={item} submitting={mutations.update.isPending || mutations.uploadProjectImage.isPending} onCancel={() => setProjectEdit(false)} onSubmit={saveProject} />
    <ProductFormModal open={editing !== undefined} projectId={item.id} editing={editing ?? null} submitting={mutations.createProduct.isPending || mutations.updateProduct.isPending || mutations.uploadProductImage.isPending} onCancel={() => setEditing(undefined)} onSubmit={saveProduct} />
  </>
}
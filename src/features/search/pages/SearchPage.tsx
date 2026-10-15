import {
  AppstoreOutlined,
  ClockCircleOutlined,
  FileDoneOutlined,
  HomeOutlined,
  PhoneOutlined,
  RightOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Skeleton,
  Space,
  Tabs,
  Typography,
} from 'antd'
import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { useCustomers, customerCode, statusLabel as customerStatusLabel } from '@/features/customers/api'
import { useProjects, useProducts } from '@/features/projects/api'
import { useLeads, STAGE_LABEL, type LeadStage } from '@/features/leads/api'
import { useDeals, dealStatusLabel, paymentStatusLabel } from '@/features/deals/api'
import { StatusPill, type StatusTone } from '@/components/common/StatusPill'
import { paths } from '@/routes/paths'

const norm = (s: string | null | undefined) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()

const formatMoney = (val: number | null | undefined) => {
  if (val == null) return '—'
  if (val >= 1e9) return `${(val / 1e9).toFixed(1).replace(/\.0$/, '')} tỷ`
  if (val >= 1e6) return `${(val / 1e6).toFixed(0)} triệu`
  return new Intl.NumberFormat('vi-VN').format(val) + ' đ'
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryParam = searchParams.get('q') ?? ''
  const tabParam = searchParams.get('tab') ?? 'all'

  const customersQuery = useCustomers()
  const projectsQuery = useProjects({})
  const productsQuery = useProducts({})
  const leadsQuery = useLeads()
  const dealsQuery = useDeals()

  const q = norm(queryParam)

  const customers = useMemo(() => {
    const list = customersQuery.data?.content ?? []
    if (!q) return []
    return list.filter(
      (c) =>
        norm(c.fullName).includes(q) ||
        norm(c.phone).includes(q) ||
        norm(c.email).includes(q) ||
        norm(c.source).includes(q) ||
        norm(customerCode(c)).includes(q),
    )
  }, [customersQuery.data, q])

  const projects = useMemo(() => {
    const list = projectsQuery.data?.content ?? []
    if (!q) return []
    return list.filter(
      (p) =>
        norm(p.name).includes(q) ||
        norm(p.location).includes(q) ||
        norm(p.investor).includes(q),
    )
  }, [projectsQuery.data, q])

  const products = useMemo(() => {
    const list = productsQuery.data?.content ?? []
    if (!q) return []
    return list.filter(
      (p) =>
        norm(p.code).includes(q) ||
        norm(p.block).includes(q) ||
        norm(p.type).includes(q),
    )
  }, [productsQuery.data, q])

  const leads = useMemo(() => {
    const list = leadsQuery.data?.content ?? []
    if (!q) return []
    return list.filter(
      (l) =>
        norm(l.id).includes(q) ||
        norm(STAGE_LABEL[l.stage]).includes(q) ||
        norm(l.stage).includes(q),
    )
  }, [leadsQuery.data, q])

  const deals = useMemo(() => {
    const list = dealsQuery.data?.content ?? []
    if (!q) return []
    return list.filter(
      (d) =>
        norm(d.contractCode).includes(q) ||
        norm(d.note).includes(q) ||
        norm(dealStatusLabel(d.status)).includes(q),
    )
  }, [dealsQuery.data, q])

  const totalCount =
    customers.length +
    projects.length +
    products.length +
    leads.length +
    deals.length

  const isLoading =
    customersQuery.isLoading ||
    projectsQuery.isLoading ||
    productsQuery.isLoading ||
    leadsQuery.isLoading ||
    dealsQuery.isLoading

  const switchTab = (t: string) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      p.set('tab', t)
      return p
    })
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      <PageHeader
        title="Kết quả tìm kiếm"
        meta="Tra cứu nhanh khách hàng, dự án, sản phẩm bất động sản, cơ hội và hợp đồng"
      />

      {queryParam ? (
        <div style={{ marginBottom: 20 }}>
          <Typography.Title level={4} style={{ margin: 0, fontWeight: 600 }}>
            Kết quả cho: <span style={{ color: '#006b2c' }}>"{queryParam}"</span>
            {!isLoading && (
              <span style={{ fontSize: 15, fontWeight: 400, color: '#64748b', marginLeft: 10 }}>
                ({totalCount} kết quả)
              </span>
            )}
          </Typography.Title>
        </div>
      ) : null}

      {!queryParam ? (
        <Card className="stitch-card" variant="borderless" styles={{ body: { padding: 48, textAlign: 'center' } }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Typography.Text strong style={{ fontSize: 16 }}>
                  Nhập từ khóa trên thanh tìm kiếm ở đầu trang để tra cứu
                </Typography.Text>
                <div style={{ color: '#64748b', marginTop: 8 }}>
                  Bạn có thể tìm kiếm theo tên khách hàng, số điện thoại, dự án, mã căn hộ hoặc hợp đồng.
                </div>
              </div>
            }
          />
        </Card>
      ) : isLoading ? (
        <Card className="stitch-card" variant="borderless" styles={{ body: { padding: 24 } }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      ) : totalCount === 0 ? (
        <Card className="stitch-card" variant="borderless" styles={{ body: { padding: 48, textAlign: 'center' } }}>
          <Empty
            description={
              <div>
                <Typography.Text strong style={{ fontSize: 16 }}>
                  Không tìm thấy kết quả nào phù hợp với "{queryParam}"
                </Typography.Text>
                <div style={{ color: '#64748b', marginTop: 8 }}>
                  Thử tìm kiếm với từ khóa ngắn hơn hoặc kiểm tra lại chính tả.
                </div>
              </div>
            }
          />
        </Card>
      ) : (
        <SearchTabs
          activeKey={tabParam}
          onChange={switchTab}
          totalCount={totalCount}
          customers={customers}
          projects={projects}
          products={products}
          leads={leads}
          deals={deals}
        />
      )}
    </div>
  )
}

function SearchTabs({
  activeKey, onChange, totalCount, customers, projects, products, leads, deals,
}: {
  activeKey: string; onChange: (k: string) => void; totalCount: number;
  customers: any[]; projects: any[]; products: any[]; leads: any[]; deals: any[];
}) {
  const navigate = useNavigate()
  const renderAll = () => (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {customers.length > 0 && (
        <CategorySection title="Khách hàng" icon={<TeamOutlined style={{ color: '#1677ff' }} />} count={customers.length} onViewMore={() => onChange('customers')}>
          <Row gutter={[16, 16]}>
            {customers.slice(0, 4).map((c) => (
              <Col xs={24} sm={12} key={c.id}><CustomerCard customer={c} onSelect={() => navigate(paths.customer(c.id))} /></Col>
            ))}
          </Row>
        </CategorySection>
      )}
      {projects.length > 0 && (
        <CategorySection title="Dự án" icon={<HomeOutlined style={{ color: '#722ed1' }} />} count={projects.length} onViewMore={() => onChange('projects')}>
          <Row gutter={[16, 16]}>
            {projects.slice(0, 4).map((p) => (
              <Col xs={24} sm={12} key={p.id}><ProjectCard project={p} onSelect={() => navigate(paths.project(p.id))} /></Col>
            ))}
          </Row>
        </CategorySection>
      )}
      {products.length > 0 && (
        <CategorySection title="Sản phẩm / Căn hộ" icon={<AppstoreOutlined style={{ color: '#fa8c16' }} />} count={products.length} onViewMore={() => onChange('products')}>
          <Row gutter={[16, 16]}>
            {products.slice(0, 4).map((p) => (
              <Col xs={24} sm={12} key={p.id}><ProductCard product={p} onSelect={() => navigate(paths.product(p.id))} /></Col>
            ))}
          </Row>
        </CategorySection>
      )}
      {leads.length > 0 && (
        <CategorySection title="Cơ hội (Leads)" icon={<ClockCircleOutlined style={{ color: '#13c2c2' }} />} count={leads.length} onViewMore={() => onChange('leads')}>
          <Row gutter={[16, 16]}>
            {leads.slice(0, 4).map((l) => (
              <Col xs={24} sm={12} key={l.id}><LeadCard lead={l} onSelect={() => navigate(paths.lead(l.id))} /></Col>
            ))}
          </Row>
        </CategorySection>
      )}
      {deals.length > 0 && (
        <CategorySection title="Hợp đồng (Deals)" icon={<FileDoneOutlined style={{ color: '#52c41a' }} />} count={deals.length} onViewMore={() => onChange('deals')}>
          <Row gutter={[16, 16]}>
            {deals.slice(0, 4).map((d) => (
              <Col xs={24} sm={12} key={d.id}><DealCard deal={d} onSelect={() => navigate(paths.deal(d.id))} /></Col>
            ))}
          </Row>
        </CategorySection>
      )}
    </Space>
  )

  const items = [
    { key: 'all', label: <Space><span>Tất cả</span><Badge count={totalCount} overflowCount={99} style={{ backgroundColor: '#006b2c' }} /></Space>, children: renderAll() },
    { key: 'customers', label: <Space><TeamOutlined /><span>Khách hàng</span><Badge count={customers.length} overflowCount={99} /></Space>, children: <Row gutter={[16, 16]}>{customers.map((c) => <Col xs={24} sm={12} lg={8} key={c.id}><CustomerCard customer={c} onSelect={() => navigate(paths.customer(c.id))} /></Col>)}</Row> },
    { key: 'projects', label: <Space><HomeOutlined /><span>Dự án</span><Badge count={projects.length} overflowCount={99} /></Space>, children: <Row gutter={[16, 16]}>{projects.map((p) => <Col xs={24} sm={12} lg={8} key={p.id}><ProjectCard project={p} onSelect={() => navigate(paths.project(p.id))} /></Col>)}</Row> },
    { key: 'products', label: <Space><AppstoreOutlined /><span>Sản phẩm</span><Badge count={products.length} overflowCount={99} /></Space>, children: <Row gutter={[16, 16]}>{products.map((p) => <Col xs={24} sm={12} lg={8} key={p.id}><ProductCard product={p} onSelect={() => navigate(paths.product(p.id))} /></Col>)}</Row> },
    { key: 'leads', label: <Space><ClockCircleOutlined /><span>Cơ hội</span><Badge count={leads.length} overflowCount={99} /></Space>, children: <Row gutter={[16, 16]}>{leads.map((l) => <Col xs={24} sm={12} lg={8} key={l.id}><LeadCard lead={l} onSelect={() => navigate(paths.lead(l.id))} /></Col>)}</Row> },
    { key: 'deals', label: <Space><FileDoneOutlined /><span>Hợp đồng</span><Badge count={deals.length} overflowCount={99} /></Space>, children: <Row gutter={[16, 16]}>{deals.map((d) => <Col xs={24} sm={12} lg={8} key={d.id}><DealCard deal={d} onSelect={() => navigate(paths.deal(d.id))} /></Col>)}</Row> },
  ]

  return <Tabs activeKey={activeKey} onChange={onChange} type="line" items={items} />
}

function CategorySection({
  title, icon, count, onViewMore, children,
}: {
  title: string; icon: React.ReactNode; count: number; onViewMore: () => void; children: React.ReactNode;
}) {
  return (
    <Card
      className="stitch-card"
      variant="borderless"
      styles={{ body: { padding: '20px 24px' } }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon}
          <span style={{ fontWeight: 600, fontSize: 16 }}>{title}</span>
          <Badge count={count} style={{ backgroundColor: '#f1f5f9', color: '#475569', boxShadow: 'none' }} />
        </div>
      }
      extra={count > 4 ? <Button type="link" onClick={onViewMore} style={{ padding: 0 }}>Xem tất cả {count} kết quả <RightOutlined style={{ fontSize: 11 }} /></Button> : null}
    >
      {children}
    </Card>
  )
}

function CustomerCard({ customer, onSelect }: { customer: any; onSelect: () => void }) {
  const cTone: StatusTone = customer.status === 'CUSTOMER' ? 'green' : customer.status === 'POTENTIAL' ? 'amber' : customer.status === 'NEW' ? 'blue' : 'gray'
  return (
    <div onClick={onSelect} style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }} className="search-item-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <Typography.Text strong style={{ fontSize: 15, color: '#0f172a' }}>{customer.fullName}</Typography.Text>
        <StatusPill tone={cTone} size="sm">{customerStatusLabel(customer.status)}</StatusPill>
      </div>
      <Space direction="vertical" size={2} style={{ width: '100%', fontSize: 13, color: '#64748b' }}>
        {customer.phone && <div><PhoneOutlined style={{ marginRight: 6 }} />{customer.phone}</div>}
        {customer.email && <div>{customer.email}</div>}
        <div style={{ fontSize: 12, marginTop: 4, color: '#94a3b8' }}>Mã KH: {customerCode(customer)}</div>
      </Space>
    </div>
  )
}

function ProjectCard({ project, onSelect }: { project: any; onSelect: () => void }) {
  const pTone: StatusTone = project.status === 'SELLING' ? 'green' : project.status === 'PLANNING' ? 'amber' : project.status === 'SOLD_OUT' ? 'blue' : 'gray'
  const pLabel = project.status === 'SELLING' ? 'Đang bán' : project.status === 'PLANNING' ? 'Chuẩn bị' : project.status === 'SOLD_OUT' ? 'Hết hàng' : project.status
  return (
    <div onClick={onSelect} style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }} className="search-item-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <Typography.Text strong style={{ fontSize: 15, color: '#0f172a' }}>{project.name}</Typography.Text>
        <StatusPill tone={pTone} size="sm">{pLabel}</StatusPill>
      </div>
      <Space direction="vertical" size={2} style={{ width: '100%', fontSize: 13, color: '#64748b' }}>
        {project.location && <div>{project.location}</div>}
        {project.investor && <div>Chủ đầu tư: {project.investor}</div>}
      </Space>
    </div>
  )
}

function ProductCard({ product, onSelect }: { product: any; onSelect: () => void }) {
  const prodTone: StatusTone = product.status === 'AVAILABLE' ? 'green' : product.status === 'RESERVED' ? 'amber' : 'blue'
  const prodLabel = product.status === 'AVAILABLE' ? 'Còn trống' : product.status === 'RESERVED' ? 'Giữ chỗ' : 'Đã bán'
  return (
    <div onClick={onSelect} style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }} className="search-item-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <Typography.Text strong style={{ fontSize: 15, color: '#0f172a' }}>Mã: {product.code}</Typography.Text>
        <StatusPill tone={prodTone} size="sm">{prodLabel}</StatusPill>
      </div>
      <Space direction="vertical" size={2} style={{ width: '100%', fontSize: 13, color: '#64748b' }}>
        <div>Loại: {product.type} {product.block ? `· Khu ${product.block}` : ''}</div>
        <div style={{ fontWeight: 600, color: '#006b2c' }}>Giá: {formatMoney(product.price)}</div>
      </Space>
    </div>
  )
}

function LeadCard({ lead, onSelect }: { lead: any; onSelect: () => void }) {
  const leadTone: StatusTone = lead.stage === 'WON' ? 'green' : lead.stage === 'LOST' ? 'red' : 'blue'
  return (
    <div onClick={onSelect} style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }} className="search-item-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <Typography.Text strong style={{ fontSize: 15, color: '#0f172a' }}>Cơ hội #{lead.id.slice(0, 8)}</Typography.Text>
        <StatusPill tone={leadTone} size="sm">
          {STAGE_LABEL[lead.stage as LeadStage] ?? lead.stage}
        </StatusPill>
      </div>
      <Space direction="vertical" size={2} style={{ width: '100%', fontSize: 13, color: '#64748b' }}>
        <div>Giá trị dự kiến: <b>{formatMoney(lead.expectedValue)}</b></div>
        {lead.closeDate && <div>Hạn chốt: {lead.closeDate}</div>}
      </Space>
    </div>
  )
}

function DealCard({ deal, onSelect }: { deal: any; onSelect: () => void }) {
  const dTone: StatusTone = deal.status === 'COMPLETED' ? 'green' : deal.status === 'ACTIVE' ? 'purple' : deal.status === 'IN_PROGRESS' ? 'blue' : 'gray'
  const payTone: StatusTone = deal.paymentStatus === 'PAID' ? 'green' : deal.paymentStatus === 'PARTIAL' ? 'amber' : 'red'
  return (
    <div onClick={onSelect} style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }} className="search-item-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <Typography.Text strong style={{ fontSize: 15, color: '#0f172a' }}>{deal.contractCode}</Typography.Text>
        <StatusPill tone={dTone} size="sm">{dealStatusLabel(deal.status)}</StatusPill>
      </div>
      <Space direction="vertical" size={2} style={{ width: '100%', fontSize: 13, color: '#64748b' }}>
        <div>Giá trị HĐ: <b>{formatMoney(deal.contractValue)}</b></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>Thanh toán: <StatusPill tone={payTone} size="sm" dot={false}>{paymentStatusLabel(deal.paymentStatus)}</StatusPill></div>
      </Space>
    </div>
  )
}


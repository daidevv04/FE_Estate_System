import {
  DownOutlined, PlusOutlined, ProjectOutlined, ReloadOutlined, SearchOutlined, SwapOutlined, TableOutlined,
} from '@ant-design/icons'
import { App, Button, Descriptions, Modal, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCustomers, useStaff } from '@/features/customers/api'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'
import { tokens as t } from '@/theme/tokens'
import {
  CLOSE_OPTIONS, LEAD_STAGES, OPEN_STAGES, PRODUCT_TYPE_LABEL, STAGE_LABEL, VALUE_OPTIONS,
  apiErrorMessage, fullVnd, matchClose, matchValue, nextStage, overdueDays, shortDate,
  useLeadCatalog, useLeadMutations, useLeads,
  type CloseWindow, type Lead, type LeadInput, type LeadStage, type ValueBucket,
} from '../api'
import { LeadFormModal } from '../components/LeadFormModal'
import { PipelineBoard } from '../components/PipelineBoard'
import { PipelineSummary } from '../components/PipelineSummary'

const emptyStage = (): Record<LeadStage, Lead[]> => ({
  NEW: [], CONTACTED: [], INTERESTED: [], PROPOSAL_SENT: [], NEGOTIATION: [], INTERNAL_REVIEW: [], WON: [], LOST: [],
})

/** Số liệu 3 thẻ KPI đầu trang — tính từ chính dữ liệu lead đang tải (backend chưa có /dashboard/overview) */
function useSummary(leads: Lead[]) {
  return useMemo(() => {
    const open = leads.filter((l) => OPEN_STAGES.includes(l.stage))
    const expected = open.reduce((s, l) => s + (l.expectedValue ?? 0), 0)
    const late = open.filter((l) => overdueDays(l) > 0)
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const prevStart = new Date(monthStart)
    prevStart.setMonth(prevStart.getMonth() - 1)
    const created = leads.map((l) => new Date(l.createdAt))
    const newThis = created.filter((d) => d >= monthStart).length
    const newPrev = created.filter((d) => d >= prevStart && d < monthStart).length
    return {
      openCount: open.length,
      expected,
      lateCount: late.length,
      growth: newPrev > 0 ? Math.round(((newThis - newPrev) / newPrev) * 100) : null,
      quarter: Math.floor(new Date().getMonth() / 3) + 1,
      year: new Date().getFullYear(),
    }
  }, [leads])
}

/** Pipeline lead (mục 9.18) — ADMIN/MANAGER thấy toàn công ty, SALES chỉ thấy lead được gán (backend ép quyền) */
export function LeadsPage() {
  const { message, modal } = App.useApp()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const canViewAll = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  // Chế độ xem lưu ở ?view= để F5/back giữ nguyên
  const [searchParams, setSearchParams] = useSearchParams()
  const view: 'kanban' | 'table' = searchParams.get('view') === 'table' ? 'table' : 'kanban'

  const [keyword, setKeyword] = useState('')
  const [stage, setStage] = useState<LeadStage | 'all'>('all')
  const [salesId, setSalesId] = useState('all')
  const [projectId, setProjectId] = useState('all')
  const [value, setValue] = useState<ValueBucket>('all')
  const [closeWin, setCloseWin] = useState<CloseWindow>('30d')
  const [detail, setDetail] = useState<Lead | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const { data, isLoading, isError, error, refetch } = useLeads()
  const { products, projects } = useLeadCatalog()
  const { data: customerPage } = useCustomers()
  const { data: staff = [] } = useStaff()
  const { move, create } = useLeadMutations()

  const leads = useMemo(() => data?.content ?? [], [data])
  const customers = useMemo(() => customerPage?.content ?? [], [customerPage])
  const productList = useMemo(() => products.data?.content ?? [], [products.data])
  const projectList = useMemo(() => projects.data?.content ?? [], [projects.data])

  const customerById = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers])
  const productById = useMemo(() => new Map(productList.map((p) => [p.id, p])), [productList])
  const projectById = useMemo(() => new Map(projectList.map((p) => [p.id, p])), [projectList])
  const staffById = useMemo(() => new Map(staff.map((u) => [u.id, u])), [staff])

  const ownerName = (id: string) =>
    staffById.get(id)?.fullName ?? (id === user?.id ? user?.fullName ?? 'Bạn' : `NV #${id.slice(0, 6)}`)
  const summary = useSummary(leads)

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return leads.filter((l) => {
      if (stage !== 'all' && l.stage !== stage) return false
      if (salesId !== 'all' && l.assignedTo !== salesId) return false
      const product = productById.get(l.productId)
      if (projectId !== 'all' && product?.projectId !== projectId) return false
      if (!matchValue(l.expectedValue, value)) return false
      if (!matchClose(l.closeDate, closeWin)) return false
      if (!kw) return true
      const customer = customerById.get(l.customerId)
      const project = product ? projectById.get(product.projectId) : undefined
      const owner = staffById.get(l.assignedTo)
      return [customer?.fullName, customer?.phone, customer?.email, customer?.source,
        product?.code, project?.name, owner?.fullName]
        .some((v) => (v ?? '').toLowerCase().includes(kw))
    })
  }, [leads, keyword, stage, salesId, projectId, value, closeWin, customerById, productById, projectById, staffById])

  const groups = useMemo(() => {
    const out = emptyStage()
    for (const l of filtered) out[l.stage].push(l)
    return out
  }, [filtered])

  const hasFilters = Boolean(keyword) || stage !== 'all' || salesId !== 'all'
    || projectId !== 'all' || value !== 'all' || closeWin !== '30d'
  const clearFilters = () => {
    setKeyword(''); setStage('all'); setSalesId('all'); setProjectId('all'); setValue('all'); setCloseWin('30d')
  }

  const onError = (e: unknown) => message.error(apiErrorMessage(e))
  const doMove = (lead: Lead, to: LeadStage) =>
    move.mutate({ id: lead.id, stage: to }, {
      onSuccess: () => {
        message.success(`Đã chuyển «${customerById.get(lead.customerId)?.fullName ?? 'Lead'}» sang ${STAGE_LABEL[to]}`)
        setDetail(null)
      },
      onError,
    })

  const onLose = (lead: Lead) =>
    modal.confirm({
      title: `Chuyển «${customerById.get(lead.customerId)?.fullName ?? 'lead'}» sang Mất?`,
      content: 'Lead vẫn được giữ trong pipeline ở cột Mất (Lost) để xem lại lịch sử.',
      okText: 'Chuyển sang «Mất»', okButtonProps: { danger: true }, cancelText: 'Đóng',
      onOk: () => doMove(lead, 'LOST'),
    })

  const submitForm = (body: LeadInput) =>
    create.mutate(body, {
      onSuccess: () => { message.success('Đã tạo lead mới'); setFormOpen(false) },
      onError,
    })

  const setView = (v: 'kanban' | 'table') => {
    const next = new URLSearchParams(searchParams)
    if (v === 'table') next.set('view', 'table')
    else next.delete('view')
    setSearchParams(next, { replace: true })
  }

  const productLabel = (lead: Lead) => {
    const product = productById.get(lead.productId)
    if (!product) return `Căn #${lead.productId.slice(0, 8)}`
    const project = projectById.get(product.projectId)
    return `${PRODUCT_TYPE_LABEL[product.type] ?? 'Căn'} ${product.code}${project ? ` · ${project.name}` : ''}`
  }

  const columns: ColumnsType<Lead> = [
    {
      title: 'Khách hàng', dataIndex: 'customerId', width: 200, fixed: 'left',
      render: (id: string) => {
        const c = customerById.get(id)
        return (
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontWeight: 600 }}>{c?.fullName ?? `Khách #${id.slice(0, 8)}`}</div>
            <div className="stitch-num" style={{ fontSize: 12, color: t.colorTextMuted }}>{c?.phone ?? '—'}</div>
          </div>
        )
      },
    },
    { title: 'Căn / sản phẩm', dataIndex: 'productId', width: 250, render: (_v, row) => productLabel(row) },
    {
      title: 'Giai đoạn', dataIndex: 'stage', width: 160,
      render: (s: LeadStage) => (
        <Tag style={{ color: t.statusColors.LeadStage[s], borderColor: t.colorBorder, background: '#fff' }}>
          {STAGE_LABEL[s]}
        </Tag>
      ),
    },
    {
      title: 'Giá trị kỳ vọng', dataIndex: 'expectedValue', width: 170, align: 'right',
      render: (v: number | null) => <span className="stitch-num">{fullVnd(v)}</span>,
    },
    {
      title: 'Hạn chốt', dataIndex: 'closeDate', width: 150,
      render: (d: string | null, row) => {
        const late = overdueDays(row)
        return (
          <div style={{ lineHeight: 1.3 }}>
            <div className="stitch-num">{shortDate(d)}</div>
            {late > 0 && <div style={{ fontSize: 12, color: t.colorErrorText }}>Quá hạn {late} ngày</div>}
          </div>
        )
      },
    },
    { title: 'Phụ trách', dataIndex: 'assignedTo', width: 160, render: (id: string) => ownerName(id) },
    {
      title: 'Nguồn', dataIndex: 'customerId', key: 'source', width: 130,
      render: (id: string) => {
        const s = customerById.get(id)?.source
        return s ? <Tag>{s}</Tag> : <span style={{ color: t.colorTextMuted }}>—</span>
      },
    },
  ]

  return (
    <>
      <div className="pipe">
        {/* Tiêu đề + phạm vi + chuyển chế độ xem + thêm lead */}
        <div className="pipe-head">
          <div>
            <div className="pipe-head__title">
              <h1 className="pipe-title">Pipeline Lead</h1>
              <span className="pipe-scope">
                <span className="pipe-scope__dot" />
                Phạm vi: {canViewAll ? 'Toàn hệ thống' : 'Lead của tôi'}
              </span>
            </div>
            <p className="pipe-desc">
              Quản lý lộ trình chuyển đổi giao dịch dự án cao cấp Đất Xanh Miền Trung toàn hệ thống (Phạm vi Admin)
            </p>
          </div>
          <div className="pipe-actions">
            <div className="pipe-switch">
              <button
                type="button"
                className={`pipe-switch__btn${view === 'kanban' ? ' is-active' : ''}`}
                aria-pressed={view === 'kanban'}
                onClick={() => setView('kanban')}
              >
                <ProjectOutlined /> <span>Kanban</span>
              </button>
              <button
                type="button"
                className={`pipe-switch__btn${view === 'table' ? ' is-active' : ''}`}
                aria-pressed={view === 'table'}
                onClick={() => setView('table')}
              >
                <TableOutlined /> <span>Bảng</span>
              </button>
            </div>
            <button type="button" className="pipe-btn-primary" onClick={() => setFormOpen(true)}>
              <PlusOutlined /> <span>Thêm lead</span>
            </button>
          </div>
        </div>

        <PipelineSummary data={summary} canViewAll={canViewAll} />

        {/* Bộ lọc: tìm kiếm + 5 lựa chọn + xoá lọc */}
        <div className="pipe-filters">
          <div className="pipe-filters__row">
            <div className="pipe-search">
              <SearchOutlined className="pipe-search__icon" />
              <input
                className="pipe-input"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo tên khách hàng, SĐT, mã lead, dự án..."
                aria-label="Tìm kiếm lead"
              />
            </div>

            <div className="pipe-select-wrap">
              <select
                className="pipe-select"
                value={stage}
                aria-label="Lọc theo giai đoạn"
                onChange={(e) => setStage(e.target.value as LeadStage | 'all')}
              >
                <option value="all">Tất cả 8 giai đoạn</option>
                {LEAD_STAGES.map((s) => (
                  <option key={s} value={s}>{`${LEAD_STAGES.indexOf(s) + 1}. ${STAGE_LABEL[s]}`}</option>
                ))}
              </select>
              <DownOutlined className="pipe-select__caret" />
            </div>

            <div className="pipe-select-wrap">
              <select
                className="pipe-select"
                value={salesId}
                aria-label="Lọc theo nhân viên phụ trách"
                onChange={(e) => setSalesId(e.target.value)}
              >
                <option value="all">{canViewAll ? 'Phụ trách: Toàn công ty' : 'Phụ trách: Tôi'}</option>
                {staff.filter((u) => u.status !== 'INACTIVE').map((u) => (
                  <option key={u.id} value={u.id}>{`${u.fullName} (${u.role})`}</option>
                ))}
              </select>
              <DownOutlined className="pipe-select__caret" />
            </div>

            <div className="pipe-select-wrap">
              <select
                className="pipe-select"
                value={projectId}
                aria-label="Lọc theo dự án"
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="all">Dự án: Tất cả</option>
                {projectList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <DownOutlined className="pipe-select__caret" />
            </div>

            <div className="pipe-select-wrap">
              <select
                className="pipe-select"
                value={value}
                aria-label="Lọc theo mức giá"
                onChange={(e) => setValue(e.target.value as ValueBucket)}
              >
                {VALUE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <DownOutlined className="pipe-select__caret" />
            </div>

            <div className="pipe-select-wrap">
              <select
                className="pipe-select"
                value={closeWin}
                aria-label="Lọc theo hạn chốt"
                onChange={(e) => setCloseWin(e.target.value as CloseWindow)}
              >
                {CLOSE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <DownOutlined className="pipe-select__caret" />
            </div>

            <button type="button" className="pipe-clear" onClick={clearFilters} title="Đặt lại bộ lọc">
              <ReloadOutlined /> <span>Xoá lọc</span>
            </button>
          </div>

          <div className="pipe-filters__foot">
            <span className="pipe-hint pipe-scroll-hint">
              <SwapOutlined className="pipe-hint__icon" />
              Mẹo: Cuộn ngang để theo dõi liên tục 8 giai đoạn từ Mới tiếp nhận đến Chốt deal Thắng / Mất
            </span>
            <span className="pipe-count">
              Hiển thị 8/8 Cột · Tổng {filtered.length} Cơ hội{hasFilters ? ' (đang lọc)' : ''}
            </span>
          </div>
        </div>

        {/* Khung kanban 8 cột (cuộn ngang) hoặc bảng dữ liệu cùng bộ lọc */}
        {isError && (
          <div className="pipe-alert">
            Không tải được pipeline lead: {(error as Error)?.message ?? 'lỗi không xác định'} ·{' '}
            <Button type="link" size="small" onClick={() => void refetch()}>Thử lại</Button>
          </div>
        )}

        {isLoading && (
          <div className="pipe-skeleton">
            {LEAD_STAGES.slice(0, 5).map((s) => <div key={s} className="pipe-skeleton__col" />)}
          </div>
        )}

        {!isLoading && !isError && view === 'kanban' && (
          <PipelineBoard
            groups={groups}
            customerById={customerById}
            productById={productById}
            projectById={projectById}
            ownerName={ownerName}
            canDrag
            onOpen={setDetail}
            onMove={doMove}
            onAdvance={(lead) => doMove(lead, nextStage(lead.stage))}
            onLose={onLose}
            onDetail={(lead) => navigate(paths.lead(lead.id))}
          />
        )}

        {!isLoading && !isError && view === 'table' && (
          <Table<Lead>
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            scroll={{ x: 'max-content' }}
            onRow={(row) => ({ onClick: () => setDetail(row), style: { cursor: 'pointer' } })}
            locale={{
              emptyText: hasFilters
                ? 'Không có lead khớp bộ lọc — thử xoá lọc'
                : 'Chưa có lead nào trong pipeline',
            }}
            pagination={{
              defaultPageSize: 10,
              pageSizeOptions: [10, 20, 50],
              showSizeChanger: true,
              showTotal: (total, r) => `Hiển thị ${r[0]} - ${r[1]} trong tổng số ${total} lead`,
            }}
          />
        )}
      </div>

      {/* Xem nhanh lead ngay trên kanban (thiết kế: modal preview + đổi bước) */}
      <Modal
        open={Boolean(detail)}
        onCancel={() => setDetail(null)}
        width={620}
        title="Chi tiết lead"
        footer={
          detail && (
            <Space wrap>
              <Button onClick={() => setDetail(null)}>Đóng</Button>
              {nextStage(detail.stage) !== detail.stage && (
                <Button onClick={() => doMove(detail, nextStage(detail.stage))}>
                  Chuyển sang «{STAGE_LABEL[nextStage(detail.stage)]}»
                </Button>
              )}
              {detail.stage !== 'LOST' && (
                <Button danger onClick={() => onLose(detail)}>Chuyển sang «Mất»</Button>
              )}
              <Button type="primary" onClick={() => navigate(paths.lead(detail.id))}>Mở trang chi tiết</Button>
            </Space>
          )
        }
      >
        {detail && (
          <>
            <Space align="center" style={{ marginBottom: 12 }} wrap>
              <Tag style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#15803d' }}>
                {LEAD_STAGES.indexOf(detail.stage) + 1}. {STAGE_LABEL[detail.stage]}
              </Tag>
              {overdueDays(detail) > 0 && (
                <Typography.Text type="danger" style={{ fontSize: 12 }}>
                  Quá hạn {overdueDays(detail)} ngày (hạn chốt {shortDate(detail.closeDate)})
                </Typography.Text>
              )}
            </Space>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              {customerById.get(detail.customerId)?.fullName ?? `Khách #${detail.customerId.slice(0, 8)}`}
            </Typography.Title>
            <Descriptions column={2} size="small" items={[
              { key: 'product', label: 'Căn / sản phẩm', children: productLabel(detail) },
              { key: 'value', label: 'Giá trị kỳ vọng', children: fullVnd(detail.expectedValue) },
              { key: 'close', label: 'Hạn chốt', children: shortDate(detail.closeDate) },
              { key: 'owner', label: 'Phụ trách', children: ownerName(detail.assignedTo) },
              { key: 'phone', label: 'SĐT khách', children: customerById.get(detail.customerId)?.phone ?? '—' },
              { key: 'source', label: 'Nguồn khách hàng', children: customerById.get(detail.customerId)?.source ?? '—' },
              { key: 'created', label: 'Tạo lead', children: shortDate(detail.createdAt) },
              { key: 'updated', label: 'Cập nhật gần nhất', children: shortDate(detail.updatedAt) },
            ]} />
          </>
        )}
      </Modal>

      <LeadFormModal
        open={formOpen}
        customers={customers}
        products={productList}
        projects={projectList}
        staff={staff}
        canAssign={canViewAll}
        submitting={create.isPending}
        onCancel={() => setFormOpen(false)}
        onSubmit={submitForm}
      />
    </>
  )
}

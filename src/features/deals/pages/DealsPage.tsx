import {
  CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, EyeOutlined,
  FilePdfOutlined, FilterOutlined, MoreOutlined, PlusOutlined, SearchOutlined, WalletOutlined,
} from '@ant-design/icons'
import {
  App, Alert, Avatar, Button, Card, Col, DatePicker, Dropdown, Input, Progress, Row, Select, Space, Table,
  Tag, Tooltip, Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState, type ReactNode } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDate, formatMoney, formatMoneyShort } from '@/lib/format'
import { useAuthStore } from '@/store/authStore'
import { tokens as t } from '@/theme/tokens'
import {
  APPROVAL_STATUS_OPTIONS, DEAL_STATUS_OPTIONS, EMPTY_FILTERS, PAYMENT_STATUS_OPTIONS, VALUE_OPTIONS,
  apiErrorMessage, approvalStatusLabel, dealStatusLabel, matchDeal, paymentStatusLabel, progressPct,
  useDealCatalog, useDealMutations, useDealPayments, useDealStaff, useDeals,
  type Deal, type DealFilters, type DealPaymentInput, type UUID,
} from '../api'
import { DealDetailDrawer } from '../components/DealDetailDrawer'
import { DealFormModal } from '../components/DealFormModal'
import { PaymentModal } from '../components/PaymentModal'

type Tone = 'green' | 'amber' | 'blue' | 'teal' | 'gray' | 'red' | 'purple'
const TONE: Record<Tone, { bg: string; fg: string; dot: string }> = {
  green: { bg: t.colorSuccessBg, fg: t.colorSuccessText, dot: t.colorSuccess },
  amber: { bg: t.colorWarningBg, fg: t.colorWarningText, dot: t.colorWarning },
  blue: { bg: t.colorInfoBg, fg: t.colorInfoText, dot: t.colorInfo },
  teal: { bg: t.colorTealBg, fg: t.colorTeal, dot: t.colorTeal },
  gray: { bg: t.colorSurfaceSunken, fg: t.colorTextMuted, dot: t.colorBorderStrong },
  red: { bg: t.colorErrorBg, fg: t.colorErrorText, dot: t.colorError },
  purple: { bg: t.colorVioletBg, fg: t.colorVioletText, dot: t.colorViolet },
}

/** Trạng thái → tông màu, theo đúng ngữ nghĩa enum của crm-service */
const DEAL_TONE: Record<string, Tone> = {
  IN_PROGRESS: 'blue', ACTIVE: 'purple', COMPLETED: 'green', CANCELLED: 'gray',
  UNPAID: 'red', PARTIAL: 'amber', PAID: 'green',
  PENDING: 'amber', APPROVED: 'green', REJECTED: 'red', NOT_REQUIRED: 'gray',
}

function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  const c = TONE[tone]
  return (
    <span className="stitch-pill" style={{ background: c.bg, color: c.fg }}>
      <span className="stitch-pill__dot" style={{ background: c.dot }} />
      {children}
    </span>
  )
}

const initials = (name: string) => {
  const w = name.trim().split(/\s+/)
  return ((w[0]?.[0] ?? '') + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase()
}

/** Thẻ KPI Stitch: nhãn hoa 11px + icon tint góc phải + số 28px + dòng phụ */
function KpiCard({ label, value, sub, icon, tone }: { label: string; value: string; sub: string; icon: ReactNode; tone: Tone }) {
  const c = TONE[tone]
  return (
    <Card className="stitch-card" variant="borderless" style={{ height: '100%' }} styles={{ body: { padding: 20 } }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <Typography.Text className="stitch-label" style={{ color: t.colorTextMuted }}>{label}</Typography.Text>
        <span style={{
          flex: '0 0 auto', width: 36, height: 36, borderRadius: t.radiusMd, display: 'grid', placeItems: 'center',
          background: c.bg, color: c.fg, fontSize: 17,
        }}>
          {icon}
        </span>
      </div>
      <div className="stitch-num" style={{ fontSize: 28, fontWeight: 700, lineHeight: '36px', marginTop: 6, color: t.colorText }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: t.colorTextMuted }}>{sub}</div>
    </Card>
  )
}


/** Danh sách hợp đồng — màn 9.20 (Khuôn A: 4 KPI → bộ lọc → bảng → tổng kết + phân trang) */
export function DealsPage() {
  const { message, modal } = App.useApp()
  const user = useAuthStore((s) => s.user)
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const [filters, setFilters] = useState<DealFilters>(EMPTY_FILTERS)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Deal | null>(null)
  const [detail, setDetail] = useState<Deal | null>(null)
  const [paying, setPaying] = useState<Deal | null>(null)
  const [selected, setSelected] = useState<string[]>([])

  // 3 bộ lọc trạng thái + phụ trách gửi thẳng lên server; chữ/ngày/giá trị lọc tại FE
  const serverFilters = useMemo(() => ({
    status: filters.status,
    paymentStatus: filters.paymentStatus,
    approvalStatus: filters.approvalStatus,
    salesId: filters.salesId,
  }), [filters.status, filters.paymentStatus, filters.approvalStatus, filters.salesId])

  const deals = useDeals(serverFilters)
  const { leads, customers, products, projects } = useDealCatalog()
  const staff = useDealStaff()
  const { create, update, remove, addPayment } = useDealMutations()

  const customerById = useMemo(() => new Map((customers.data?.content ?? []).map((c) => [c.id, c])), [customers.data])
  const leadById = useMemo(() => new Map((leads.data?.content ?? []).map((l) => [l.id, l])), [leads.data])
  const productById = useMemo(() => new Map((products.data?.content ?? []).map((p) => [p.id, p])), [products.data])
  const projectById = useMemo(() => new Map((projects.data?.content ?? []).map((p) => [p.id, p])), [projects.data])
  const staffById = useMemo(() => new Map((staff.data ?? []).map((u) => [u.id, u.fullName])), [staff.data])

  /** 1 chỗ duy nhất suy ra tên khách/căn/dự án vì GET /deals chỉ trả leadId */
  const refs = (deal: Deal) => {
    const lead = leadById.get(deal.leadId)
    const product = lead ? productById.get(lead.productId) : undefined
    const project = product ? projectById.get(product.projectId) : undefined
    const customer = lead ? customerById.get(lead.customerId) : undefined
    return {
      customerName: customer?.fullName ?? `Lead ${deal.leadId.slice(0, 8)}`,
      customerPhone: customer?.phone ?? '',
      productCode: product?.code ?? '',
      projectName: project?.name ?? '',
      unitLabel: product ? product.code : '—',
    }
  }

  const rows = useMemo(
    () => (deals.data?.content ?? []).filter((d) => matchDeal(d, filters, refs(d))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deals.data, filters, leadById, productById, projectById, customerById],
  )

  /** Tổng các đợt thanh toán của những hợp đồng đang hiển thị (API chưa có endpoint tổng hợp) */
  const dealIds = useMemo(() => rows.map((d) => d.id), [rows])
  const payments = useDealPayments(dealIds)
  const collectedOf = (id: UUID) =>
    (payments.data?.[id] ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0)

  const kpi = useMemo(() => {
    const total = rows.reduce((sum, d) => sum + (d.contractValue ?? 0), 0)
    const collected = rows.reduce((sum, d) => sum + collectedOf(d.id), 0)
    return { total, collected, debt: Math.max(0, total - collected), pending: rows.filter((d) => d.approvalStatus === 'PENDING').length }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, payments.data])

  /** Lead đủ điều kiện tạo hợp đồng: stage WON và chưa có hợp đồng (DealService.create) */
  const leadOptions = useMemo(() => {
    const used = new Set((deals.data?.content ?? []).filter((d) => d.id !== editing?.id).map((d) => d.leadId))
    return (leads.data?.content ?? [])
      .filter((l) => l.stage === 'WON' && !used.has(l.id))
      .map((l) => {
        const p = productById.get(l.productId)
        const c = customerById.get(l.customerId)
        const project = projectById.get(p?.projectId ?? '')
        return { id: l.id, label: `${c?.fullName ?? 'Khách'} · ${p?.code ?? 'căn'} · ${project?.name ?? '—'}` }
      })
  }, [leads.data, deals.data, productById, customerById, projectById, editing])

  const staffOptions = useMemo(() => (staff.data ?? []).map((u) => ({ id: u.id, label: u.fullName })), [staff.data])

  const set = <K extends keyof DealFilters>(key: K, value: DealFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }))

  /** Chip bộ lọc đang áp dụng — bỏ riêng từng cái, không phải xoá hết rồi chọn lại */
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = []
    const reset = (k: keyof DealFilters) => setFilters((f) => ({ ...f, [k]: EMPTY_FILTERS[k] }))
    if (filters.status) chips.push({ key: 'status', label: `Hợp đồng: ${dealStatusLabel(filters.status)}`, clear: () => reset('status') })
    if (filters.paymentStatus) chips.push({ key: 'pay', label: `Thanh toán: ${paymentStatusLabel(filters.paymentStatus)}`, clear: () => reset('paymentStatus') })
    if (filters.approvalStatus) chips.push({ key: 'appr', label: `Duyệt: ${approvalStatusLabel(filters.approvalStatus)}`, clear: () => reset('approvalStatus') })
    if (filters.salesId) chips.push({ key: 'sales', label: `Phụ trách: ${staffById.get(filters.salesId) ?? '—'}`, clear: () => reset('salesId') })
    if (filters.valueRange !== 'all') chips.push({ key: 'value', label: VALUE_OPTIONS.find((v) => v.value === filters.valueRange)?.label ?? '', clear: () => reset('valueRange') })
    if (filters.signedFrom || filters.signedTo) {
      chips.push({
        key: 'date',
        label: `Ngày ký: ${filters.signedFrom ?? '…'} → ${filters.signedTo ?? '…'}`,
        clear: () => setFilters((f) => ({ ...f, signedFrom: null, signedTo: null })),
      })
    }
    return chips
  }, [filters, staffById])

  const approve = (deal: Deal) => modal.confirm({
    title: `Phê duyệt hợp đồng ${deal.contractCode}?`,
    content: 'Trạng thái duyệt đổi thành "Đã duyệt"; backend ghi lại người duyệt và thời điểm duyệt.',
    okText: 'Phê duyệt', cancelText: 'Huỷ',
    onOk: () => update.mutateAsync({ id: deal.id, body: { approvalStatus: 'APPROVED' } })
      .then(() => { message.success(`Đã phê duyệt ${deal.contractCode}`) })
      .catch((e: unknown) => { message.error(`Phê duyệt thất bại: ${apiErrorMessage(e)}`); throw e }),
  })

  const reject = (deal: Deal) => {
    void update.mutateAsync({ id: deal.id, body: { approvalStatus: 'REJECTED' } })
      .then(() => { message.success(`Đã từ chối ${deal.contractCode}`) })
      .catch((e: unknown) => { message.error(`Từ chối thất bại: ${apiErrorMessage(e)}`) })
  }

  /** Xuất CSV phần đang lọc — dữ liệu đã nằm ở client nên không cần lib mới */
  const exportCsv = () => {
    const head = ['Mã hợp đồng', 'Khách hàng', 'Căn', 'Dự án', 'Giá trị', 'Đã thu', 'Còn lại', 'Thanh toán', 'Duyệt', 'Hợp đồng', 'Ngày ký']
    const body = rows.map((d) => {
      const collected = collectedOf(d.id)
      const r = refs(d)
      return [d.contractCode, r.customerName, r.unitLabel, r.projectName, d.contractValue ?? '', collected,
        Math.max(0, (d.contractValue ?? 0) - collected), paymentStatusLabel(d.paymentStatus),
        approvalStatusLabel(d.approvalStatus), dealStatusLabel(d.status), d.signedDate ?? '']
    })
    const csv = [head, ...body].map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `hop-dong-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    message.success(`Đã xuất ${rows.length} hợp đồng ra CSV`)
  }

  const loadError = [deals, leads, customers, products, projects].find((q) => q.isError)

  /** Thao tác hàng loạt trên các hợp đồng đã tick — chạy tuần tự để không dội request vào API */
  const runBulk = (mode: 'approve' | 'reject' | 'delete') => {
    const ids = selected
    if (!ids.length) return
    const verb = mode === 'approve' ? 'phê duyệt' : mode === 'reject' ? 'từ chối' : 'xoá'
    modal.confirm({
      title: `${verb.toUpperCase()} ${ids.length} hợp đồng đã chọn?`,
      content: mode === 'delete'
        ? 'Hồ sơ tài chính của các hợp đồng này sẽ bị xoá. Hành động không hoàn tác được.'
        : 'Chỉ những hợp đồng đang chờ duyệt mới đổi được trạng thái duyệt.',
      okText: mode === 'delete' ? 'Xoá' : 'Đồng ý',
      okButtonProps: { danger: mode === 'delete' || mode === 'reject' },
      cancelText: 'Huỷ',
      onOk: async () => {
        let failed = 0
        for (const id of ids) {
          try {
            if (mode === 'delete') await remove.mutateAsync(id)
            else await update.mutateAsync({ id, body: { approvalStatus: mode === 'approve' ? 'APPROVED' : 'REJECTED' } })
          } catch {
            failed += 1
          }
        }
        setSelected([])
        if (failed) message.error(`Xử lý ${ids.length - failed}/${ids.length} hợp đồng, ${failed} lỗi`)
        else message.success(`Đã ${verb} ${ids.length} hợp đồng`)
      },
    })
  }

  const columns: ColumnsType<Deal> = [
    {
      title: 'Mã hợp đồng', dataIndex: 'contractCode', width: 145, fixed: 'left',
      render: (v: string, d) => (
        <Button type="link" style={{ padding: 0, fontWeight: 700, fontFamily: 'monospace' }} onClick={() => setDetail(d)}>
          {v}
        </Button>
      ),
    },
    {
      title: 'Khách hàng', dataIndex: 'leadId', width: 195,
      render: (_: UUID, d) => {
        const r = refs(d)
        return (
          <div style={{ lineHeight: 1.35 }}>
            <div style={{ fontWeight: 600 }}>{r.customerName}</div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{r.customerPhone || '—'}</Typography.Text>
          </div>
        )
      },
    },
    {
      title: 'Dự án & sản phẩm', dataIndex: 'id', width: 200,
      render: (_: UUID, d) => {
        const r = refs(d)
        return (
          <div style={{ lineHeight: 1.35 }}>
            <div>{r.projectName || '—'}</div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>Căn {r.unitLabel}</Typography.Text>
          </div>
        )
      },
    },
    {
      title: 'Giá trị hợp đồng', dataIndex: 'contractValue', align: 'right', width: 155,
      render: (v: number | null) => <span className="stitch-num" style={{ fontWeight: 600 }}>{formatMoney(v)}</span>,
    },
    {
      title: 'Tiến độ thanh toán', dataIndex: 'id', width: 185,
      render: (_: UUID, d) => {
        const collected = collectedOf(d.id)
        const pct = progressPct(collected, d.contractValue)
        return (
          <Tooltip title={`Đã thu ${formatMoney(collected)} / ${formatMoney(d.contractValue)}`}>
            <div>
              <div style={{ fontSize: 12, color: t.colorTextMuted, marginBottom: 2 }}>
                <span className="stitch-num" style={{ fontWeight: 600, color: pct >= 100 ? t.colorSuccessText : t.colorText }}>{pct}%</span>
                {' · '}<span className="stitch-num">{formatMoneyShort(collected)}</span>
              </div>
              <Progress
                percent={pct}
                showInfo={false}
                size="small"
                strokeColor={pct >= 100 ? t.colorSuccess : t.colorWarning}
                trailColor={t.colorSurfaceSunken}
              />
            </div>
          </Tooltip>
        )
      },
    },
    {
      title: 'Thanh toán', dataIndex: 'paymentStatus', width: 165,
      render: (v: string) => <Pill tone={DEAL_TONE[v] ?? 'gray'}>{paymentStatusLabel(v)}</Pill>,
    },
    {
      title: 'Duyệt', dataIndex: 'approvalStatus', width: 150,
      render: (v: string) => <Pill tone={DEAL_TONE[v] ?? 'gray'}>{approvalStatusLabel(v)}</Pill>,
    },
    {
      title: 'Hợp đồng', dataIndex: 'status', width: 140,
      render: (v: string) => <Pill tone={DEAL_TONE[v] ?? 'gray'}>{dealStatusLabel(v)}</Pill>,
    },
    {
      title: 'Ngày ký', dataIndex: 'signedDate', width: 115,
      render: (v: string | null) => (v ? formatDate(v) : <Typography.Text type="secondary">Chưa ký</Typography.Text>),
    },
    {
      title: 'Phụ trách', dataIndex: 'salesId', width: 175,
      render: (v: UUID) => (
        <Space size={8}>
          <Avatar size={24} style={{ background: t.colorBrand, fontSize: 11 }}>{initials(staffById.get(v) ?? '?')}</Avatar>
          <span style={{ fontSize: 13 }}>{staffById.get(v) ?? '—'}</span>
        </Space>
      ),
    },
    {
      title: 'Thao tác', key: 'actions', width: 72, fixed: 'right', align: 'center',
      render: (_: unknown, d: Deal) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'detail', label: 'Xem chi tiết', icon: <EyeOutlined /> },
              { key: 'edit', label: 'Chỉnh sửa hợp đồng', icon: <EditOutlined /> },
              ...(canManage ? [{ key: 'deposit', label: 'Cập nhật tiền đặt cọc', icon: <EditOutlined /> }] : []),
              { type: 'divider' as const },
              ...(canManage ? [{ key: 'pay', label: 'Ghi nhận thanh toán', icon: <WalletOutlined /> }] : []),
              ...(canManage ? [{ key: 'approve', label: 'Phê duyệt', icon: <CheckCircleOutlined />, disabled: d.approvalStatus === 'APPROVED' }] : []),
              ...(canManage ? [{ key: 'reject', label: 'Từ chối', icon: <CloseCircleOutlined />, danger: true, disabled: d.approvalStatus !== 'PENDING' }] : []),
              ...(d.fileUrl ? [{ key: 'file', label: 'Tải file hợp đồng', icon: <FilePdfOutlined /> }] : []),
              ...(canManage
                ? [{ type: 'divider' as const }, { key: 'delete', label: 'Xoá hợp đồng', icon: <DeleteOutlined />, danger: true }]
                : []),
            ],
            onClick: ({ key }) => {
              if (key === 'detail') setDetail(d)
              else if (key === 'edit' || key === 'deposit') { setEditing(d); setFormOpen(true) }
              else if (key === 'pay') setPaying(d)
              else if (key === 'approve') approve(d)
              else if (key === 'reject') reject(d)
              else if (key === 'file' && d.fileUrl) window.open(d.fileUrl, '_blank', 'noopener')
              else if (key === 'delete') {
                modal.confirm({
                  title: `Xoá hợp đồng ${d.contractCode}?`,
                  content: 'Hồ sơ tài chính sẽ bị xoá khỏi hệ thống. Hành động không hoàn tác được.',
                  okText: 'Xoá', okButtonProps: { danger: true }, cancelText: 'Huỷ',
                  onOk: () => remove.mutateAsync(d.id)
                    .then(() => { message.success(`Đã xoá ${d.contractCode}`) })
                    .catch((e: unknown) => { message.error(`Xoá thất bại: ${apiErrorMessage(e)}`); throw e }),
                })
              }
            },
          }}
        >
          <Button type="text" aria-label="Thao tác" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        breadcrumb={[{ title: 'Hợp đồng' }]}
        title="Danh sách hợp đồng"
        meta="Quản lý hợp đồng, theo dõi thanh toán và phê duyệt trên toàn hệ thống."
        actions={(
          <>
            <Button icon={<DownloadOutlined />} onClick={exportCsv}>Xuất báo cáo</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => { setEditing(null); setFormOpen(true) }}
            >
              Thêm hợp đồng
            </Button>
          </>
        )}
      />

      {loadError && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Một số dữ liệu danh mục chưa tải được: ${apiErrorMessage(loadError.error)}`}
          description="Tên khách hàng / căn / dự án có thể hiển thị thiếu. Bảng hợp đồng vẫn dùng dữ liệu thật từ /deals."
        />
      )}

      {/* 4 thẻ KPI tài chính — số liệu tính trên TOÀN BỘ kết quả lọc, không phải riêng trang hiện tại */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard
            tone="green"
            label="Tổng giá trị hợp đồng"
            value={formatMoneyShort(kpi.total)}
            sub={`${rows.length} hợp đồng trong phạm vi lọc`}
            icon={<FilePdfOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard
            tone="teal"
            label="Đã thu thực tế"
            value={formatMoneyShort(kpi.collected)}
            sub={`Từ ${(payments.data ? Object.values(payments.data).reduce((n, list) => n + list.length, 0) : 0)} đợt thanh toán đã ghi`}
            icon={<WalletOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard
            tone={kpi.debt > 0 ? 'red' : 'green'}
            label="Công nợ còn lại"
            value={formatMoneyShort(kpi.debt)}
            sub="Giá trị hợp đồng − các đợt đã thu (không gồm tiền cọc)"
            icon={<WalletOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard
            tone="amber"
            label="Hợp đồng chờ duyệt"
            value={String(kpi.pending)}
            sub="approvalStatus = PENDING"
            icon={<CheckCircleOutlined />}
          />
        </Col>
      </Row>

      {/* FilterBar: tìm kiếm + 3 bộ lọc trạng thái tách riêng + lọc phụ (phụ trách/giá trị/ngày ký) */}
      <Card className="stitch-card" variant="borderless" style={{ marginTop: 16 }} styles={{ body: { padding: 20 } }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} lg={8} xl={7}>
            <Input
              id="dealSearch"
              allowClear
              size="large"
              prefix={<SearchOutlined style={{ color: t.colorTextMuted }} />}
              placeholder="Tìm theo mã hợp đồng, khách hàng, số điện thoại..."
              value={filters.q}
              onChange={(e) => set('q', e.target.value)}
            />
          </Col>
          <Col xs={12} sm={8} lg={4} xl={3}>
            <Select
              style={{ width: '100%' }}
              size="large"
              allowClear
              placeholder="Trạng thái HĐ"
              value={filters.status}
              onChange={(v) => set('status', v)}
              options={DEAL_STATUS_OPTIONS}
            />
          </Col>
          <Col xs={12} sm={8} lg={4} xl={3}>
            <Select
              style={{ width: '100%' }}
              size="large"
              allowClear
              placeholder="Thanh toán"
              value={filters.paymentStatus}
              onChange={(v) => set('paymentStatus', v)}
              options={PAYMENT_STATUS_OPTIONS}
            />
          </Col>
          <Col xs={12} sm={8} lg={4} xl={3}>
            <Select
              style={{ width: '100%' }}
              size="large"
              allowClear
              placeholder="Duyệt"
              value={filters.approvalStatus}
              onChange={(v) => set('approvalStatus', v)}
              options={APPROVAL_STATUS_OPTIONS}
            />
          </Col>
          <Col xs={12} sm={8} lg={4} xl={3}>
            <Select
              style={{ width: '100%' }}
              size="large"
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Phụ trách"
              value={filters.salesId}
              onChange={(v) => set('salesId', v)}
              options={staffOptions.map((u) => ({ value: u.id, label: u.label }))}
            />
          </Col>
          <Col xs={12} sm={8} lg={4} xl={3}>
            <Select
              style={{ width: '100%' }}
              size="large"
              value={filters.valueRange}
              onChange={(v) => set('valueRange', v)}
              options={VALUE_OPTIONS}
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={6}>
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              size="large"
              format="DD/MM/YYYY"
              placeholder={['Ngày ký từ', 'đến']}
              value={[
                filters.signedFrom ? dayjs(filters.signedFrom) : null,
                filters.signedTo ? dayjs(filters.signedTo) : null,
              ]}
              onChange={(range) => setFilters((f) => ({
                ...f,
                signedFrom: range?.[0] ? range[0].format('YYYY-MM-DD') : null,
                signedTo: range?.[1] ? range[1].format('YYYY-MM-DD') : null,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} lg={4} xl={3} style={{ textAlign: 'right' }}>
            <Button
              type="text"
              icon={<FilterOutlined />}
              disabled={activeChips.length === 0}
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              Xoá lọc
            </Button>
          </Col>
        </Row>

        {activeChips.length > 0 && (
          <Space size={[8, 8]} wrap style={{ marginTop: 12 }}>
            <span className="stitch-label" style={{ color: t.colorTextMuted }}>Đang lọc:</span>
            {activeChips.map((chip) => (
              <Tag key={chip.key} closable onClose={(e) => { e.preventDefault(); chip.clear() }} color="green">
                {chip.label}
              </Tag>
            ))}
          </Space>
        )}
      </Card>

      {/* Bảng hợp đồng + dòng tổng kết + phân trang (Khuôn A: bảng là 1 card trắng) */}
      <Card className="stitch-card" variant="borderless" style={{ marginTop: 16 }} styles={{ body: { padding: 20 } }}>
        {selected.length > 0 && canManage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={{ fontWeight: 600 }}>Đã chọn {selected.length} hợp đồng</span>
            <Button icon={<CheckCircleOutlined />} onClick={() => runBulk('approve')}>Phê duyệt</Button>
            <Button danger icon={<CloseCircleOutlined />} onClick={() => runBulk('reject')}>Từ chối</Button>
            <Button danger icon={<DeleteOutlined />} onClick={() => runBulk('delete')}>Xoá</Button>
            <div style={{ flex: 1 }} />
            <Button type="text" onClick={() => setSelected([])}>Bỏ chọn</Button>
          </div>
        )}

        <Table<Deal>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={deals.isLoading || payments.isFetching}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: deals.isError
              ? `Không tải được danh sách hợp đồng: ${apiErrorMessage(deals.error)}`
              : 'Không có hợp đồng phù hợp bộ lọc',
          }}
          rowSelection={{
            selectedRowKeys: selected,
            onChange: (keys) => setSelected(keys.map(String)),
            preserveSelectedRowKeys: true,
          }}
          pagination={{
            defaultPageSize: 10,
            pageSizeOptions: [10, 20, 50],
            showSizeChanger: true,
            showTotal: (total, range) => `Hiển thị ${range[0]} - ${range[1]} trong tổng số ${total} hợp đồng`,
          }}
        />

        {/* Tổng kết: ghi rõ phạm vi là TOÀN BỘ kết quả lọc, không phải chỉ trang đang xem */}
        <div
          style={{
            display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
            marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.colorBorder}`,
            fontSize: 13, color: t.colorTextSub,
          }}
        >
          <span>
            Phạm vi lọc: <b>{rows.length}</b> hợp đồng
          </span>
          <span>
            Tổng giá trị: <b className="stitch-num" style={{ color: t.colorBrand }}>{formatMoney(kpi.total)}</b>
          </span>
          <span>
            Đã thu: <b className="stitch-num" style={{ color: t.colorSuccessText }}>{formatMoney(kpi.collected)}</b>
          </span>
          <span>
            Còn phải thu: <b className="stitch-num" style={{ color: kpi.debt > 0 ? t.colorErrorText : t.colorSuccessText }}>{formatMoney(kpi.debt)}</b>
          </span>
        </div>
      </Card>

      <DealFormModal
        open={formOpen}
        editing={editing}
        leadOptions={leadOptions}
        staffOptions={staffOptions}
        canAssign={canManage}
        canApprove={canManage}
        submitting={create.isPending || update.isPending}
        onCancel={() => setFormOpen(false)}
        onSubmit={(body) => {
          const done = editing
            ? update.mutateAsync({ id: editing.id, body })
              .then(() => message.success(`Đã cập nhật ${body.contractCode ?? editing.contractCode}`))
            : create.mutateAsync(body)
              .then(() => message.success(`Đã tạo hợp đồng ${body.contractCode}`))
          void done
            .then(() => setFormOpen(false))
            .catch((e: unknown) => message.error(`${apiErrorMessage(e)}`))
        }}
      />

      <PaymentModal
        open={Boolean(paying)}
        deal={paying}
        remaining={paying ? Math.max(0, (paying.contractValue ?? 0) - collectedOf(paying.id)) : 0}
        submitting={addPayment.isPending}
        onCancel={() => setPaying(null)}
        onSubmit={(body: DealPaymentInput) => {
          if (!paying) return
          void addPayment.mutateAsync({ id: paying.id, body })
            .then(() => { message.success(`Đã ghi nhận thanh toán cho ${paying.contractCode}`); setPaying(null) })
            .catch((e: unknown) => message.error(`Ghi nhận thất bại: ${apiErrorMessage(e)}`))
        }}
      />

      <DealDetailDrawer
        open={Boolean(detail)}
        deal={detail}
        customerName={detail ? refs(detail).customerName : ''}
        unitLabel={detail ? refs(detail).unitLabel : ''}
        projectName={detail ? refs(detail).projectName : ''}
        salesName={detail ? (staffById.get(detail.salesId) ?? '—') : ''}
        payments={detail ? (payments.data?.[detail.id] ?? []) : []}
        collected={detail ? collectedOf(detail.id) : 0}
        canApprove={canManage}
        submitting={update.isPending}
        loadingPayments={payments.isFetching}
        onClose={() => setDetail(null)}
        onApprove={() => { if (detail) approve(detail) }}
        onReject={() => { if (detail) reject(detail) }}
        onRecordPayment={() => { const d = detail; setDetail(null); setPaying(d) }}
        onEdit={() => { const d = detail; setDetail(null); setEditing(d); setFormOpen(true) }}
      />
    </>
  )
}

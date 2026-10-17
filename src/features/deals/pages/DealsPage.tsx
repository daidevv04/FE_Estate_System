import {
  ApartmentOutlined, BarcodeOutlined, CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined,
  DeleteOutlined, DollarOutlined, DownloadOutlined, EditOutlined, EyeOutlined, FilePdfOutlined,
  PlusOutlined, ReloadOutlined, SafetyCertificateOutlined, SearchOutlined, TeamOutlined, UserOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import {
  App, Alert, Avatar, Button, Card, Col, DatePicker, Input, Row, Select, Space, Table,
  Tag, Tooltip, Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { SelectableTableContainer } from '@/components/common/SelectableTableContainer'
import { formatDate, formatMoney, formatMoneyShort } from '@/lib/format'
import { useAuthStore } from '@/store/authStore'
import { tokens as t } from '@/theme/tokens'
import {
  APPROVAL_STATUS_OPTIONS, DEAL_STATUS_OPTIONS, EMPTY_FILTERS, PAYMENT_STATUS_OPTIONS, VALUE_OPTIONS,
  apiErrorMessage, approvalStatusLabel, dealStatusLabel, matchDeal, paymentStatusLabel, progressPct,
  useDealCatalog, useDealMutations, useDealPayments, useDealStaff, useDeals,
  type ApprovalStatus, type Deal, type DealFilters, type DealPaymentInput, type UUID,
} from '../api'
import { DealDetailDrawer } from '../components/DealDetailDrawer'
import { DealFormModal } from '../components/DealFormModal'

import { PaymentModal } from '../components/PaymentModal'
import { StatusPill as Pill, type StatusTone as Tone } from '@/components/common/StatusPill'
import { KpiCard } from '@/components/common/KpiCard'
import { notifyDealCreated, notifyDealStatusChanged } from '@/api/notificationEventHelper'

const DEAL_TONE: Record<string, Tone> = {
  IN_PROGRESS: 'blue', ACTIVE: 'purple', COMPLETED: 'green', CANCELLED: 'gray',
  UNPAID: 'red', PARTIAL: 'amber', PAID: 'green',
  PENDING: 'amber', APPROVED: 'green', REJECTED: 'red', NOT_REQUIRED: 'gray',
}

const initials = (name: string) => {
  const w = name.trim().split(/\s+/)
  return ((w[0]?.[0] ?? '') + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase()
}

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

  const refs = (deal: Deal) => {
    const lead = leadById.get(deal.leadId)
    const product = lead?.productId ? productById.get(lead.productId) : undefined
    const project = product ? projectById.get(product.projectId) : (lead?.projectId ? projectById.get(lead.projectId) : undefined)
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
    [deals.data, filters, leadById, productById, projectById, customerById],
  )

  const dealIds = useMemo(() => rows.map((d) => d.id), [rows])
  const payments = useDealPayments(dealIds)
  const collectedOf = (id: UUID) =>
    (payments.data?.[id] ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0)

  const kpi = useMemo(() => {
    const total = rows.reduce((sum, d) => sum + (d.contractValue ?? 0), 0)
    const collected = rows.reduce((sum, d) => sum + collectedOf(d.id), 0)
    return { total, collected, debt: Math.max(0, total - collected), pending: rows.filter((d) => d.approvalStatus === 'PENDING').length }
  }, [rows, payments.data])

  const leadOptions = useMemo(() => {
    const used = new Set((deals.data?.content ?? []).filter((d) => d.id !== editing?.id).map((d) => d.leadId))
    return (leads.data?.content ?? [])
      .filter((l) => l.stage === 'WON' && !used.has(l.id))
      .map((l) => {
        const p = l.productId ? productById.get(l.productId) : null
        const c = customerById.get(l.customerId)
        const project = projectById.get(p?.projectId ?? l.projectId ?? '')
        return { id: l.id, label: `${c?.fullName ?? 'Khách'} · ${p?.code ?? 'Chưa gán căn'} · ${project?.name ?? '—'}` }
      })
  }, [leads.data, deals.data, productById, customerById, projectById, editing])

  const staffOptions = useMemo(() => (staff.data ?? []).map((u) => ({ id: u.id, label: u.fullName })), [staff.data])

  const set = <K extends keyof DealFilters>(key: K, value: DealFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }))

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
    title: `Xác nhận phê duyệt hợp đồng ${deal.contractCode}?`,
    content: 'Hợp đồng sẽ chuyển sang trạng thái "Đã duyệt" và hệ thống sẽ lưu thông tin người duyệt cùng thời điểm phê duyệt.',
    okText: 'Xác nhận phê duyệt', cancelText: 'Huỷ',
    onOk: () => update.mutateAsync({ id: deal.id, body: { approvalStatus: 'APPROVED' } })
      .then((updatedDeal) => {
        notifyDealStatusChanged({
          dealId: deal.id,
          contractCode: deal.contractCode,
          updaterName: user?.fullName,
          status: 'COMPLETED',
          salesId: updatedDeal?.salesId ?? deal.salesId,
          value: updatedDeal?.contractValue ?? deal.contractValue,
        })
        message.success(`Đã phê duyệt ${deal.contractCode}`)
      })
      .catch((e: unknown) => { message.error(`Phê duyệt thất bại: ${apiErrorMessage(e)}`); throw e }),
  })

  const reject = (deal: Deal) => modal.confirm({
    title: `Xác nhận từ chối hợp đồng ${deal.contractCode}?`,
    content: 'Hợp đồng sẽ chuyển sang trạng thái "Từ chối". Hành động này không thể hoàn tác.',
    okText: 'Từ chối', okButtonProps: { danger: true }, cancelText: 'Huỷ',
    onOk: () => update.mutateAsync({ id: deal.id, body: { approvalStatus: 'REJECTED' } })
      .then((updatedDeal) => {
        notifyDealStatusChanged({
          dealId: deal.id,
          contractCode: deal.contractCode,
          updaterName: user?.fullName,
          status: 'CANCELLED',
          salesId: updatedDeal?.salesId ?? deal.salesId,
          value: updatedDeal?.contractValue ?? deal.contractValue,
        })
        message.success(`Đã từ chối ${deal.contractCode}`)
      })
      .catch((e: unknown) => { message.error(`Từ chối thất bại: ${apiErrorMessage(e)}`); throw e }),
  })

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
      title: (
        <span>
          <BarcodeOutlined style={{ marginRight: 5, color: '#059669' }} />
          Mã HĐ
        </span>
      ),
      dataIndex: 'contractCode',
      width: 160,
      fixed: 'left',
      render: (v: string, d) => (
        <Tooltip title={v}>
          <Button
            type="link"
            style={{
              padding: 0,
              fontWeight: 700,
              fontFamily: 'SFMono-Regular, Consolas, monospace',
              fontSize: 13,
              maxWidth: 145,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'inline-block',
              textAlign: 'left',
            }}
            onClick={() => setDetail(d)}
          >
            {v}
          </Button>
        </Tooltip>
      ),
    },
    {
      title: (
        <span>
          <UserOutlined style={{ marginRight: 5, color: '#059669' }} />
          Khách hàng
        </span>
      ),
      dataIndex: 'leadId',
      width: 170,
      render: (_: UUID, d) => {
        const r = refs(d)
        return (
          <div style={{ lineHeight: 1.4 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r.customerName}
            </div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }} className="stitch-num">
              {r.customerPhone || '—'}
            </Typography.Text>
          </div>
        )
      },
    },
    {
      title: (
        <span>
          <ApartmentOutlined style={{ marginRight: 5, color: '#64748b' }} />
          Dự án & sản phẩm
        </span>
      ),
      dataIndex: 'id',
      width: 180,
      render: (_: UUID, d) => {
        const r = refs(d)
        return (
          <div style={{ lineHeight: 1.4 }}>
            <div style={{ fontWeight: 500, fontSize: 13, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r.projectName || '—'}
            </div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>Căn {r.unitLabel}</Typography.Text>
          </div>
        )
      },
    },
    {
      title: (
        <span>
          <DollarOutlined style={{ marginRight: 5, color: '#059669' }} />
          Giá trị
        </span>
      ),
      dataIndex: 'contractValue',
      align: 'right',
      width: 145,
      render: (v: number | null) => (
        <span className="stitch-num" style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', color: '#0f172a' }}>
          {formatMoney(v)}
        </span>
      ),
    },
    {
      title: (
        <span>
          <WalletOutlined style={{ marginRight: 5, color: '#64748b' }} />
          Tiến độ thanh toán
        </span>
      ),
      dataIndex: 'id', align: 'center', width: 145,
      render: (_: UUID, d) => {
        const collected = collectedOf(d.id)
        const paidAmount = collected > 0 ? collected : ((d.depositAmount ?? 0) > 0 && d.paymentStatus === 'PARTIAL' ? d.depositAmount! : collected)
        const pct = progressPct(paidAmount, d.contractValue)
        const isPaid = d.paymentStatus === 'PAID' || pct >= 100
        const isPartial = !isPaid && (d.paymentStatus === 'PARTIAL' || pct > 0)

        const barPercent = isPaid ? 100 : Math.min(100, Math.max(0, pct))
        const statusLabel = isPaid ? 'Đã thanh toán' : isPartial ? paymentStatusLabel(d.paymentStatus) : 'Chưa thanh toán'
        const displayText = paidAmount > 0 ? formatMoneyShort(paidAmount) : '0 ₫'

        const theme = isPaid
          ? { track: '#ecfdf5', fill: '#86efac', text: '#14532d', border: '#a7f3d0' }
          : isPartial
          ? { track: '#fefce8', fill: '#fde047', text: '#78350f', border: '#fef08a' }
          : { track: '#f8fafc', fill: 'transparent', text: '#94a3b8', border: '#e2e8f0' }

        return (
          <Tooltip title={`${statusLabel} (${barPercent}%) · Đã thu ${formatMoney(paidAmount)} / ${formatMoney(d.contractValue)}`}>
            <div
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 116,
                height: 24,
                borderRadius: 9999,
                backgroundColor: theme.track,
                border: `1px solid ${theme.border}`,
                overflow: 'hidden',
                verticalAlign: 'middle',
                boxSizing: 'border-box',
                cursor: 'default',
              }}
            >
              {barPercent > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${barPercent}%`,
                    backgroundColor: theme.fill,
                    transition: 'width 0.3s ease',
                  }}
                />
              )}
              <span
                className="stitch-num"
                style={{
                  position: 'relative',
                  zIndex: 1,
                  fontSize: 12,
                  fontWeight: 600,
                  color: theme.text,
                  whiteSpace: 'nowrap',
                  lineHeight: 1,
                  padding: '0 6px',
                }}
              >
                {displayText}
              </span>
            </div>
          </Tooltip>
        )
      },
    },
    {
      title: (
        <span>
          <SafetyCertificateOutlined style={{ marginRight: 5, color: '#64748b' }} />
          Phê duyệt
        </span>
      ),
      dataIndex: 'approvalStatus', width: 135,
      render: (v: ApprovalStatus) => (
        <Pill tone={DEAL_TONE[v] ?? 'gray'}>{approvalStatusLabel(v)}</Pill>
      ),
    },
    {
      title: (
        <span>
          <CalendarOutlined style={{ marginRight: 5, color: '#64748b' }} />
          Ngày ký
        </span>
      ),
      dataIndex: 'signedDate', width: 125,
      render: (v: string | null) => (
        <span className="stitch-num" style={{ whiteSpace: 'nowrap', fontSize: 13, display: 'inline-block' }}>
          {v ? formatDate(v) : <Typography.Text type="secondary">Chưa ký</Typography.Text>}
        </span>
      ),
    },
    {
      title: (
        <span>
          <TeamOutlined style={{ marginRight: 5, color: '#64748b' }} />
          Phụ trách
        </span>
      ),
      dataIndex: 'salesId', width: 140, ellipsis: true,
      render: (v: UUID) => {
        const name = staffById.get(v) ?? '—'
        return (
          <Space size={8}>
            <Avatar size={24} style={{ background: t.colorBrand, fontSize: 11, flexShrink: 0 }}>
              {initials(name)}
            </Avatar>
            <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </span>
          </Space>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader
        breadcrumb={[{ title: 'Hợp đồng' }]}
        title="Danh sách hợp đồng"
        status={
          <span className="pipe-scope">
            <span className="pipe-scope__dot" />
            Phạm vi: {canManage ? 'Toàn hệ thống' : 'Hợp đồng của tôi'}
          </span>
        }
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
      <Card className="stitch-card crm-filter-card" variant="borderless" styles={{ body: { padding: '12px 16px' } }}>
        <div className="crm-filter-bar">
          <Input
            id="dealSearch"
            allowClear
            prefix={<SearchOutlined style={{ color: t.colorTextMuted }} />}
            placeholder="Tìm theo mã HĐ, khách hàng, SĐT..."
            value={filters.q}
            onChange={(e) => set('q', e.target.value)}
            style={{ flex: '1.6 1 200px', minWidth: 170 }}
          />
          <Select
            allowClear
            placeholder="Trạng thái HĐ"
            value={filters.status}
            onChange={(v) => set('status', v)}
            options={DEAL_STATUS_OPTIONS}
            style={{ flex: '1 1 125px', minWidth: 110 }}
          />
          <Select
            allowClear
            placeholder="Thanh toán"
            value={filters.paymentStatus}
            onChange={(v) => set('paymentStatus', v)}
            options={PAYMENT_STATUS_OPTIONS}
            style={{ flex: '1 1 120px', minWidth: 110 }}
          />
          <Select
            allowClear
            placeholder="Duyệt"
            value={filters.approvalStatus}
            onChange={(v) => set('approvalStatus', v)}
            options={APPROVAL_STATUS_OPTIONS}
            style={{ flex: '1 1 115px', minWidth: 105 }}
          />
          {canManage && (
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Phụ trách"
              value={filters.salesId}
              onChange={(v) => set('salesId', v)}
              options={staffOptions.map((u) => ({ value: u.id, label: u.label }))}
              style={{ flex: '1.1 1 130px', minWidth: 120 }}
            />
          )}
          <Select
            value={filters.valueRange}
            onChange={(v) => set('valueRange', v)}
            options={VALUE_OPTIONS}
            style={{ flex: '1 1 130px', minWidth: 120 }}
          />
          <DatePicker.RangePicker
            format="DD/MM/YYYY"
            placeholder={['Ký từ', 'Đến']}
            value={[
              filters.signedFrom ? dayjs(filters.signedFrom) : null,
              filters.signedTo ? dayjs(filters.signedTo) : null,
            ]}
            onChange={(range) => setFilters((f) => ({
              ...f,
              signedFrom: range?.[0] ? range[0].format('YYYY-MM-DD') : null,
              signedTo: range?.[1] ? range[1].format('YYYY-MM-DD') : null,
            }))}
            style={{ flex: '1.3 1 200px', minWidth: 180 }}
          />
          {activeChips.length > 0 && (
            <Button
              className="crm-filter-clear-btn"
              icon={<ReloadOutlined />}
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              Xoá lọc
            </Button>
          )}
        </div>

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
        {selected.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14,
            padding: '10px 14px', borderRadius: t.radiusMd, background: t.colorSurfaceAlt,
          }}>
            <span style={{ fontWeight: 600 }}>Đã chọn {selected.length} hợp đồng</span>

            <Tooltip title={selected.length > 1 ? 'Chỉ xem chi tiết khi chọn 1 hợp đồng' : undefined}>
              <span>
                <Button
                  icon={<EyeOutlined />}
                  disabled={selected.length !== 1}
                  style={{ opacity: selected.length !== 1 ? 0.45 : 1 }}
                  onClick={() => {
                    const row = rows.find((d) => d.id === selected[0])
                    if (row) setDetail(row)
                  }}
                >
                  Xem chi tiết
                </Button>
              </span>
            </Tooltip>

            {canManage && (
              <Tooltip title={selected.length > 1 ? 'Chỉ chỉnh sửa khi chọn 1 hợp đồng' : undefined}>
                <span>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    disabled={selected.length !== 1}
                    style={{ opacity: selected.length !== 1 ? 0.45 : 1 }}
                    onClick={() => {
                      const row = rows.find((d) => d.id === selected[0])
                      if (row) { setEditing(row); setFormOpen(true) }
                    }}
                  >
                    Chỉnh sửa
                  </Button>
                </span>
              </Tooltip>
            )}

            {canManage && (
              <Tooltip title={selected.length > 1 ? 'Chỉ ghi nhận thanh toán cho 1 hợp đồng' : undefined}>
                <span>
                  <Button
                    icon={<WalletOutlined />}
                    disabled={selected.length !== 1}
                    style={{ opacity: selected.length !== 1 ? 0.45 : 1 }}
                    onClick={() => {
                      const row = rows.find((d) => d.id === selected[0])
                      if (row) setPaying(row)
                    }}
                  >
                    Thanh toán
                  </Button>
                </span>
              </Tooltip>
            )}

            {canManage && (
              <>
                <Button icon={<CheckCircleOutlined />} onClick={() => runBulk('approve')}>
                  Phê duyệt ({selected.length})
                </Button>
                <Button danger icon={<CloseCircleOutlined />} onClick={() => runBulk('reject')}>
                  Từ chối ({selected.length})
                </Button>
                {user?.role === 'ADMIN' && (
                  <Button danger icon={<DeleteOutlined />} onClick={() => runBulk('delete')}>
                    Xoá ({selected.length})
                  </Button>
                )}
              </>
            )}

            <div style={{ flex: 1 }} />
            <Button type="text" onClick={() => setSelected([])}>Bỏ chọn</Button>
          </div>
        )}

        <SelectableTableContainer
          selectedKeys={selected}
          onSelectChange={setSelected}
        >
          <Table<Deal>
            size="middle"
            rowKey="id"
            columns={columns}
            dataSource={rows}
            loading={deals.isLoading || payments.isFetching}
            scroll={{ x: 1360 }}
            onRow={(record) => ({
              onClick: (e) => {
                const target = e.target as HTMLElement
                if (target.closest('.ant-checkbox-wrapper') || target.closest('button') || target.closest('a')) return
                setDetail(record)
              },
              style: { cursor: 'pointer' },
            })}
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
        </SelectableTableContainer>

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
              .then((updatedDeal) => {
                if (body.status && body.status !== editing.status) {
                  notifyDealStatusChanged({
                    dealId: editing.id,
                    contractCode: updatedDeal.contractCode,
                    updaterName: user?.fullName,
                    status: body.status,
                    salesId: updatedDeal.salesId,
                    value: updatedDeal.contractValue,
                  })
                }
                message.success(`Đã cập nhật ${body.contractCode ?? editing.contractCode}`)
              })
            : create.mutateAsync(body)
              .then((createdDeal) => {
                notifyDealCreated({
                  dealId: createdDeal.id,
                  contractCode: createdDeal.contractCode,
                  customerName: refs(createdDeal).customerName,
                  creatorName: user?.fullName,
                  salesId: createdDeal.salesId,
                  value: createdDeal.contractValue,
                })
                message.success(`Đã tạo hợp đồng ${body.contractCode}`)
              })
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

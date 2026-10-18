import { ArrowLeftOutlined, EditOutlined, FilePdfOutlined, PlusOutlined, PrinterOutlined } from '@ant-design/icons'
import { App, Button, Card, Descriptions, Progress, Result, Skeleton, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDate, formatDateTime, formatMoney } from '@/lib/format'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'
import { tokens as t } from '@/theme/tokens'
import {
  APPROVAL_STATUS_LABEL, DEAL_STATUS_LABEL, PAYMENT_STATUS_LABEL,
  apiErrorMessage, paymentMethodLabel, progressPct,
  useDeal, useDealCatalog, useDealMutations, useDealStaff, useSingleDealPayments,
  type ApprovalStatus, type Deal, type DealPayment, type DealStatus, type PaymentStatus,
} from '../api'
import { PaymentModal } from '../components/PaymentModal'
import { DealFormModal } from '../components/DealFormModal'
import { DealPaymentScheduleSection } from '../components/DealPaymentScheduleSection'
import { DealCommissionSection } from '@/features/commissions/components/DealCommissionSection'
import { type DocumentType, PrintPreviewModal } from '@/features/documents/components/PrintPreviewModal'
import { StatusPill, type StatusTone } from '@/components/common/StatusPill'

const statusTone = (d: Deal): StatusTone => {
  const map: Record<DealStatus, StatusTone> = {
    IN_PROGRESS: 'blue', ACTIVE: 'purple', COMPLETED: 'green', CANCELLED: 'gray',
  }
  return map[d.status] ?? 'blue'
}

const payTone = (d: Deal): StatusTone => {
  const map: Record<PaymentStatus, StatusTone> = {
    PAID: 'green', PARTIAL: 'amber', UNPAID: 'red',
  }
  return map[d.paymentStatus] ?? 'red'
}

const appTone = (d: Deal): StatusTone => {
  const map: Record<ApprovalStatus, StatusTone> = {
    APPROVED: 'green', REJECTED: 'red', PENDING: 'amber', NOT_REQUIRED: 'gray',
  }
  return map[d.approvalStatus] ?? 'gray'
}

export function DealDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const user = useAuthStore((s) => s.user)
  const canApprove = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const deal = useDeal(id), payments = useSingleDealPayments(id)
  const catalog = useDealCatalog(), staffQ = useDealStaff()
  const { addPayment, update } = useDealMutations()
  const [payOpen, setPayOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [printType, setPrintType] = useState<DocumentType>('DEPOSIT')
  const [printPayId, setPrintPayId] = useState<string | null>(null)
  const d = deal.data
  const payList = payments.data ?? []
  const collected = payList.reduce((s, p) => s + p.amount, 0)
  const leadList = catalog.leads.data?.content ?? [], customerList = catalog.customers.data?.content ?? []
  const productList = catalog.products.data?.content ?? [], projectList = catalog.projects.data?.content ?? []
  const lead = leadList.find((l) => l.id === d?.leadId)
  const customer = customerList.find((c) => c.id === lead?.customerId)
  const product = productList.find((p) => p.id === lead?.productId)
  const project = product ? projectList.find((pj) => pj.id === product.projectId) : undefined
  const salesName = (staffQ.data ?? []).find((s) => s.id === d?.salesId)?.fullName ?? '—'
  const canEdit = canApprove || Boolean(user?.id && d?.salesId && user.id === d.salesId)
  const staffOptions = useMemo(() => (staffQ.data ?? []).map((s) => ({ id: s.id, label: s.fullName })), [staffQ.data])
  const leadOptions = useMemo(() => (lead ? [{ id: lead.id, label: `${customer?.fullName ?? 'Khách'} · ${product?.code ?? 'căn'} · ${project?.name ?? '—'}` }] : []), [lead, customer, product, project])

  if (deal.isLoading) return <Card className="stitch-card" variant="borderless"><Skeleton active paragraph={{ rows: 10 }} /></Card>
  if (deal.isError || !d) return <Result status="warning" title="Không tìm thấy hợp đồng" extra={<Button onClick={() => navigate(paths.deals)}>Về danh sách</Button>} />
  const pct = progressPct(collected, d.contractValue), remaining = Math.max(0, (d.contractValue ?? 0) - collected)
  const payCols: ColumnsType<DealPayment> = [
    { title: 'Ngày', dataIndex: 'paidAt', width: 140, render: (v: string) => formatDateTime(v) },
    { title: 'Số tiền', dataIndex: 'amount', align: 'right', width: 140, render: (v: number) => <span className="stitch-num" style={{ fontWeight: 600 }}>{formatMoney(v)}</span> },
    { title: 'Phương thức', dataIndex: 'method', width: 120, render: (v: string | null) => paymentMethodLabel(v) },
    { title: 'Biên lai', dataIndex: 'receiptUrl', width: 80, render: (v: string | null) => v ? <a href={v} target="_blank" rel="noreferrer">Mở</a> : '—' },
    { title: 'Ghi chú', dataIndex: 'note', render: (v: string | null) => v || '—' },
    {
      title: 'In phiếu',
      key: 'print',
      width: 80,
      align: 'center',
      render: (_, r) => (
        <Button
          size="small"
          type="text"
          icon={<PrinterOutlined style={{ color: '#059669' }} />}
          onClick={() => {
            setPrintType('RECEIPT')
            setPrintPayId(r.id)
            setPrintOpen(true)
          }}
        />
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header">
        <Space align="center" className="page-header__row" wrap>
          <Space align="center" className="page-header__title" wrap>
            <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(paths.deals)} />
            <Typography.Title level={4} style={{ margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>{d.contractCode}</Typography.Title>
            <StatusPill tone={statusTone(d)} size="sm">{DEAL_STATUS_LABEL[d.status]}</StatusPill>
            <StatusPill tone={payTone(d)} size="sm">{PAYMENT_STATUS_LABEL[d.paymentStatus]}</StatusPill>
          </Space>
          <Space wrap className="page-header__actions">
            <Button icon={<PrinterOutlined />} onClick={() => { setPrintType('DEPOSIT'); setPrintPayId(null); setPrintOpen(true) }}>In hồ sơ & Phiếu cọc</Button>
            {canEdit && <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>Chỉnh sửa</Button>}
            {canApprove && <Button icon={<PlusOutlined />} onClick={() => setPayOpen(true)}>Ghi nhận thanh toán</Button>}
          </Space>
        </Space>
        <Typography.Text type="secondary" className="page-header__meta">Ngày ký {formatDate(d.signedDate)} · Phụ trách: {salesName}</Typography.Text>
      </div>
      <Card className="stitch-card" variant="borderless" title="Thông tin hợp đồng">
        <Descriptions column={{ xs: 1, sm: 2 }} size="small" colon={false}>
          <Descriptions.Item label="Mã HĐ"><span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{d.contractCode}</span></Descriptions.Item>
          <Descriptions.Item label="Khách hàng">{customer?.fullName ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Giá trị">{formatMoney(d.contractValue)}</Descriptions.Item>
          <Descriptions.Item label="Tiền cọc">{formatMoney(d.depositAmount)}</Descriptions.Item>
          <Descriptions.Item label="Ngày cọc">{formatDate(d.depositDate)}</Descriptions.Item>
          <Descriptions.Item label="Ngày ký">{formatDate(d.signedDate)}</Descriptions.Item>
          <Descriptions.Item label="Sản phẩm">{product?.code ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Dự án">{project?.name ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="PT thanh toán">{paymentMethodLabel(d.paymentMethod)}</Descriptions.Item>
          <Descriptions.Item label="Phê duyệt"><StatusPill tone={appTone(d)} size="sm">{APPROVAL_STATUS_LABEL[d.approvalStatus]}</StatusPill></Descriptions.Item>
          <Descriptions.Item label="File">{d.fileUrl ? <Button size="small" icon={<FilePdfOutlined />} href={d.fileUrl} target="_blank">Mở file</Button> : '—'}</Descriptions.Item>
          <Descriptions.Item label="Ghi chú">{d.note || '—'}</Descriptions.Item>
        </Descriptions>
        <Progress percent={pct} strokeColor={t.colorSuccess} size="small" style={{ marginTop: 8 }} />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Đã thu {formatMoney(collected)} / {formatMoney(d.contractValue)} · Còn lại {formatMoney(remaining)}</Typography.Text>
      </Card>
      <DealPaymentScheduleSection deal={d} onRecordPayment={() => setPayOpen(true)} />
      <DealCommissionSection deal={d} />
      <Card className="stitch-card" variant="borderless" title={`Đợt thanh toán (${payList.length})`} loading={payments.isLoading} extra={canApprove && <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setPayOpen(true)}>Ghi nhận</Button>}>
        <Table<DealPayment> rowKey="id" size="small" columns={payCols} dataSource={payList} pagination={false} scroll={{ x: 'max-content' }} locale={{ emptyText: 'Chưa có đợt thanh toán' }} />
      </Card>
      {payOpen && <PaymentModal open deal={d} remaining={remaining} submitting={addPayment.isPending} onCancel={() => setPayOpen(false)} onSubmit={(body) => addPayment.mutate({ id: d.id, body }, { onSuccess: () => { message.success('Đã ghi nhận'); setPayOpen(false); void payments.refetch(); void deal.refetch() }, onError: (e) => message.error(apiErrorMessage(e)) })} />}
      {editOpen && (
        <DealFormModal
          open={editOpen}
          editing={d}
          leadOptions={leadOptions}
          staffOptions={staffOptions}
          canAssign={canApprove}
          canApprove={canApprove}
          submitting={update.isPending}
          onCancel={() => setEditOpen(false)}
          onSubmit={(body) => {
            update.mutate({ id: d.id, body }, {
              onSuccess: () => {
                message.success('Đã cập nhật hợp đồng')
                setEditOpen(false)
                void deal.refetch()
              },
              onError: (e) => message.error(apiErrorMessage(e)),
            })
          }}
        />
      )}
      {printOpen && (
        <PrintPreviewModal
          open={printOpen}
          dealId={d.id}
          defaultDocType={printType}
          selectedPaymentId={printPayId}
          customer={customer}
          salesPersonName={salesName}
          onClose={() => setPrintOpen(false)}
        />
      )}
    </div>
  )
}

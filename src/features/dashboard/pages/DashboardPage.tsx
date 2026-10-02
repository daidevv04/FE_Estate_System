import { useMemo, useState, type ReactNode } from 'react'
import dayjs from 'dayjs'
import {
  Alert, Button, Card, Col, Input, Progress, Row, Segmented, Skeleton, Space, Table, Tooltip, Typography,
} from 'antd'
import {
  ArrowDownOutlined, ArrowUpOutlined, CalendarOutlined, CheckCircleFilled, CloseCircleFilled,
  DollarOutlined, DownloadOutlined, FileTextOutlined, FilterOutlined, ReloadOutlined, SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis,
} from 'recharts'
import { formatDate, formatMoney, formatMoneyShort } from '@/lib/format'
import { tokens as t } from '@/theme/tokens'
import {
  APPROVAL_STATUS_LABEL, PAYMENT_STATUS_LABEL, RANGE_OPTIONS, contractValueIn, dealsIn, hotLeads,
  leadsCreatedIn, lostCount, openLeads, paidTotal, pipelineByStage, projectPerformance,
  revenueByMonth, useDashboardData, winRate, wonCount,
  type DealRow, type LeadStage, type ProjectStat, type RangeKey,
} from '../api'

/** Nhãn + chữ viết tắt enum đúng như màn Stitch 9.7 Enterprise */
const STAGE_DESIGN_LABEL: Record<LeadStage, string> = {
  NEW: 'Mới tiếp nhận',
  CONTACTED: 'Đã liên hệ',
  INTERESTED: 'Quan tâm thực tế',
  PROPOSAL_SENT: 'Gửi CSBH & Báo giá',
  NEGOTIATION: 'Đàm phán chuyên sâu',
  INTERNAL_REVIEW: 'Chờ duyệt cọc',
  WON: 'CHỐT THÀNH CÔNG',
  LOST: 'MẤT CƠ HỘI',
}
const STAGE_DESIGN_ENUM: Record<LeadStage, string> = {
  NEW: 'NEW', CONTACTED: 'CONTACTED', INTERESTED: 'INTERESTED', PROPOSAL_SENT: 'PROPOSAL',
  NEGOTIATION: 'NEGOTIATION', INTERNAL_REVIEW: 'REVIEW', WON: 'WON', LOST: 'LOST',
}

const pct = (v: number) => `${v.toFixed(1).replace('.', ',')}%`
const int = (v: number) => new Intl.NumberFormat('vi-VN').format(v)

/** Chênh lệch kỳ này / kỳ liền trước cùng độ dài */
const deltaOf = (cur: number, prev: number) =>
  prev === 0
    ? cur === 0 ? null : { text: 'chưa có kỳ trước để so sánh', up: true }
    : { text: `${pct(Math.abs(((cur - prev) / prev) * 100))} so với kỳ trước`, up: cur >= prev }

type Tone = 'green' | 'amber' | 'blue' | 'purple' | 'red' | 'gray'

const TONE: Record<Tone, { bg: string; fg: string; dot: string }> = {
  green: { bg: t.colorSuccessBg, fg: t.colorSuccessText, dot: t.colorSuccess },
  amber: { bg: t.colorWarningBg, fg: t.colorWarningText, dot: t.colorWarning },
  blue: { bg: t.colorInfoBg, fg: t.colorInfoText, dot: t.colorInfo },
  purple: { bg: t.colorVioletBg, fg: t.colorVioletText, dot: t.colorViolet },
  red: { bg: t.colorErrorBg, fg: t.colorErrorText, dot: t.colorError },
  gray: { bg: t.colorSurfaceSunken, fg: t.colorTextMuted, dot: t.colorBorderStrong },
}

/** Pill trạng thái Stitch: bo full, chấm 8px, tint pastel */
function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  const c = TONE[tone]
  return (
    <span className="stitch-pill" style={{ background: c.bg, color: c.fg }}>
      <span className="stitch-pill__dot" style={{ background: c.dot }} />
      {children}
    </span>
  )
}

/** Card Stitch: tiêu đề Be Vietnam Pro + dòng phụ + vùng extra bên phải */
function SectionCard({
  title, sub, extra, children,
}: {
  title: string; sub?: string; extra?: ReactNode; children: ReactNode
}) {
  return (
    <Card
      className="stitch-card"
      variant="borderless"
      style={{ height: '100%' }}
      styles={{ body: { padding: t.cardPadding } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h3 className="stitch-heading" style={{ margin: 0, fontSize: 18, fontWeight: 600, color: t.colorText }}>
            {title}
          </h3>
          {sub && <p style={{ margin: '4px 0 0', fontSize: 12.5, color: t.colorTextMuted }}>{sub}</p>}
        </div>
        {extra}
      </div>
      <div style={{ marginTop: 18 }}>{children}</div>
    </Card>
  )
}

interface KpiCardProps {
  label: string
  value: string
  unit: string
  accent: string
  icon: ReactNode
  children?: ReactNode
}

/** Thẻ KPI Stitch: nhãn hoa 11px + icon tint góc phải + số 28px/700 (tabular) */
function KpiCard({ label, value, unit, accent, icon, children }: KpiCardProps) {
  return (
    <Card
      className="stitch-card"
      variant="borderless"
      style={{ height: '100%' }}
      styles={{ body: { padding: 20, height: '100%', display: 'flex', flexDirection: 'column' } }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <Typography.Text className="stitch-label" style={{ color: t.colorTextMuted }}>
          {label}
        </Typography.Text>
        <span style={{
          flex: '0 0 auto', width: 36, height: 36, borderRadius: t.radiusMd, display: 'grid', placeItems: 'center',
          background: `${accent}1F`, color: accent, fontSize: 17,
        }}>
          {icon}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8, flexWrap: 'nowrap' }}>
        <span
          className="stitch-num"
          style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, color: t.colorText, whiteSpace: 'nowrap' }}
        >
          {value}
        </span>
        <span style={{ fontSize: 14, color: t.colorTextMuted, whiteSpace: 'nowrap' }}>{unit}</span>
      </div>
      <div style={{ marginTop: 'auto', paddingTop: 12 }}>{children}</div>
    </Card>
  )
}

/** Dòng phụ nhỏ trong thẻ KPI */
const NoteLine = ({ children, color }: { children: ReactNode; color?: string }) => (
  <div style={{ fontSize: 12.5, color: color ?? t.colorTextMuted, marginTop: 6 }}>{children}</div>
)
/**
 * 9.7 Admin Dashboard Tổng quan hệ thống (/dashboard).
 * Mọi số đều là dữ liệu THẬT tổng hợp từ GET /api/deals, /api/leads, /api/customers,
 * /api/users, /api/projects, /api/products (backend chưa có /api/dashboard/overview).
 */
export function DashboardPage() {
  const [range, setRange] = useState<RangeKey>('30d')
  const [withTarget, setWithTarget] = useState(true)
  const [dealQuery, setDealQuery] = useState('')
  const d = useDashboardData(range)

  const m = useMemo(() => {
    const deals = d.deals.data?.content ?? []
    const leads = d.leads.data?.content ?? []
    const products = d.products.data?.content ?? []
    const projects = d.projects.data?.content ?? []
    const customers = d.customers.data?.content ?? []
    const users = d.users.data ?? []
    const { from, to, prevFrom, prevTo } = d.win

    const leadById = new Map(leads.map((l) => [l.id, l]))
    const productById = new Map(products.map((p) => [p.id, p]))
    const projectName = new Map(projects.map((pj) => [pj.id, pj.name]))
    const customerName = new Map(customers.map((c) => [c.id, c.fullName]))
    const userName = new Map(users.map((u) => [u.id, u.fullName]))

    const valueNow = contractValueIn(deals, from, to)
    const valuePrev = contractValueIn(deals, prevFrom, prevTo)
    const signedNow = dealsIn(deals, from, to)
    const open = openLeads(leads)
    const stages = pipelineByStage(leads)
    const stats = projectPerformance(projects, products, leads, deals)
    const yearValue = contractValueIn(deals, dayjs().startOf('year'), dayjs().endOf('year'))
    const weekAhead = dayjs().add(7, 'day')

    // "Hợp đồng giao dịch gần nhất": deal → lead → khách hàng + căn (sản phẩm/dự án) + sales + đã thu
    const dealRows = d.latest.map((deal: DealRow) => {
      const lead = leadById.get(deal.leadId)
      const product = lead ? productById.get(lead.productId) : undefined
      return {
        id: deal.id,
        code: deal.contractCode,
        customer: (lead ? customerName.get(lead.customerId) : null) ?? '—',
        unit: `${(product ? projectName.get(product.projectId) : null) ?? '—'}${product?.code ? ` ${product.code}` : ''}`,
        sales: userName.get(deal.salesId) ?? '—',
        value: deal.contractValue ?? 0,
        paid: paidTotal(d.paymentsByDealId.get(deal.id)),
        paymentStatus: deal.paymentStatus,
        approvalStatus: deal.approvalStatus,
        signedAt: deal.signedDate ?? deal.createdAt,
      }
    })

    return {
      userName,
      dealRows,
      chart: revenueByMonth(deals, leads, 12),
      stages,
      stageMax: Math.max(1, ...stages.map((s) => s.count)),
      stats,
      // Backend chưa có bảng KPI giao khoán → lấy doanh thu bình quân mỗi đơn vị làm mốc 100%
      target: stats.length ? stats.reduce((a, s) => a + s.value, 0) / stats.length : 0,
      kpi: {
        valueNow,
        valueDelta: deltaOf(valueNow, valuePrev),
        yearValue,
        dealsNow: signedNow.length,
        dealsPrev: dealsIn(deals, prevFrom, prevTo).length,
        pendingApproval: signedNow.filter((x) => x.approvalStatus === 'PENDING').length,
        dealsValueNow: signedNow.reduce((a, x) => a + (x.contractValue ?? 0), 0),
        open: open.length,
        hot: hotLeads(leads).length,
        closingSoon: open.filter((l) => l.closeDate && dayjs(l.closeDate).isBefore(weekAhead)).length,
        leadsNew: leadsCreatedIn(leads, from, to),
        leadsAll: leads.length,
        won: wonCount(leads),
        lost: lostCount(leads),
        winRate: winRate(leads),
        pipelineValue: open.reduce((a, l) => a + (l.expectedValue ?? 0), 0),
        customersAll: customers.length,
        customersNew: customers.filter((c) => dayjs(c.createdAt).isSame(dayjs(), 'month')).length,
        customersActive: customers.filter((c) => c.status === 'CUSTOMER').length,
      },
      updatedAt: d.updatedAt ? dayjs(d.updatedAt).format('HH:mm') : dayjs().format('HH:mm'),
    }
  }, [d.deals.data, d.leads.data, d.products.data, d.projects.data, d.customers.data, d.users.data,
      d.latest, d.paymentsByDealId, d.win, d.updatedAt])

  const { kpi } = m
  const monthLabel = dayjs().format('M/YYYY')
  // Tiến độ KPI mỗi đơn vị so với mốc bình quân; xếp loại theo mốc thiết kế (>=110 xuất sắc, >=100 vượt, >=80 đạt)
  const progressOf = (s: ProjectStat) => (m.target === 0 ? 0 : (s.value / m.target) * 100)
  const ratingOf = (p: number): { text: string; tone: Tone } =>
    p >= 110 ? { text: 'Xuất sắc', tone: 'green' }
      : p >= 100 ? { text: 'Vượt kế hoạch', tone: 'amber' }
        : p >= 80 ? { text: 'Đạt chỉ tiêu', tone: 'green' }
          : { text: 'Cần cải thiện', tone: 'red' }

  const shownDeals = m.dealRows.filter((r) => {
    const q = dealQuery.trim().toLowerCase()
    return !q || r.code.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q)
  })

  /** Xuất CSV theo đúng dữ liệu đang hiển thị (Excel mở được nhờ BOM UTF-8) */
  const exportCsv = () => {
    const rows = m.stats.map((s) => [
      s.name, m.userName.get(s.managerId ?? '') ?? '—', String(s.leads), String(s.deals),
      String(s.value), pct(progressOf(s)), ratingOf(progressOf(s)).text,
    ])
    const csv = [
      ['Đơn vị', 'Trưởng phòng', 'Lead tiếp nhận', 'Hợp đồng chốt', 'Doanh thu đạt', 'Tiến độ KPI', 'Đánh giá'],
      ...rows,
    ].map((r) => r.join(';')).join('\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `hieu-suat-kinh-doanh-${dayjs().format('YYYYMMDD-HHmm')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Space align="center" size={10} wrap>
              <h2
                className="stitch-heading"
                style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.015em', color: t.colorBrandDeep }}
              >
                Tổng quan hệ thống
              </h2>
              <Pill tone="green">Dữ liệu toàn công ty</Pill>
            </Space>
          </div>
          <Space wrap size={10}>
            <Segmented options={RANGE_OPTIONS} value={range} onChange={(v) => setRange(v as RangeKey)} />
            <Tooltip title={`Kỳ dữ liệu: ${d.win.from.format('DD/MM/YYYY')} – ${d.win.to.format('DD/MM/YYYY')}`}>
              <Button icon={<CalendarOutlined />} aria-label="Xem kỳ dữ liệu" />
            </Tooltip>
            <Button type="primary" icon={<ReloadOutlined />} onClick={d.refetch}>Tải lại</Button>
            <Typography.Text style={{ fontSize: 12.5, color: t.colorTextMuted }}>
              Cập nhật lúc: {m.updatedAt} - Hôm nay
            </Typography.Text>
          </Space>
        </div>
      </div>

      {d.error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16, borderRadius: t.radiusMd }}
          message="Không tải được số liệu tổng quan"
          description="Backend chưa phản hồi. Bấm Tải lại."
        />
      )}

      {d.isLoading ? (
        <Card className="stitch-card" variant="borderless"><Skeleton active paragraph={{ rows: 10 }} /></Card>
      ) : (
        <>
          <Row gutter={[t.gutter, t.gutter]}>
            <Col xs={24} sm={12} xl={6}>
              <KpiCard
                label="Doanh thu toàn hệ thống"
                value={formatMoneyShort(kpi.valueNow).replace(/ (tỷ|triệu)$/, '')}
                unit={/triệu/.test(formatMoneyShort(kpi.valueNow)) ? 'triệu ₫' : 'tỷ ₫'}
                accent={t.colorSuccess}
                icon={<DollarOutlined />}
              >
                {kpi.valueDelta && (
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: kpi.valueDelta.up ? t.colorSuccess : t.colorError }}>
                    {kpi.valueDelta.up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {kpi.valueDelta.text}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.colorTextMuted, marginTop: 10 }}>
                  <span>Luỹ kế năm {dayjs().year()}</span>
                  <span className="stitch-num">{pct(kpi.yearValue === 0 ? 0 : (kpi.valueNow / kpi.yearValue) * 100)}</span>
                </div>
                <Progress
                  percent={kpi.yearValue === 0 ? 0 : (kpi.valueNow / kpi.yearValue) * 100}
                  showInfo={false}
                  strokeColor={t.colorSuccess}
                  trailColor={t.colorSurfaceContainer}
                  size={['100%', 6]}
                />
                <NoteLine>Tổng luỹ kế: {formatMoney(kpi.yearValue)}</NoteLine>
              </KpiCard>
            </Col>

            <Col xs={24} sm={12} xl={6}>
              <KpiCard
                label="Hợp đồng phát sinh"
                value={int(kpi.dealsNow)}
                unit="HĐ"
                accent={t.colorAccent}
                icon={<FileTextOutlined />}
              >
                {kpi.pendingApproval > 0 ? (
                  <NoteLine color={t.colorWarningText}>{int(kpi.pendingApproval)} hợp đồng chờ Admin duyệt</NoteLine>
                ) : (
                  <NoteLine color={t.colorSuccessText}>
                    <CheckCircleFilled /> Không có hợp đồng chờ duyệt
                  </NoteLine>
                )}
                <NoteLine>Tổng giá trị phát sinh: {formatMoneyShort(kpi.dealsValueNow)} ₫</NoteLine>
                <NoteLine>Kỳ trước: {int(kpi.dealsPrev)} HĐ</NoteLine>
              </KpiCard>
            </Col>

            <Col xs={24} sm={12} xl={6}>
              <KpiCard
                label="Lead đang mở (Pipeline)"
                value={int(kpi.open)}
                unit="Leads"
                accent={t.colorInfo}
                icon={<FilterOutlined />}
              >
                <Space wrap size={6}>
                  <Pill tone="red">{int(kpi.hot)} Hot Leads</Pill>
                  <Pill tone="blue">Chốt trong tuần: {int(kpi.closingSoon)}</Pill>
                </Space>
                <NoteLine>
                  Tỷ lệ chuyển đổi: <b className="stitch-num">{pct(kpi.winRate)}</b>{' '}
                  ({int(kpi.won)} thắng / {int(kpi.won + kpi.lost)} đã chốt)
                </NoteLine>
                <NoteLine>Giá trị kỳ vọng pipeline: {formatMoney(kpi.pipelineValue)}</NoteLine>
              </KpiCard>
            </Col>

            <Col xs={24} sm={12} xl={6}>
              <KpiCard
                label="Khách hàng & Đối tác"
                value={int(kpi.customersAll)}
                unit="Khách"
                accent={t.colorViolet}
                icon={<TeamOutlined />}
              >
                <NoteLine color={t.colorSuccessText}>
                  <ArrowUpOutlined /> {int(kpi.customersNew)} khách mới tháng {monthLabel}
                </NoteLine>
                <NoteLine>
                  Đang giao dịch: {int(kpi.customersActive)} khách{' '}
                  {kpi.customersAll > 0 ? `(${pct((kpi.customersActive / kpi.customersAll) * 100)})` : ''}
                </NoteLine>
                <NoteLine>Tổng lead trên hệ thống: {int(kpi.leadsAll)}</NoteLine>
              </KpiCard>
            </Col>
          </Row>

          <Row gutter={[t.gutter, t.gutter]} style={{ marginTop: t.gutter }}>
            <Col xs={24} xl={15}>
              <SectionCard
                title="Doanh thu theo thời gian"
                sub={`Tổng hợp doanh số toàn hệ thống 12 tháng gần nhất (Đơn vị: Tỷ VNĐ) — backend chưa có chỉ tiêu khoán nên cột nhạt là giá trị kỳ vọng của lead`}
                extra={
                  <Space size={8}>
                    <Button size="small" type={withTarget ? 'default' : 'primary'} onClick={() => setWithTarget(false)}>
                      Thực tế
                    </Button>
                    <Button size="small" type={withTarget ? 'primary' : 'default'} onClick={() => setWithTarget(true)}>
                      Chỉ tiêu khoán / Kỳ vọng
                    </Button>
                  </Space>
                }
              >
                <div style={{ height: 360 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={m.chart} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={t.colorBorder} />
                      <XAxis
                        dataKey="period"
                        tick={{ fontSize: 12, fill: t.colorTextMuted }}
                        tickFormatter={(v: string) => (v === m.chart[m.chart.length - 1]?.period ? `${v} (Hiện tại)` : v)}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: t.colorTextMuted }}
                        tickFormatter={(v: number) => `${Math.round(v / 1_000_000_000)} tỷ`}
                      />
                      <ChartTooltip
                        formatter={(v: number, name: string) => [
                          `${formatMoneyShort(v)} ₫`,
                          name === 'value' ? 'Thực tế' : 'Kỳ vọng (Lead)',
                        ]}
                        labelFormatter={(l: string) => `Tháng ${l.replace('T', '')}/${dayjs().year()}`}
                      />
                      {withTarget && (
                        <Bar dataKey="expected" fill={t.colorBorderStrong} radius={[6, 6, 0, 0]} barSize={26} />
                      )}
                      <Bar dataKey="value" fill={t.colorSuccess} radius={[6, 6, 0, 0]} barSize={14}>
                        {m.chart.map((row, i) => (
                          <Cell key={row.period} fill={i === m.chart.length - 1 ? t.colorBrand : t.colorSuccess} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </Col>

            <Col xs={24} xl={9}>
              <SectionCard
                title="Pipeline bán hàng"
                sub={`8 giai đoạn phễu toàn hệ thống (Tổng ${int(kpi.leadsAll)} Leads)`}
                extra={<Pill tone="gray">Thực tế</Pill>}
              >
                {m.stages.slice(0, 6).map((s, i) => (
                  <div key={s.stage} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5 }}>
                      <span style={{ color: t.colorText }}>
                        {i + 1}. {STAGE_DESIGN_LABEL[s.stage]}{' '}
                        <span style={{ color: t.colorTextMuted }}>({STAGE_DESIGN_ENUM[s.stage]})</span>
                      </span>
                      <span className="stitch-num" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {int(s.count)} leads{' '}
                        <span style={{ color: t.colorTextMuted, fontWeight: 500 }}>({pct(s.pct)})</span>
                      </span>
                    </div>
                    <Progress
                      percent={(s.count / m.stageMax) * 100}
                      showInfo={false}
                      strokeColor={t.statusColors.LeadStage[s.stage]}
                      trailColor={t.colorSurfaceContainer}
                      size={['100%', 8]}
                    />
                  </div>
                ))}

                <Row gutter={12} style={{ marginTop: 16 }}>
                  <Col span={12}>
                    <div style={{ background: t.colorSuccessBg, borderRadius: t.radiusMd, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: t.colorSuccessText }}>
                          7. {STAGE_DESIGN_LABEL.WON} ({STAGE_DESIGN_ENUM.WON})
                        </span>
                        <CheckCircleFilled style={{ color: t.colorSuccess }} />
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <span className="stitch-num" style={{ fontSize: 22, fontWeight: 700 }}>{int(kpi.won)}</span>
                        <span style={{ fontSize: 12, color: t.colorTextMuted }}> Deals</span>
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ background: t.colorErrorBg, borderRadius: t.radiusMd, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: t.colorErrorText }}>
                          8. {STAGE_DESIGN_LABEL.LOST} ({STAGE_DESIGN_ENUM.LOST})
                        </span>
                        <CloseCircleFilled style={{ color: t.colorError }} />
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <span className="stitch-num" style={{ fontSize: 22, fontWeight: 700 }}>{int(kpi.lost)}</span>
                        <span style={{ fontSize: 12, color: t.colorTextMuted }}> Leads</span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </SectionCard>
            </Col>
          </Row>

          <div style={{ marginTop: t.gutter }}>
            <SectionCard
              title="Hiệu suất kinh doanh các sàn / Phòng kinh doanh"
              sub={`Báo cáo tổng hợp doanh số thực tế theo từng dự án tháng ${monthLabel} — backend chưa có chỉ tiêu KPI giao khoán nên tiến độ tính trên doanh thu bình quân mỗi đơn vị`}
              extra={<Button icon={<DownloadOutlined />} onClick={exportCsv}>Xuất Excel</Button>}
            >
              <Table<ProjectStat>
                rowKey="projectId"
                size="middle"
                pagination={false}
                dataSource={m.stats}
                columns={[
                  {
                    title: 'Đơn vị / Phòng KD',
                    dataIndex: 'name',
                    width: 300,
                    render: (name: string, _row, i) => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: t.radiusFull, flex: '0 0 auto',
                          background: t.chartColors[i % t.chartColors.length],
                        }} />
                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {name}
                        </span>
                      </div>
                    ),
                  },
                  {
                    title: 'Trưởng phòng (TPKD)',
                    width: 190,
                    render: (_v, row) => <span>{m.userName.get(row.managerId ?? '') ?? '—'}</span>,
                  },
                  {
                    title: 'Lead tiếp nhận',
                    width: 140,
                    align: 'center' as const,
                    render: (_v, row) => <span className="stitch-num">{int(row.leads)}</span>,
                  },
                  {
                    title: 'Hợp đồng chốt',
                    width: 140,
                    align: 'center' as const,
                    render: (_v, row) => <span className="stitch-num">{int(row.deals)} HĐ</span>,
                  },
                  {
                    title: 'Doanh thu đạt',
                    width: 150,
                    align: 'right' as const,
                    render: (_v, row) => (
                      <Tooltip title={formatMoney(row.value)}>
                        <span className="stitch-num" style={{ fontWeight: 600 }}>
                          {formatMoneyShort(row.value)} ₫
                        </span>
                      </Tooltip>
                    ),
                  },
                  {
                    title: 'Tiến độ KPI',
                    width: 180,
                    render: (_v, row) => (
                      <Progress
                        percent={Math.round(progressOf(row))}
                        size="small"
                        strokeColor={t.statusColors.LeadStage.NEW}
                        trailColor={t.colorSurfaceContainer}
                        format={(p) => <span className="stitch-num">{pct(p ?? 0)}</span>}
                      />
                    ),
                  },
                  {
                    title: 'Đánh giá',
                    width: 150,
                    align: 'center' as const,
                    render: (_v, row) => {
                      const r = ratingOf(progressOf(row))
                      return <Pill tone={r.tone}>{r.text}</Pill>
                    },
                  },
                ]}
              />
            </SectionCard>
          </div>

          <div style={{ marginTop: t.gutter }}>
            <SectionCard
              title="Hợp đồng giao dịch gần nhất"
              sub="Giao dịch đã được hệ thống ghi nhận và đối soát thanh toán cọc"
              extra={
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="Tìm mã HĐ / khách hàng"
                  value={dealQuery}
                  onChange={(e) => setDealQuery(e.target.value)}
                  style={{ width: 260 }}
                />
              }
            >
              <Table<(typeof m.dealRows)[number]>
                rowKey="id"
                size="middle"
                pagination={false}
                scroll={{ x: 1078 }}
                dataSource={shownDeals}
                columns={[
                  {
                    title: 'Mã Hợp Đồng',
                    dataIndex: 'code',
                    width: 136,
                    render: (code: string) => (
                      <span className="stitch-num" style={{ fontWeight: 600, letterSpacing: 0.2, whiteSpace: 'nowrap' }}>{code}</span>
                    ),
                  },
                  { title: 'Khách Hàng', dataIndex: 'customer', width: 128, ellipsis: true },
                  { title: 'Dự Án / Căn', dataIndex: 'unit', width: 150, ellipsis: true },
                  { title: 'Chuyên Viên KD', dataIndex: 'sales', width: 112, ellipsis: true },
                  {
                    title: 'Tổng Giá Trị',
                    width: 142,
                    align: 'right' as const,
                    render: (_v, row) => (
                      <span className="stitch-num" style={{ whiteSpace: 'nowrap' }}>{formatMoney(row.value)}</span>
                    ),
                  },
                  {
                    title: 'Thanh Toán',
                    width: 178,
                    render: (_v, row) => (
                      <Space direction="vertical" size={2}>
                        <Pill
                          tone={row.paymentStatus === 'PAID' ? 'green' : row.paymentStatus === 'PARTIAL' ? 'amber' : 'red'}
                        >
                          {PAYMENT_STATUS_LABEL[row.paymentStatus] ?? row.paymentStatus}
                        </Pill>
                        <span className="stitch-num" style={{ fontSize: 12, color: t.colorTextMuted, whiteSpace: 'nowrap' }}>
                          Đã thu: {formatMoney(row.paid)}
                        </span>
                      </Space>
                    ),
                  },
                  {
                    title: 'Trạng Thái Duyệt',
                    width: 136,
                    align: 'center' as const,
                    render: (_v, row) => (
                      <Pill
                        tone={row.approvalStatus === 'APPROVED' ? 'green' : row.approvalStatus === 'REJECTED' ? 'red' : 'amber'}
                      >
                        {APPROVAL_STATUS_LABEL[row.approvalStatus] ?? row.approvalStatus}
                      </Pill>
                    ),
                  },
                  {
                    title: 'Ngày Ký',
                    width: 96,
                    align: 'center' as const,
                    render: (_v, row) => (
                      <span className="stitch-num" style={{ whiteSpace: 'nowrap' }}>{formatDate(row.signedAt)}</span>
                    ),
                  },
                ]}
              />
              <div style={{ marginTop: 12, fontSize: 12.5, color: t.colorTextMuted }}>
                Hiển thị {shownDeals.length} trên tổng số {int(d.deals.data?.totalElements ?? 0)} hợp đồng
                {' · '}doanh thu kỳ đang chọn: {formatMoney(kpi.valueNow)}
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </>
  )
}

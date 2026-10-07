import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Empty, Segmented, Skeleton, Table, Tooltip } from 'antd'
import { CalendarOutlined, CheckCircleOutlined, DollarOutlined, FileTextOutlined, ReloadOutlined, TeamOutlined, WalletOutlined } from '@ant-design/icons'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts'
import { useAppointments } from '@/features/appointments/api'
import { formatDateTime, formatMoney, formatMoneyShort } from '@/lib/format'
import { paths } from '@/routes/paths'
import { tokens as t } from '@/theme/tokens'
import { APPROVAL_STATUS_LABEL, contractValueIn, dealsIn, openLeads, paidTotal, PAYMENT_STATUS_LABEL, revenueByMonth, useDashboardData, type RangeKey } from '../api'

const rangeOptions = [
  { label: 'Hôm nay', value: 'today' }, { label: '7 ngày', value: '7d' },
  { label: '30 ngày', value: '30d' }, { label: 'Quý này', value: 'quarter' },
]

/** Tổng quan admin: doanh thu, hàng, công việc cần xử lý. Chi tiết nằm ở các màn nghiệp vụ. */
export function DashboardPage() {
  const [range, setRange] = useState<RangeKey>('30d')
  const navigate = useNavigate()
  const data = useDashboardData(range)
  const today = dayjs()
  const appointments = useAppointments({ from: today.startOf('day').format('YYYY-MM-DDTHH:mm:ss'), to: today.endOf('day').format('YYYY-MM-DDTHH:mm:ss') })
  const overview = useMemo(() => {
    const leads = data.leads.data?.content ?? []
    const deals = data.deals.data?.content ?? []
    const products = data.products.data?.content ?? []
    const recentDeals = [...deals].sort((a, b) => dayjs(b.signedDate ?? b.createdAt).valueOf() - dayjs(a.signedDate ?? a.createdAt).valueOf()).slice(0, 5)
    const signed = dealsIn(deals, data.win.from, data.win.to)
    const inventory = {
      total: products.length,
      available: products.filter((product) => product.status === 'AVAILABLE').length,
      reserved: products.filter((product) => product.status === 'RESERVED').length,
      sold: products.filter((product) => product.status === 'SOLD').length,
    }
    return {
      openLeads: openLeads(leads).length,
      signedCount: signed.length,
      signedValue: contractValueIn(deals, data.win.from, data.win.to),
      collectedFromRecent: recentDeals.reduce((total, deal) => total + paidTotal(data.paymentsByDealId.get(deal.id)), 0),
      pendingApprovals: deals.filter((deal) => deal.approvalStatus === 'PENDING'),
      unpaidDeals: deals.filter((deal) => deal.paymentStatus === 'UNPAID' || deal.paymentStatus === 'PARTIAL'),
      chart: revenueByMonth(deals, leads, 12), inventory, recentDeals,
      sellingProjects: (data.projects.data?.content ?? []).filter((project) => project.status === 'SELLING').length,
    }
  }, [data.deals.data?.content, data.leads.data?.content, data.paymentsByDealId, data.products.data?.content, data.projects.data?.content, data.win.from, data.win.to])

  const todayAppointments = (appointments.data?.content ?? []).filter((appointment) => appointment.status === 'PENDING')
  const period = `${data.win.from.format('DD/MM')} – ${data.win.to.format('DD/MM/YYYY')}`
  const kpis = [
    { label: 'Lead đang mở', value: overview.openLeads.toLocaleString('vi-VN'), note: 'Cần theo dõi', icon: <TeamOutlined />, tone: 'blue' },
    { label: 'Hợp đồng ký', value: overview.signedCount.toLocaleString('vi-VN'), note: `Trong kỳ ${period}`, icon: <FileTextOutlined />, tone: 'green' },
    { label: 'Giá trị đã ký', value: formatMoneyShort(overview.signedValue), note: 'Theo ngày ký hợp đồng', icon: <DollarOutlined />, tone: 'green' },
    { label: 'Đã thu gần đây', value: formatMoneyShort(overview.collectedFromRecent), note: '5 hợp đồng mới nhất', icon: <WalletOutlined />, tone: 'amber' },
  ]
  const attention = [
    ...todayAppointments.slice(0, 2).map((appointment) => ({ key: `appointment-${appointment.id}`, title: appointment.title, meta: formatDateTime(appointment.startTime), tone: 'blue', icon: <CalendarOutlined />, to: paths.appointments })),
    ...overview.pendingApprovals.slice(0, 2).map((deal) => ({ key: `approval-${deal.id}`, title: `${deal.contractCode} chờ duyệt`, meta: formatMoneyShort(deal.contractValue), tone: 'amber', icon: <CheckCircleOutlined />, to: paths.deals })),
    ...overview.unpaidDeals.slice(0, 2).map((deal) => ({ key: `payment-${deal.id}`, title: `${deal.contractCode} chưa thu đủ`, meta: PAYMENT_STATUS_LABEL[deal.paymentStatus] ?? deal.paymentStatus, tone: 'red', icon: <WalletOutlined />, to: paths.deals })),
  ].slice(0, 5)
  const reload = () => { data.refetch(); void appointments.refetch() }
  const isLoading = data.isLoading || appointments.isLoading

  return <div className="overview-dashboard">
    <section className="overview-dashboard__head">
      <div><div className="overview-dashboard__eyebrow">TỔNG QUAN QUẢN TRỊ</div><h1>Toàn cảnh vận hành</h1><p>Doanh thu, giỏ hàng và việc cần xử lý trong ngày.</p></div>
      <div className="overview-dashboard__actions"><Segmented value={range} options={rangeOptions} onChange={(value) => setRange(value as RangeKey)} /><Tooltip title="Tải lại số liệu"><Button aria-label="Tải lại số liệu" icon={<ReloadOutlined />} onClick={reload} /></Tooltip></div>
    </section>
    {(data.error || appointments.error) && <Alert type="error" showIcon message="Một phần dữ liệu tổng quan chưa tải được." action={<Button size="small" onClick={reload}>Thử lại</Button>} />}
    {isLoading ? <Skeleton active paragraph={{ rows: 14 }} /> : <>
      <section className="overview-dashboard__kpis" aria-label="Chỉ số bán hàng chính">{kpis.map((kpi) => <Card className={`overview-kpi overview-kpi--${kpi.tone}`} variant="borderless" key={kpi.label}><span className="overview-kpi__icon">{kpi.icon}</span><span className="overview-kpi__label">{kpi.label}</span><strong className="overview-kpi__value">{kpi.value}</strong><small>{kpi.note}</small></Card>)}</section>
      <section className="overview-dashboard__operations">
        <Card className="stitch-card overview-dashboard__attention" variant="borderless"><div className="overview-dashboard__section-head"><div><h2>Cần xử lý</h2><p>Lịch hẹn, duyệt hợp đồng, thu tiền</p></div><Button type="link" onClick={() => navigate(paths.deals)}>Mở hợp đồng</Button></div>{attention.length ? <div className="overview-attention-list">{attention.map((item) => <button className={`overview-attention overview-attention--${item.tone}`} key={item.key} onClick={() => navigate(item.to)}><span>{item.icon}</span><div><strong>{item.title}</strong><small>{item.meta}</small></div></button>)}</div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có việc tồn cần xử lý." />}</Card>
        <Card className="stitch-card overview-dashboard__inventory" variant="borderless"><div className="overview-dashboard__section-head"><div><h2>Giỏ hàng dự án</h2><p>{overview.sellingProjects} dự án đang bán · {overview.inventory.total} sản phẩm</p></div><Button type="link" onClick={() => navigate(paths.products)}>Xem sản phẩm</Button></div><div className="overview-inventory__total"><strong>{overview.inventory.available.toLocaleString('vi-VN')}</strong><span>sản phẩm còn trống</span></div><div className="overview-inventory__bar" aria-label="Phân bổ giỏ hàng"><i className="available" style={{ width: `${overview.inventory.total ? (overview.inventory.available / overview.inventory.total) * 100 : 0}%` }} /><i className="reserved" style={{ width: `${overview.inventory.total ? (overview.inventory.reserved / overview.inventory.total) * 100 : 0}%` }} /><i className="sold" style={{ width: `${overview.inventory.total ? (overview.inventory.sold / overview.inventory.total) * 100 : 0}%` }} /></div><div className="overview-inventory__legend"><span><i className="available" />Còn trống <b>{overview.inventory.available}</b></span><span><i className="reserved" />Giữ chỗ <b>{overview.inventory.reserved}</b></span><span><i className="sold" />Đã bán <b>{overview.inventory.sold}</b></span></div></Card>
      </section>
      <section className="overview-dashboard__content">
        <Card className="stitch-card overview-dashboard__chart" variant="borderless"><div className="overview-dashboard__section-head"><div><h2>Doanh thu đã ký</h2><p>12 tháng gần nhất</p></div><strong>{formatMoneyShort(overview.signedValue)}</strong></div><div className="overview-dashboard__chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={overview.chart} margin={{ top: 6, right: 0, left: -14, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e8eee9" /><XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: t.colorTextMuted }} /><YAxis axisLine={false} tickLine={false} width={62} tickFormatter={(value) => formatMoneyShort(value)} tick={{ fontSize: 11, fill: t.colorTextMuted }} /><ChartTooltip formatter={(value: number) => [formatMoney(value), 'Đã ký']} cursor={{ fill: 'rgba(0, 107, 44, .05)' }} /><Bar dataKey="value" name="Đã ký" fill={t.colorBrand} radius={[6, 6, 0, 0]} maxBarSize={36} /></BarChart></ResponsiveContainer></div></Card>
        <Card className="stitch-card overview-dashboard__deals" variant="borderless"><div className="overview-dashboard__section-head"><div><h2>Hợp đồng mới nhất</h2><p>5 hợp đồng vừa ghi nhận</p></div><Button type="link" onClick={() => navigate(paths.deals)}>Xem tất cả</Button></div><Table size="small" rowKey="id" pagination={false} dataSource={overview.recentDeals} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có hợp đồng." /> }} columns={[{ title: 'Mã hợp đồng', dataIndex: 'contractCode', ellipsis: true, render: (value: string) => <strong>{value}</strong> }, { title: 'Giá trị', dataIndex: 'contractValue', align: 'right', render: (value: number | null) => formatMoneyShort(value) }, { title: 'Duyệt', dataIndex: 'approvalStatus', align: 'right', render: (value: string) => <span className={`overview-status overview-status--${value === 'PENDING' ? 'warning' : 'ok'}`}>{APPROVAL_STATUS_LABEL[value] ?? value}</span> }]} /></Card>
      </section>
    </>}
  </div>
}
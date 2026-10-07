import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { DownloadOutlined, FundOutlined, PieChartOutlined, ReloadOutlined, WalletOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Empty, Select, Skeleton, Space, Table, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts'
import { formatMoney, formatMoneyShort, formatNumber } from '@/lib/format'
import { tokens as t } from '@/theme/tokens'
import { useDealPayments } from '@/features/deals/api'
import { signedAt, useDashboardData, type RangeKey } from '@/features/dashboard/api'
import './RevenueReportPage.css'

type MonthRow = { key: string; month: string; deals: number; signed: number; paid: number; remaining: number; rate: number | null }
type ProjectRow = { name: string; signed: number; paid: number; share: number }
const money = (value: number) => formatMoneyShort(value)
const pct = (value: number) => `${value.toFixed(1).replace('.', ',')}%`
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

function exportCsv(rows: MonthRow[]) {
  const q = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
  const head = ['Tháng', 'Deal ký', 'Tổng giá trị hợp đồng (VND)', 'Thực thu (VND)', 'Còn phải thu (VND)', 'Tỷ lệ thu']
  const lines = rows.map((row) => [row.month, row.deals, row.signed, row.paid, row.remaining, row.rate == null ? '' : pct(row.rate)].map(q).join(','))
  const href = URL.createObjectURL(new Blob(['\uFEFF' + [head.map(q).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = `doanh-thu-dong-tien-${dayjs().format('YYYYMMDD-HHmm')}.csv`
  anchor.click()
  URL.revokeObjectURL(href)
}

/** Báo cáo dòng tiền từ hợp đồng và phiếu thu append-only. Không suy diễn hạn thanh toán chưa có API. */
export function RevenueReportPage() {
  const [year, setYear] = useState(dayjs().year())
  const d = useDashboardData('30d' as RangeKey)
  const deals = d.deals.data?.content ?? []
  const payments = useDealPayments(deals.map((deal) => deal.id))
  const years = useMemo(() => [...new Set([
    ...deals.map((deal) => dayjs(signedAt(deal)).year()),
    ...Object.values(payments.data ?? {}).flat().map((payment) => dayjs(payment.paidAt).year()),
  ])].sort((a, b) => b - a), [deals, payments.data])
  useEffect(() => {
    if (years.length && !years.includes(year)) setYear(years[0])
  }, [year, years])
  const report = useMemo(() => {
    const leads = d.leads.data?.content ?? []
    const products = d.products.data?.content ?? []
    const projects = d.projects.data?.content ?? []
    const paymentsByDeal = payments.data ?? {}
    const leadById = new Map(leads.map((lead) => [lead.id, lead]))
    const projectByProduct = new Map(products.map((product) => [product.id, product.projectId]))
    const projectName = new Map(projects.map((project) => [project.id, project.name]))
    const dealsInYear = deals.filter((deal) => dayjs(signedAt(deal)).year() === year)
    const paidAllOf = (id: string) => sum((paymentsByDeal[id] ?? []).map((payment) => payment.amount))
    const paidInYearOf = (id: string, month?: number) => (paymentsByDeal[id] ?? []).filter((payment) => dayjs(payment.paidAt).year() === year && (month == null || dayjs(payment.paidAt).month() === month)).reduce((total, payment) => total + payment.amount, 0)
    const months: MonthRow[] = Array.from({ length: 12 }, (_, index) => {
      const signed = dealsInYear.filter((deal) => dayjs(signedAt(deal)).month() === index)
      const signedValue = sum(signed.map((deal) => deal.contractValue ?? 0))
      const paid = sum(deals.map((deal) => paidInYearOf(deal.id, index)))
      const remaining = sum(signed.map((deal) => Math.max(0, (deal.contractValue ?? 0) - paidAllOf(deal.id))))
      return { key: `${year}-${index}`, month: `Tháng ${index + 1}/${year}`, deals: signed.length, signed: signedValue, paid, remaining, rate: signedValue ? (paid / signedValue) * 100 : null }
    })
    const totalSigned = sum(dealsInYear.map((deal) => deal.contractValue ?? 0))
    const totalPaid = sum(deals.map((deal) => paidInYearOf(deal.id)))
    const projectMap = new Map<string, { signed: number; paid: number }>()
    dealsInYear.forEach((deal) => {
      const lead = leadById.get(deal.leadId)
      const id = lead ? projectByProduct.get(lead.productId) : undefined
      const name = (id ? projectName.get(id) : undefined) ?? 'Chưa cập nhật dự án'
      const current = projectMap.get(name) ?? { signed: 0, paid: 0 }
      current.signed += deal.contractValue ?? 0
      current.paid += paidInYearOf(deal.id)
      projectMap.set(name, current)
    })
    const projectMix: ProjectRow[] = [...projectMap.entries()].map(([name, value]) => ({ ...value, name, share: totalSigned ? (value.signed / totalSigned) * 100 : 0 })).sort((a, b) => b.signed - a.signed)
    const priorSigned = sum(deals.filter((deal) => dayjs(signedAt(deal)).year() === year - 1).map((deal) => deal.contractValue ?? 0))
    const remaining = sum(dealsInYear.map((deal) => Math.max(0, (deal.contractValue ?? 0) - paidAllOf(deal.id))))
    return { months, totalSigned, totalPaid, remaining, projectMix, dealsInYear: dealsInYear.length, paidRate: totalSigned ? (totalPaid / totalSigned) * 100 : null, growth: priorSigned ? ((totalSigned - priorSigned) / priorSigned) * 100 : null }
  }, [d.leads.data, d.products.data, d.projects.data, deals, payments.data, year])

  const columns: ColumnsType<MonthRow> = [
    { title: 'CHU KỲ', dataIndex: 'month', width: 150, render: (value: string, _row, index) => <strong className={index === dayjs().month() && year === dayjs().year() ? 'revenue-current-month' : ''}>{value}</strong> },
    { title: 'DEAL KÝ', dataIndex: 'deals', align: 'center', width: 96, render: (value: number) => formatNumber(value) },
    { title: 'DOANH THU HỢP ĐỒNG', dataIndex: 'signed', align: 'right', width: 190, render: (value: number) => <strong>{formatMoney(value)}</strong> },
    { title: 'THỰC THU', dataIndex: 'paid', align: 'right', width: 165, render: (value: number) => <strong className="revenue-paid">{formatMoney(value)}</strong> },
    { title: 'CÒN PHẢI THU', dataIndex: 'remaining', align: 'right', width: 175, render: (value: number) => formatMoney(value) },
    { title: 'TỶ LỆ THU', dataIndex: 'rate', align: 'center', width: 105, render: (value: number | null) => value == null ? '—' : <span className="revenue-rate">{pct(value)}</span> },
  ]

  if (d.isLoading) return <div className="revenue-report"><Skeleton active paragraph={{ rows: 15 }} /></div>
  if (d.error) return <Alert type="error" showIcon message="Không thể tải dữ liệu doanh thu." action={<Button size="small" onClick={() => d.refetch()}>Thử lại</Button>} />
  const cards = [
    { label: 'TỔNG DOANH THU HỢP ĐỒNG', value: money(report.totalSigned), note: `${report.dealsInYear} hợp đồng ký trong năm`, icon: <FundOutlined />, tone: 'green' },
    { label: 'DOANH THU ĐÃ THU', value: money(report.totalPaid), note: 'Tổng phiếu thu có paidAt trong năm', icon: <WalletOutlined />, tone: 'teal' },
    { label: 'CÒN PHẢI THU', value: money(report.remaining), note: 'Phần chưa thu của HĐ ký trong năm', icon: <FundOutlined />, tone: 'amber' },
    { label: 'TĂNG TRƯỞNG CÙNG KỲ', value: report.growth == null ? 'Chưa cập nhật' : `${report.growth >= 0 ? '+' : ''}${pct(report.growth)}`, note: 'So với tổng HĐ ký năm trước', icon: <PieChartOutlined />, tone: 'blue' },
  ]
  const colors = [t.colorBrand, t.colorTeal, t.colorAccent, t.colorViolet, t.colorInfo]

  return <div className="revenue-report">
    <section className="revenue-report__head"><div><div className="revenue-report__crumb">Báo cáo <span>/</span> Doanh thu & Dòng tiền</div><h1>Báo cáo Doanh thu & Dòng tiền</h1><p>Theo dõi doanh thu theo thời gian, cơ cấu thực thu và phần còn phải thu từ hợp đồng.</p></div><Space wrap className="revenue-report__actions"><Select value={year} onChange={setYear} options={years.map((value) => ({ value, label: `Năm ${value}` }))} notFoundContent="Chưa có năm dữ liệu" aria-label="Năm báo cáo" /><Tooltip title="Xuất bảng doanh thu theo tháng ra CSV"><Button type="primary" icon={<DownloadOutlined />} onClick={() => exportCsv(report.months)}>Xuất báo cáo</Button></Tooltip><Tooltip title="Tải lại hợp đồng, danh mục và phiếu thu"><Button icon={<ReloadOutlined />} onClick={() => { d.refetch(); void payments.refetch() }} /></Tooltip></Space></section>
    <section className="revenue-kpis" aria-label="Chỉ số doanh thu">{cards.map((card) => <Card key={card.label} className={`revenue-kpi revenue-kpi--${card.tone}`} variant="borderless"><div className="revenue-kpi__top"><span>{card.label}</span><i>{card.icon}</i></div><strong>{card.value}</strong><small>{card.note}</small></Card>)}</section>
    <Card className="revenue-chart stitch-card" variant="borderless"><div className="revenue-section-head"><div><h2>Xu hướng Doanh thu 12 Tháng · Năm {year}</h2><p>Cột đậm là giá trị hợp đồng ký. Cột nhạt là thực thu từ phiếu thanh toán.</p></div><div className="revenue-legend"><span><i className="is-signed" />Hợp đồng ký</span><span><i className="is-paid" />Thực thu</span></div></div><div className="revenue-chart__canvas"><ResponsiveContainer width="100%" height="100%"><BarChart data={report.months} margin={{ top: 12, right: 5, left: 0, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e8eee9" /><XAxis dataKey="month" tickFormatter={(value: string) => value.replace(`/${year}`, '').replace('Tháng ', 'T')} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: t.colorTextMuted }} /><YAxis tickFormatter={(value: number) => money(value)} tickLine={false} axisLine={false} width={70} tick={{ fontSize: 11, fill: t.colorTextMuted }} /><ChartTooltip formatter={(value: number, name: string) => [formatMoney(value), name]} labelFormatter={(value: string) => value} /><Legend wrapperStyle={{ display: 'none' }} /><Bar dataKey="signed" name="Hợp đồng ký" fill={t.colorBrand} radius={[6, 6, 0, 0]} maxBarSize={28}>{report.months.map((row, index) => <Cell key={row.key} fill={index === dayjs().month() && year === dayjs().year() ? t.colorBrandDeep : t.colorBrand} />)}</Bar><Bar dataKey="paid" name="Thực thu" fill="#84d8a6" radius={[6, 6, 0, 0]} maxBarSize={28} /></BarChart></ResponsiveContainer></div><div className="revenue-chart__foot"><span>Thực thu chỉ cộng phiếu thanh toán ghi nhận trong năm {year}.</span>{report.paidRate != null && <b>Tỷ lệ thu năm: {pct(report.paidRate)}</b>}</div></Card>
    <section className="revenue-bottom"><Card className="revenue-table stitch-card" variant="borderless"><div className="revenue-section-head"><div><h2>Bảng Dữ liệu Tổng hợp Doanh thu Năm {year}</h2><p>Không có API lịch thanh toán, nên không gán “đến hạn” hay dự báo thu.</p></div><span>12 tháng</span></div><Table<MonthRow> rowKey="key" columns={columns} dataSource={report.months} pagination={false} scroll={{ x: 880 }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có hợp đồng hoặc phiếu thu trong năm này." /> }} /></Card><aside className="revenue-side"><Card className="revenue-mix stitch-card" variant="borderless"><div className="revenue-section-head"><div><h2>Cơ cấu Doanh thu Dự án</h2><p>Theo giá trị hợp đồng ký trong năm.</p></div></div>{report.projectMix.length ? <><div className="revenue-pie"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={report.projectMix} dataKey="signed" nameKey="name" innerRadius={46} outerRadius={72} paddingAngle={3}>{report.projectMix.map((row, index) => <Cell key={row.name} fill={colors[index % colors.length]} />)}</Pie><ChartTooltip formatter={(value: number) => formatMoney(value)} /></PieChart></ResponsiveContainer><div><strong>{money(report.totalSigned)}</strong><span>Tổng ký</span></div></div><div className="revenue-mix__list">{report.projectMix.slice(0, 5).map((project, index) => <div key={project.name}><span><i style={{ background: colors[index % colors.length] }} />{project.name}</span><strong>{pct(project.share)}</strong></div>)}</div></> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa xác định được dự án từ dữ liệu lead." />}</Card><Card className="revenue-note" variant="borderless"><WalletOutlined /><div><strong>Định nghĩa dữ liệu</strong><p>“Thực thu” lấy từ phiếu thu append-only. Tiền cọc không được tự cộng nếu chưa có phiếu thu.</p></div></Card></aside></section>
  </div>
}
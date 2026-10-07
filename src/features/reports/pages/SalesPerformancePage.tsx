import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { DownloadOutlined, ReloadOutlined, RiseOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Empty, Select, Skeleton, Space, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts'
import { formatMoney, formatMoneyShort, formatNumber } from '@/lib/format'
import { tokens as t } from '@/theme/tokens'
import { contractValueIn, dealsIn, signedAt, useDashboardData, type RangeKey } from '@/features/dashboard/api'
import './SalesPerformancePage.css'

type SalesStat = {
  id: string
  name: string
  leads: number
  deals: number
  revenue: number
  winRate: number | null
}

const rangeOptions: { value: RangeKey; label: string }[] = [
  { value: 'today', label: 'Hôm nay' }, { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' }, { value: 'quarter', label: 'Quý này' },
]

const pct = (value: number) => `${value.toFixed(2).replace('.', ',')}%`
const inWindow = (value: string | null | undefined, from: dayjs.Dayjs, to: dayjs.Dayjs) => {
  if (!value) return false
  const date = dayjs(value)
  return !date.isBefore(from) && !date.isAfter(to)
}
const delta = (current: number, previous: number) => {
  if (!previous) return current ? 'Có phát sinh trong kỳ' : 'Chưa có phát sinh'
  const value = ((current - previous) / previous) * 100
  return `${value >= 0 ? '+' : ''}${value.toFixed(1).replace('.', ',')}% so với kỳ trước`
}

function exportCsv(rows: SalesStat[]) {
  const q = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
  const head = ['Hạng', 'Nhân viên sales', 'Lead tiếp nhận', 'Deal chốt', 'Doanh thu (VND)', 'Tỷ lệ chuyển đổi']
  const lines = rows.map((row, index) => [index + 1, row.name, row.leads, row.deals, row.revenue, row.winRate == null ? '' : pct(row.winRate)].map(q).join(','))
  const href = URL.createObjectURL(new Blob(['\uFEFF' + [head.map(q).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = `hieu-suat-sales-${dayjs().format('YYYYMMDD-HHmm')}.csv`
  anchor.click()
  URL.revokeObjectURL(href)
}

/** Báo cáo tổng hợp tại client từ /deals, /leads, /users; không có API analytic-service. */
export function SalesPerformancePage() {
  const [range, setRange] = useState<RangeKey>('30d')
  const [salesId, setSalesId] = useState<string>('all')
  const data = useDashboardData(range)
  const report = useMemo(() => {
    const allDeals = data.deals.data?.content ?? []
    const allLeads = data.leads.data?.content ?? []
    const users = data.users.data ?? []
    const { from, to, prevFrom, prevTo } = data.win
    const names = new Map(users.map((user) => [user.id, user.fullName]))
    const ids = new Set([...allLeads.map((lead) => lead.assignedTo), ...allDeals.map((deal) => deal.salesId)])
    const people = [...ids].map((id) => ({ id, name: names.get(id) ?? 'Chưa cập nhật' })).sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    const scope = <T extends { assignedTo?: string; salesId?: string }>(row: T) => salesId === 'all' || row.assignedTo === salesId || row.salesId === salesId
    const leads = allLeads.filter(scope)
    const deals = allDeals.filter(scope)
    const currentLeads = leads.filter((lead) => inWindow(lead.createdAt, from, to))
    const currentDeals = dealsIn(deals, from, to)
    const previousDeals = dealsIn(deals, prevFrom, prevTo)
    const revenue = currentDeals.reduce((sum, deal) => sum + (deal.contractValue ?? 0), 0)
    const priorRevenue = contractValueIn(deals, prevFrom, prevTo)
    const closed = currentLeads.filter((lead) => lead.stage === 'WON' || lead.stage === 'LOST')
    const won = currentLeads.filter((lead) => lead.stage === 'WON').length
    const chart = Array.from({ length: Math.max(1, Math.ceil(to.diff(from, 'day') / 7) + 1) }, (_, index) => {
      const start = from.add(index * 7, 'day')
      const end = start.add(6, 'day').endOf('day').isAfter(to) ? to : start.add(6, 'day').endOf('day')
      const weeklyDeals = currentDeals.filter((deal) => inWindow(signedAt(deal), start, end))
      return {
        week: `Tuần ${index + 1}`,
        revenue: weeklyDeals.reduce((sum, deal) => sum + (deal.contractValue ?? 0), 0),
        deals: weeklyDeals.length,
      }
    })
    const ranking = people.map((person) => {
      const personLeads = currentLeads.filter((lead) => lead.assignedTo === person.id)
      const personDeals = currentDeals.filter((deal) => deal.salesId === person.id)
      const personClosed = personLeads.filter((lead) => lead.stage === 'WON' || lead.stage === 'LOST')
      return {
        ...person,
        leads: personLeads.length,
        deals: personDeals.length,
        revenue: personDeals.reduce((sum, deal) => sum + (deal.contractValue ?? 0), 0),
        winRate: personClosed.length ? (personLeads.filter((lead) => lead.stage === 'WON').length / personClosed.length) * 100 : null,
      }
    }).filter((row) => row.leads || row.deals).sort((a, b) => b.revenue - a.revenue || b.deals - a.deals || b.leads - a.leads)
    return {
      people, chart, ranking, from, to,
      kpis: {
        leads: currentLeads.length, deals: currentDeals.length, revenue,
        conversion: currentLeads.length ? (currentDeals.length / currentLeads.length) * 100 : 0,
        winRate: closed.length ? (won / closed.length) * 100 : 0,
        leadDelta: delta(currentLeads.length, leads.filter((lead) => inWindow(lead.createdAt, prevFrom, prevTo)).length),
        dealDelta: delta(currentDeals.length, previousDeals.length),
        revenueDelta: delta(revenue, priorRevenue),
      },
    }
  }, [data.deals.data, data.leads.data, data.users.data, data.win, salesId])

  const columns: ColumnsType<SalesStat> = [
    { title: 'HẠNG', width: 72, render: (_value, _row, index) => <span className={`sales-rank sales-rank--${index + 1}`}>{index + 1}</span> },
    { title: 'NHÂN VIÊN SALES', dataIndex: 'name', width: 250, render: (name: string) => <strong>{name}</strong> },
    { title: 'LEAD TIẾP NHẬN', dataIndex: 'leads', align: 'center', width: 130, render: (value: number) => <b>{formatNumber(value)}</b> },
    { title: 'DEAL CHỐT', dataIndex: 'deals', align: 'center', width: 105, render: (value: number) => <Tag color="green">{value} deal</Tag> },
    { title: 'DOANH THU (VND)', dataIndex: 'revenue', align: 'right', width: 210, render: (value: number) => <strong className="sales-revenue">{formatMoney(value)}</strong> },
    { title: 'TỶ LỆ CHUYỂN ĐỔI', dataIndex: 'winRate', align: 'center', width: 160, render: (value: number | null) => value == null ? 'Chưa cập nhật' : pct(value) },
  ]

  if (data.isLoading) return <div className="sales-performance"><Skeleton active paragraph={{ rows: 14 }} /></div>
  if (data.error) return <Alert type="error" showIcon message="Không thể tải dữ liệu hiệu suất Sales." action={<Button size="small" onClick={() => data.refetch()}>Thử lại</Button>} />

  const period = `${report.from.format('DD/MM/YYYY')} – ${report.to.format('DD/MM/YYYY')}`
  const statCards = [
    { label: 'SALES HOẠT ĐỘNG', value: report.ranking.length, suffix: 'nhân sự', note: 'Có lead hoặc deal trong kỳ', icon: <TeamOutlined />, tone: 'blue' },
    { label: 'LEAD TIẾP NHẬN', value: report.kpis.leads, suffix: 'leads', note: report.kpis.leadDelta, icon: <RiseOutlined />, tone: 'amber' },
    { label: 'DEAL THÀNH CÔNG', value: report.kpis.deals, suffix: 'hợp đồng', note: report.kpis.dealDelta, icon: <TrophyOutlined />, tone: 'green' },
    { label: 'TỔNG DOANH THU', value: formatMoneyShort(report.kpis.revenue), suffix: '', note: report.kpis.revenueDelta, icon: <RiseOutlined />, tone: 'green' },
    { label: 'TỶ LỆ CHUYỂN ĐỔI', value: pct(report.kpis.conversion), suffix: '', note: `${report.kpis.winRate.toFixed(1).replace('.', ',')}% lead đã đóng là thắng`, icon: <TrophyOutlined />, tone: 'purple' },
  ]

  return <div className="sales-performance">
    <section className="sales-performance__head">
      <div>
        <div className="sales-performance__crumb">Báo cáo <span>/</span> Hiệu suất Sales</div>
        <div className="sales-performance__title-row"><h1>Hiệu suất Sales</h1><span className="sales-live"><i /> Dữ liệu thật đang tải</span></div>
        <p>Đánh giá hoạt động và kết quả kinh doanh của đội ngũ Sales theo thời gian thực.</p>
      </div>
      <Space wrap className="sales-performance__actions">
        <Select value={range} onChange={setRange} options={rangeOptions} aria-label="Kỳ báo cáo" />
        <Select value={salesId} onChange={setSalesId} options={[{ value: 'all', label: 'Sales: Tất cả' }, ...report.people.map((person) => ({ value: person.id, label: `Sales: ${person.name}` }))]} aria-label="Nhân viên sales" />
        <Tooltip title="Xuất bảng xếp hạng đang lọc ra CSV, mở được bằng Excel"><Button type="primary" icon={<DownloadOutlined />} onClick={() => exportCsv(report.ranking)}>Xuất báo cáo</Button></Tooltip>
        <Tooltip title="Tải lại dữ liệu"><Button icon={<ReloadOutlined />} onClick={() => data.refetch()} /></Tooltip>
      </Space>
    </section>

    <section className="sales-kpis" aria-label="Chỉ số hiệu suất sales">
      {statCards.map((stat) => <Card className={`sales-kpi sales-kpi--${stat.tone}`} variant="borderless" key={stat.label}>
        <div className="sales-kpi__top"><span>{stat.label}</span><i>{stat.icon}</i></div>
        <div className="sales-kpi__value">{stat.value} {stat.suffix && <small>{stat.suffix}</small>}</div>
        <div className="sales-kpi__note">{stat.note}</div>
      </Card>)}
    </section>

    <Card className="sales-chart stitch-card" variant="borderless">
      <div className="sales-section-head"><div><h2>Hiệu suất Doanh thu & Deal theo tuần</h2><p>{period}. Doanh thu là tổng giá trị hợp đồng đã ký.</p></div><div className="sales-legend"><span><i className="is-bar" />Doanh thu (VND)</span><span><i className="is-line" />Số deal chốt</span></div></div>
      <div className="sales-chart__canvas">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={report.chart} margin={{ top: 18, right: 8, left: 2, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e8eee9" />
            <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: t.colorTextMuted }} />
            <YAxis yAxisId="money" tickFormatter={(value) => formatMoneyShort(value)} tickLine={false} axisLine={false} width={70} tick={{ fontSize: 11, fill: t.colorTextMuted }} />
            <YAxis yAxisId="deals" orientation="right" allowDecimals={false} tickLine={false} axisLine={false} width={34} tick={{ fontSize: 11, fill: t.colorTextMuted }} />
            <ChartTooltip formatter={(value: number, name: string) => name === 'Doanh thu' ? formatMoney(value) : `${value} deal`} />
            <Legend wrapperStyle={{ display: 'none' }} />
            <Bar yAxisId="money" dataKey="revenue" name="Doanh thu" fill={t.colorBrand} radius={[7, 7, 0, 0]} maxBarSize={50} />
            <Line yAxisId="deals" dataKey="deals" name="Deal chốt" stroke={t.colorTeal} strokeWidth={2} dot={{ r: 3, fill: t.colorTeal }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>

    <Card className="sales-table stitch-card" variant="borderless">
      <div className="sales-section-head"><div><h2>Bảng xếp hạng hiệu suất Chuyên viên Kinh doanh</h2><p>Thứ hạng ưu tiên doanh thu hợp đồng ký trong kỳ đang xem.</p></div><span className="sales-count">Hiển thị: {report.ranking.length} Sales</span></div>
      <Table<SalesStat> rowKey="id" columns={columns} dataSource={report.ranking} pagination={false} scroll={{ x: 860 }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lead hoặc hợp đồng trong kỳ này." /> }} />
    </Card>
  </div>
}
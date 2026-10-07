import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { DownloadOutlined, FilterOutlined, ReloadOutlined, RiseOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Empty, Select, Skeleton, Space, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatMoney, formatMoneyShort, formatNumber } from '@/lib/format'
import { tokens as t } from '@/theme/tokens'
import { api } from '@/api/client'
import { LEAD_STAGES, STAGE_LABEL, dealsIn, useDashboardData, type LeadStage, type RangeKey } from '@/features/dashboard/api'
import './PipelineSummaryPage.css'

type StageRow = {
  stage: LeadStage
  leads: number
  expected: number
  deals: number
  revenue: number
  share: number
  entered: number | null
  transitioned: number | null
  comparedToPrevious: number | null
}

type PipelineSummaryApi = { stages: Array<{ stage: LeadStage; currentLeadCount: number; expectedValue: number; enteredCount: number; transitionFromPreviousCount: number; transitionRate: number | null }> }

const rangeOptions: { value: RangeKey; label: string }[] = [
  { value: 'today', label: 'Hôm nay' }, { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' }, { value: 'quarter', label: 'Quý này' },
]
const pct = (value: number) => `${value.toFixed(1).replace('.', ',')}%`
const inWindow = (value: string, from: dayjs.Dayjs, to: dayjs.Dayjs) => {
  const date = dayjs(value)
  return !date.isBefore(from) && !date.isAfter(to)
}

function exportCsv(rows: StageRow[]) {
  const q = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
  const head = ['Giai đoạn', 'Lead hiện tại', 'Giá trị kỳ vọng (VND)', 'Lead vào stage trong kỳ', 'Chuyển từ bước trước', 'Deal ký trong kỳ', 'Doanh thu ký trong kỳ (VND)', 'Tỷ trọng pipeline', 'Tỷ lệ chuyển tiếp']
  const lines = rows.map((row) => [STAGE_LABEL[row.stage], row.leads, row.expected, row.entered ?? '', row.transitioned ?? '', row.deals, row.revenue, pct(row.share), row.comparedToPrevious == null ? '' : pct(row.comparedToPrevious)].map(q).join(','))
  const href = URL.createObjectURL(new Blob(['\uFEFF' + [head.map(q).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = `tong-quan-pipeline-${dayjs().format('YYYYMMDD-HHmm')}.csv`
  anchor.click()
  URL.revokeObjectURL(href)
}

/** Snapshot + transition event thật từ GET /leads/pipeline-summary. */
export function PipelineSummaryPage() {
  const [range, setRange] = useState<RangeKey>('30d')
  const [salesId, setSalesId] = useState('all')
  const data = useDashboardData(range)
  const summary = useQuery({
    queryKey: ['pipeline-summary', data.win.from.format('YYYY-MM-DD'), data.win.to.format('YYYY-MM-DD'), salesId],
    queryFn: () => api.get<PipelineSummaryApi>('/leads/pipeline-summary', { params: { from: data.win.from.format('YYYY-MM-DD'), to: data.win.to.format('YYYY-MM-DD'), assignedTo: salesId === 'all' ? undefined : salesId } }).then((response) => response.data),
  })
  const report = useMemo(() => {
    const leadsAll = data.leads.data?.content ?? []
    const dealsAll = data.deals.data?.content ?? []
    const users = data.users.data ?? []
    const names = new Map(users.map((user) => [user.id, user.fullName]))
    const personIds = new Set([...leadsAll.map((lead) => lead.assignedTo), ...dealsAll.map((deal) => deal.salesId)])
    const people = [...personIds].map((id) => ({ value: id, label: names.get(id) ?? 'Chưa cập nhật' })).sort((a, b) => a.label.localeCompare(b.label, 'vi'))
    const leads = leadsAll.filter((lead) => salesId === 'all' || lead.assignedTo === salesId)
    const dealScope = dealsAll.filter((deal) => salesId === 'all' || deal.salesId === salesId)
    const currentDeals = dealsIn(dealScope, data.win.from, data.win.to)
    const dealsByLead = new Map<string, typeof currentDeals>()
    currentDeals.forEach((deal) => dealsByLead.set(deal.leadId, [...(dealsByLead.get(deal.leadId) ?? []), deal]))
    const total = leads.length
    const historyByStage = new Map(summary.data?.stages.map((row) => [row.stage, row]) ?? [])
    const stages: StageRow[] = LEAD_STAGES.map((stage) => {
      const stageLeads = leads.filter((lead) => lead.stage === stage)
      const stageDeals = stageLeads.flatMap((lead) => dealsByLead.get(lead.id) ?? [])
      const history = historyByStage.get(stage)
      return {
        stage,
        leads: history?.currentLeadCount ?? stageLeads.length,
        expected: history?.expectedValue ?? stageLeads.reduce((sum, lead) => sum + (lead.expectedValue ?? 0), 0),
        deals: stageDeals.length,
        revenue: stageDeals.reduce((sum, deal) => sum + (deal.contractValue ?? 0), 0),
        share: total ? (stageLeads.length / total) * 100 : 0,
        entered: history?.enteredCount ?? null,
        transitioned: history?.transitionFromPreviousCount ?? null,
        comparedToPrevious: history?.transitionRate ?? null,
      }
    })
    const open = stages.slice(0, 6).reduce((sum, stage) => sum + stage.leads, 0)
    const won = stages.find((stage) => stage.stage === 'WON')?.leads ?? 0
    const lost = stages.find((stage) => stage.stage === 'LOST')?.leads ?? 0
    const closed = won + lost
    return {
      people, stages, total, open, won, lost, closed,
      expected: stages.reduce((sum, stage) => sum + stage.expected, 0),
      deals: currentDeals.length,
      revenue: currentDeals.reduce((sum, deal) => sum + (deal.contractValue ?? 0), 0),
      newLeads: leads.filter((lead) => inWindow(lead.createdAt, data.win.from, data.win.to)).length,
    }
  }, [data.deals.data, data.leads.data, data.users.data, data.win, salesId, summary.data])

  const columns: ColumnsType<StageRow> = [
    { title: 'GIAI ĐOẠN BÁN HÀNG', dataIndex: 'stage', width: 245, render: (stage: LeadStage) => <span className="pipeline-stage-name"><i style={{ background: t.statusColors.LeadStage[stage] }} />{STAGE_LABEL[stage]}</span> },
    { title: 'LEAD HIỆN TẠI', dataIndex: 'leads', align: 'center', width: 120, render: (value: number) => <strong>{formatNumber(value)}</strong> },
    { title: 'GIÁ TRỊ KỲ VỌNG', dataIndex: 'expected', align: 'right', width: 185, render: (value: number) => <Tooltip title={formatMoney(value)}><strong className="pipeline-money">{formatMoneyShort(value)}</strong></Tooltip> },
    { title: 'VÀO STAGE TRONG KỲ', dataIndex: 'entered', align: 'center', width: 150, render: (value: number | null) => value == null ? 'Chưa tải' : formatNumber(value) },
    { title: 'TỪ BƯỚC TRƯỚC', dataIndex: 'transitioned', align: 'center', width: 135, render: (value: number | null) => value == null ? '—' : formatNumber(value) },
    { title: 'DEAL KÝ TRONG KỲ', dataIndex: 'deals', align: 'center', width: 145, render: (value: number) => <Tag color="green">{value} deal</Tag> },
    { title: 'DOANH THU KÝ TRONG KỲ', dataIndex: 'revenue', align: 'right', width: 205, render: (value: number) => <strong className="pipeline-money">{formatMoney(value)}</strong> },
    { title: 'TỶ TRỌNG PIPELINE', dataIndex: 'share', align: 'center', width: 145, render: (value: number) => pct(value) },
    { title: 'TỶ LỆ CHUYỂN TIẾP', dataIndex: 'comparedToPrevious', align: 'center', width: 165, render: (value: number | null) => value == null ? 'Chưa có event' : pct(value) },
  ]

  if (data.isLoading) return <div className="pipeline-summary"><Skeleton active paragraph={{ rows: 15 }} /></div>
  if (data.error) return <Alert type="error" showIcon message="Không thể tải dữ liệu tổng quan pipeline." action={<Button size="small" onClick={() => data.refetch()}>Thử lại</Button>} />

  const maxLeads = Math.max(1, ...report.stages.map((stage) => stage.leads))
  const period = `${data.win.from.format('DD/MM/YYYY')} – ${data.win.to.format('DD/MM/YYYY')}`
  const kpis = [
    { label: 'TỔNG LEAD TRONG PIPELINE', value: report.total, suffix: 'lead', note: `${report.open} lead đang mở`, icon: <TeamOutlined />, tone: 'blue' },
    { label: 'LEAD MỚI TRONG KỲ', value: report.newLeads, suffix: 'lead', note: `Kỳ ${period}`, icon: <FilterOutlined />, tone: 'amber' },
    { label: 'TỔNG GIÁ TRỊ KỲ VỌNG', value: formatMoneyShort(report.expected), suffix: '', note: 'Theo expectedValue của lead hiện tại', icon: <RiseOutlined />, tone: 'green' },
    { label: 'HỢP ĐỒNG KÝ TRONG KỲ', value: report.deals, suffix: 'deal', note: formatMoneyShort(report.revenue), icon: <TrophyOutlined />, tone: 'green' },
    { label: 'TỶ LỆ CHỐT THẮNG', value: report.closed ? pct((report.won / report.closed) * 100) : 'Chưa cập nhật', suffix: '', note: `${report.won} thắng · ${report.lost} mất`, icon: <TrophyOutlined />, tone: 'purple' },
  ]

  return <div className="pipeline-summary">
    <section className="pipeline-summary__head">
      <div><div className="pipeline-summary__crumb">Báo cáo <span>/</span> Tổng quan Pipeline</div><div className="pipeline-summary__title"><h1>Tổng quan Pipeline Bán hàng</h1><span><i /> Dữ liệu lịch sử thật</span></div><p>Phân tích trạng thái lead đang có, event chuyển stage và hợp đồng đã ký trong kỳ đã chọn.</p></div>
      <Space wrap className="pipeline-summary__actions"><Select value={range} onChange={setRange} options={rangeOptions} aria-label="Kỳ báo cáo" /><Select value={salesId} onChange={setSalesId} options={[{ value: 'all', label: 'Sales: Tất cả' }, ...report.people]} aria-label="Nhân viên sales" /><Tooltip title="Xuất số liệu pipeline đang lọc ra CSV"><Button type="primary" icon={<DownloadOutlined />} onClick={() => exportCsv(report.stages)}>Xuất báo cáo</Button></Tooltip><Tooltip title="Tải lại dữ liệu"><Button icon={<ReloadOutlined />} onClick={() => { data.refetch(); void summary.refetch() }} /></Tooltip></Space>
    </section>

    {summary.isError && <Alert type="warning" showIcon message="Không tải được lịch sử chuyển stage. Cột tỷ lệ chuyển tiếp hiển thị Chưa có event." action={<Button size="small" onClick={() => void summary.refetch()}>Thử lại</Button>} />}
    <section className="pipeline-hero"><div><span>HIỆU SUẤT PIPELINE</span><h2>Lead hiện tại · Chuyển stage thật · Deal ký trong kỳ</h2><p>Chỉ số chuyển tiếp lấy từ event append-only của lead trong kỳ báo cáo.</p></div><div className="pipeline-hero__facts"><div><small>Lead đang mở</small><strong>{formatNumber(report.open)}</strong></div><div><small>Tỷ lệ chốt thắng</small><strong>{report.closed ? pct((report.won / report.closed) * 100) : '—'}</strong></div></div></section>

    <section className="pipeline-kpis" aria-label="Chỉ số pipeline">{kpis.map((item) => <Card className={`pipeline-kpi pipeline-kpi--${item.tone}`} variant="borderless" key={item.label}><div className="pipeline-kpi__top"><span>{item.label}</span><i>{item.icon}</i></div><div className="pipeline-kpi__value">{item.value} {item.suffix && <small>{item.suffix}</small>}</div><div className="pipeline-kpi__note">{item.note}</div></Card>)}</section>

    <Card className="pipeline-funnel stitch-card" variant="borderless"><div className="pipeline-section-head"><div><h2>Phễu Chuyển đổi & Giá trị Deal BĐS</h2><p>Độ rộng thanh theo số lead ở từng trạng thái hiện tại.</p></div><span>Ảnh chụp: {period}</span></div><div className="pipeline-funnel__list">{report.stages.slice(0, 6).map((stage, index) => <div className="pipeline-step" key={stage.stage}><div className="pipeline-step__head"><span><b>{index + 1}</b>{STAGE_LABEL[stage.stage]}</span><strong>{formatNumber(stage.leads)} lead <em>{formatMoneyShort(stage.expected)}</em></strong></div><div className="pipeline-step__track"><div style={{ width: `${Math.max(stage.leads ? 7 : 0, (stage.leads / maxLeads) * 100)}%`, background: t.statusColors.LeadStage[stage.stage] }} /></div></div>)}</div><div className="pipeline-results"><div className="pipeline-result pipeline-result--won"><span><i /> Chốt thành công (WON)</span><strong>{report.won}<small> lead</small></strong></div><div className="pipeline-result pipeline-result--lost"><span><i /> Mất cơ hội (LOST)</span><strong>{report.lost}<small> lead</small></strong></div></div></Card>

    <Card className="pipeline-table stitch-card" variant="borderless"><div className="pipeline-section-head"><div><h2>Bảng Chi tiết Chỉ số Chuyển tiếp Từng Giai đoạn</h2><p>Tỷ lệ chuyển tiếp = event từ bước liền trước sang bước này / toàn bộ event rời bước trước trong kỳ.</p></div><span>8 giai đoạn</span></div><Table<StageRow> rowKey="stage" columns={columns} dataSource={report.stages} pagination={false} scroll={{ x: 1100 }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lead trong phạm vi đã chọn." /> }} /></Card>
  </div>
}
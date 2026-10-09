import { useMemo, useState } from 'react'
import { DownloadOutlined, FundOutlined, InboxOutlined, PieChartOutlined, ReloadOutlined, RiseOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Empty, Pagination, Select, Skeleton, Space, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as ChartTooltip } from 'recharts'
import { formatMoney, formatMoneyShort, formatNumber } from '@/lib/format'
import { tokens as t } from '@/theme/tokens'
import { useDashboardData } from '@/features/dashboard/api'
import './ProjectPerformanceReportPage.css'

type Inventory = 'AVAILABLE' | 'RESERVED' | 'SOLD'
type PerformanceRow = { key: string; project: string; block: string; total: number; sold: number; reserved: number; available: number; absorption: number; revenue: number }
const statusLabel: Record<Inventory, string> = { AVAILABLE: 'Còn trống', RESERVED: 'Đang giữ chỗ', SOLD: 'Đã bán' }
const statusColor: Record<Inventory, string> = { AVAILABLE: t.colorInfo, RESERVED: t.colorAccent, SOLD: t.colorBrand }
const pct = (value: number) => `${value.toFixed(1).replace('.', ',')}%`
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)
const PROJECTS_PER_PAGE = 5

function exportCsv(rows: PerformanceRow[]) {
  const q = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
  const head = ['Dự án', 'Phân khu', 'Tổng căn', 'Đã bán', 'Giữ chỗ', 'Còn trống', 'Tỷ lệ hấp thụ', 'Doanh thu hợp đồng (VND)']
  const lines = rows.map((row) => [row.project, row.block, row.total, row.sold, row.reserved, row.available, pct(row.absorption), row.revenue].map(q).join(','))
  const href = URL.createObjectURL(new Blob(['\uFEFF' + [head.map(q).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = `hieu-suat-du-an-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(href)
}

/** Hấp thụ từ Product.status; doanh thu từ deal → lead → product. Không có API target hoặc delivery velocity. */
export function ProjectPerformanceReportPage() {
  const [projectId, setProjectId] = useState('all')
  const [progressPage, setProgressPage] = useState(1)
  const data = useDashboardData('30d')
  const report = useMemo(() => {
    const projects = data.projects.data?.content ?? []
    const productsAll = data.products.data?.content ?? []
    const leads = data.leads.data?.content ?? []
    const deals = data.deals.data?.content ?? []
    const selectedProducts = productsAll.filter((product) => projectId === 'all' || product.projectId === projectId)
    const projectName = new Map(projects.map((project) => [project.id, project.name]))
    const productById = new Map(selectedProducts.map((product) => [product.id, product]))
    const leadById = new Map(leads.map((lead) => [lead.id, lead]))
    const revenueByProduct = new Map<string, number>()
    deals.forEach((deal) => {
      const productId = leadById.get(deal.leadId)?.productId
      if (productId && productById.has(productId)) revenueByProduct.set(productId, (revenueByProduct.get(productId) ?? 0) + (deal.contractValue ?? 0))
    })
    const groups = new Map<string, PerformanceRow>()
    selectedProducts.forEach((product) => {
      const project = projectName.get(product.projectId) ?? 'Chưa cập nhật dự án'
      const block = product.block?.trim() || 'Chưa phân khu'
      const key = `${product.projectId}:${block}`
      const row = groups.get(key) ?? { key, project, block, total: 0, sold: 0, reserved: 0, available: 0, absorption: 0, revenue: 0 }
      row.total += 1
      if (product.status === 'SOLD') row.sold += 1
      if (product.status === 'RESERVED') row.reserved += 1
      if (product.status === 'AVAILABLE') row.available += 1
      row.revenue += revenueByProduct.get(product.id) ?? 0
      groups.set(key, row)
    })
    const rows = [...groups.values()].map((row) => ({ ...row, absorption: row.total ? (row.sold / row.total) * 100 : 0 })).sort((a, b) => b.absorption - a.absorption || b.revenue - a.revenue)
    const total = selectedProducts.length
    const sold = selectedProducts.filter((product) => product.status === 'SOLD').length
    const reserved = selectedProducts.filter((product) => product.status === 'RESERVED').length
    const available = selectedProducts.filter((product) => product.status === 'AVAILABLE').length
    const inventory = (Object.keys(statusLabel) as Inventory[]).map((status) => ({ name: statusLabel[status], value: selectedProducts.filter((product) => product.status === status).length, status }))
    const revenue = sum(rows.map((row) => row.revenue))
    const byProject = new Map<string, { total: number; sold: number }>()
    selectedProducts.forEach((product) => { const item = byProject.get(product.projectId) ?? { total: 0, sold: 0 }; item.total += 1; if (product.status === 'SOLD') item.sold += 1; byProject.set(product.projectId, item) })
    const progress = [...byProject.entries()].map(([id, values]) => ({ id, name: projectName.get(id) ?? 'Chưa cập nhật dự án', ...values, absorption: values.total ? (values.sold / values.total) * 100 : 0 })).sort((a, b) => b.absorption - a.absorption || b.sold - a.sold)
    return { projects, rows, total, sold, reserved, available, revenue, inventory, progress, absorption: total ? (sold / total) * 100 : 0 }
  }, [data.deals.data, data.leads.data, data.products.data, data.projects.data, projectId])

  const columns: ColumnsType<PerformanceRow> = [
    { title: 'DỰ ÁN / PHÂN KHU', width: 260, render: (_value, row) => <div className="project-performance-name"><strong>{row.project}</strong><span>{row.block}</span></div> },
    { title: 'TỔNG CĂN', dataIndex: 'total', align: 'center', width: 92, render: formatNumber },
    { title: 'ĐÃ BÁN', dataIndex: 'sold', align: 'center', width: 82, render: (value: number) => <strong className="project-performance-sold">{formatNumber(value)}</strong> },
    { title: 'CÒN TRỐNG', dataIndex: 'available', align: 'center', width: 98, render: formatNumber },
    { title: 'TỶ LỆ HẤP THỤ', dataIndex: 'absorption', width: 165, render: (value: number) => <div className="project-performance-progress"><i><b style={{ width: `${value}%` }} /></i><strong>{pct(value)}</strong></div> },
    { title: 'DOANH THU HỢP ĐỒNG', dataIndex: 'revenue', align: 'right', width: 185, render: (value: number) => <strong className="project-performance-money">{formatMoney(value)}</strong> },
    { title: 'TRẠNG THÁI', width: 115, render: (_value, row) => <Tag color={row.available ? 'green' : 'blue'}>{row.available ? 'Còn hàng' : 'Hết hàng'}</Tag> },
  ]

  if (data.isLoading) return <div className="project-performance"><Skeleton active paragraph={{ rows: 14 }} /></div>
  if (data.error) return <Alert type="error" showIcon message="Không thể tải dữ liệu hiệu suất dự án." action={<Button size="small" onClick={() => data.refetch()}>Thử lại</Button>} />
  const progressPages = Math.max(1, Math.ceil(report.progress.length / PROJECTS_PER_PAGE))
  const currentProgressPage = Math.min(progressPage, progressPages)
  const visibleProgress = report.progress.slice((currentProgressPage - 1) * PROJECTS_PER_PAGE, currentProgressPage * PROJECTS_PER_PAGE)
  const cards = [
    { label: 'TỔNG GIỎ HÀNG', value: formatNumber(report.total), suffix: 'sản phẩm', note: 'Từ danh mục sản phẩm hiện tại', icon: <InboxOutlined />, tone: 'blue' },
    { label: 'ĐÃ BÁN / HẤP THỤ', value: formatNumber(report.sold), suffix: 'căn', note: `${pct(report.absorption)} tổng giỏ hàng`, icon: <RiseOutlined />, tone: 'green' },
    { label: 'ĐANG GIỮ CHỖ', value: formatNumber(report.reserved), suffix: 'căn', note: 'Trạng thái RESERVED', icon: <PieChartOutlined />, tone: 'amber' },
    { label: 'GIỎ HÀNG CÒN', value: formatNumber(report.available), suffix: 'căn', note: 'Trạng thái AVAILABLE', icon: <InboxOutlined />, tone: 'teal' },
    { label: 'DOANH THU HỢP ĐỒNG', value: formatMoneyShort(report.revenue), suffix: '', note: 'Deal liên kết sản phẩm trong phạm vi', icon: <FundOutlined />, tone: 'green' },
  ]

  return <div className="project-performance">
    <section className="project-performance__head"><div><h1>Hiệu suất & Tốc độ hấp thụ Dự án</h1><p>Đánh giá tỷ lệ bán hàng, trạng thái giỏ hàng và doanh thu theo dữ liệu sản phẩm thực tế.</p></div><Space wrap className="project-performance__actions"><Select value={projectId} onChange={(value) => { setProjectId(value); setProgressPage(1) }} options={[{ value: 'all', label: 'Tất cả dự án / giỏ hàng' }, ...report.projects.map((project) => ({ value: project.id, label: project.name }))]} aria-label="Lọc dự án" /><Tooltip title="Xuất bảng dự án và phân khu ra CSV"><Button type="primary" icon={<DownloadOutlined />} onClick={() => exportCsv(report.rows)}>Xuất báo cáo</Button></Tooltip><Tooltip title="Tải lại dữ liệu"><Button icon={<ReloadOutlined />} onClick={() => data.refetch()} /></Tooltip></Space></section>
    <section className="project-performance-kpis" aria-label="Chỉ số hấp thụ dự án">{cards.map((card) => <Card key={card.label} className={`project-performance-kpi project-performance-kpi--${card.tone}`} variant="borderless"><div><span>{card.label}</span><i>{card.icon}</i></div><strong>{card.value} {card.suffix && <small>{card.suffix}</small>}</strong><p>{card.note}</p></Card>)}</section>
    <section className="project-performance-summary"><Card className="project-performance-speed stitch-card" variant="borderless"><div className="project-performance-section-head"><div><h2>Tốc độ hấp thụ theo Dự án trong giỏ hàng</h2><p>Hấp thụ = số sản phẩm có trạng thái Đã bán / tổng sản phẩm. Ưu tiên tỷ lệ cao nhất.</p></div><span>{formatNumber(report.progress.length)} dự án</span></div>{report.progress.length ? <><div className="project-performance-speed__list">{visibleProgress.map((item) => <div key={item.id}><div><strong>{item.name}</strong><span>{formatNumber(item.sold)}/{formatNumber(item.total)} sản phẩm · {pct(item.absorption)}</span></div><i><b style={{ width: `${item.absorption}%` }} /></i></div>)}</div>{report.progress.length > PROJECTS_PER_PAGE && <div className="project-performance-speed__pager"><span>Hiển thị {(currentProgressPage - 1) * PROJECTS_PER_PAGE + 1}–{Math.min(currentProgressPage * PROJECTS_PER_PAGE, report.progress.length)} / {report.progress.length}</span><Pagination current={currentProgressPage} pageSize={PROJECTS_PER_PAGE} total={report.progress.length} showSizeChanger={false} size="small" showLessItems onChange={setProgressPage} aria-label="Phân trang danh sách dự án theo hấp thụ" /></div>}</> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có sản phẩm trong phạm vi này." />}</Card><Card className="project-performance-inventory stitch-card" variant="borderless"><div className="project-performance-section-head"><div><h2>Cơ cấu Trạng thái Giỏ hàng</h2><p>Theo Product.status hiện tại.</p></div></div>{report.total ? <><div className="project-performance-pie"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={report.inventory} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3}>{report.inventory.map((item) => <Cell key={item.status} fill={statusColor[item.status]} />)}</Pie><ChartTooltip formatter={(value: number) => `${formatNumber(value)} sản phẩm`} /></PieChart></ResponsiveContainer><div><strong>{pct(report.absorption)}</strong><span>Đã hấp thụ</span></div></div><div className="project-performance-inventory__list">{report.inventory.map((item) => <div key={item.status}><span><i style={{ background: statusColor[item.status] }} />{item.name}</span><strong>{formatNumber(item.value)} <small>({pct(report.total ? (item.value / report.total) * 100 : 0)})</small></strong></div>)}</div></> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có giỏ hàng sản phẩm." />}</Card></section>
    <Card className="project-performance-table stitch-card" variant="borderless"><div className="project-performance-section-head"><div><h2>Bảng dữ liệu Hiệu suất từng Phân khu & Dự án</h2><p>Phân khu lấy từ `Product.block`. Doanh thu là tổng deal qua lead liên kết sản phẩm.</p></div><span>{formatNumber(report.rows.length)} phân khu</span></div><Table<PerformanceRow> rowKey="key" columns={columns} dataSource={report.rows} pagination={{ pageSize: 10, showSizeChanger: false, position: ['bottomRight'], showTotal: (total, [from, to]) => `Hiển thị ${from}–${to} / ${total} phân khu` }} scroll={{ x: 1050 }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có sản phẩm hoặc phân khu trong phạm vi đã chọn." /> }} /><div className="project-performance-foot"><span>Tổng giỏ hàng: <b>{formatNumber(report.total)} sản phẩm</b> · Đã bán: <b>{formatNumber(report.sold)} sản phẩm</b></span><span>Tổng doanh thu hợp đồng: <b>{formatMoney(report.revenue)}</b></span></div></Card>
  </div>
}
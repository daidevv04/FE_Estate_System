import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Empty, Segmented, Skeleton, Table, Tag, Tooltip } from 'antd'
import {
  CalendarOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  ProjectOutlined,
  ReloadOutlined,
  TeamOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts'
import { useAppointments } from '@/features/appointments/api'
import { formatDateTime, formatMoney, formatMoneyShort } from '@/lib/format'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'
import { tokens as t } from '@/theme/tokens'
import { StatusPill } from '@/components/common/StatusPill'
import {
  APPROVAL_STATUS_LABEL,
  contractValueIn,
  dealsIn,
  openLeads,
  paidTotal,
  PAYMENT_STATUS_LABEL,
  revenueByMonth,
  useDashboardData,
  type RangeKey,
} from '../api'

const rangeOptions = [
  { label: 'Hôm nay', value: 'today' },
  { label: '7 ngày', value: '7d' },
  { label: '30 ngày', value: '30d' },
  { label: 'Quý này', value: 'quarter' },
]

export function DashboardPage() {
  const [range, setRange] = useState<RangeKey>('30d')
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const data = useDashboardData(range)
  const today = dayjs()
  const appointments = useAppointments({
    from: today.startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
    to: today.endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
    salesId: user?.role === 'SALES' ? user.id : undefined,
  })

  const projectsList = data.projects.data?.content ?? []

  const overview = useMemo(() => {
    const leads = data.leads.data?.content ?? []
    const deals = data.deals.data?.content ?? []
    const products = data.products.data?.content ?? []
    const recentDeals = [...deals]
      .sort((a, b) => dayjs(b.signedDate ?? b.createdAt).valueOf() - dayjs(a.signedDate ?? a.createdAt).valueOf())
      .slice(0, 5)
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
      chart: revenueByMonth(deals, leads, 12),
      inventory,
      recentDeals,
      sellingProjects: projectsList.filter((project) => project.status === 'SELLING').length,
    }
  }, [
    data.deals.data?.content,
    data.leads.data?.content,
    data.paymentsByDealId,
    data.products.data?.content,
    projectsList,
    data.win.from,
    data.win.to,
  ])

  const roleConfig = useMemo(() => {
    const role = user?.role
    if (role === 'ADMIN') {
      return {
        badgeColor: 'purple',
        badgeText: `Toàn hệ thống · ${projectsList.length} Dự án`,
        eyebrow: 'HỆ THỐNG TOÀN DOANH NGHIỆP',
        title: 'Bàn điều hành Toàn hệ thống',
        description: 'Doanh thu toàn sàn, giỏ hàng 6 dự án và phê duyệt giao dịch trên toàn hệ thống.',
        leadLabel: 'Lead toàn hệ thống',
        leadNote: 'Đang mở toàn sàn',
        dealLabel: 'Hợp đồng toàn sàn',
        valueLabel: 'Doanh số toàn công ty',
        collectedLabel: 'Dòng tiền đã thu',
        collectedNote: '5 HĐ mới nhất toàn sàn',
        attentionTitle: 'Cần xử lý toàn sàn',
        attentionSub: 'Hợp đồng chờ duyệt, khoản chưa thu, lịch hẹn',
        attentionEmpty: 'Toàn hệ thống vận hành bình thường, không có việc tồn.',
        inventoryTitle: 'Giỏ hàng toàn hệ thống',
        inventorySub: `${overview.sellingProjects} dự án đang bán · ${overview.inventory.total} sản phẩm`,
        inventoryEmpty: 'Chưa có sản phẩm trong hệ thống.',
        chartTitle: 'Doanh thu toàn công ty',
        chartSub: '12 tháng gần nhất toàn sàn',
        dealsTitle: 'Hợp đồng mới nhất toàn sàn',
        dealsSub: '5 hợp đồng vừa ghi nhận',
      }
    }
    if (role === 'MANAGER') {
      return {
        badgeColor: 'gold',
        badgeText: `Khối dự án phụ trách · ${projectsList.length} Dự án`,
        eyebrow: 'TỔNG QUAN KHỐI KINH DOANH',
        title: 'Bàn điều hành Khối Quản lý',
        description: 'Theo dõi tiến độ bán, duyệt giao dịch cọc và quản lý giỏ hàng các dự án thuộc khối.',
        leadLabel: 'Lead khối dự án',
        leadNote: 'Khách quan tâm dự án của khối',
        dealLabel: 'Hợp đồng khối dự án',
        valueLabel: 'Doanh số khối dự án',
        collectedLabel: 'Đã thu trong khối',
        collectedNote: 'Thực thu 5 HĐ mới nhất',
        attentionTitle: 'Việc khối cần xử lý',
        attentionSub: 'Ưu tiên duyệt cọc & nhắc đóng tiền trong khối',
        attentionEmpty: 'Khối không có hợp đồng tồn đọng cần duyệt.',
        inventoryTitle: 'Giỏ hàng khối phụ trách',
        inventorySub: `${overview.sellingProjects} dự án đang bán · ${overview.inventory.total} sản phẩm thuộc khối`,
        inventoryEmpty: 'Khối hiện chưa có sản phẩm được phân bổ.',
        chartTitle: 'Doanh thu khối dự án',
        chartSub: '12 tháng các dự án thuộc khối',
        dealsTitle: 'Hợp đồng mới nhất trong khối',
        dealsSub: '5 hợp đồng thuộc khối phụ trách',
      }
    }
    return {
      badgeColor: 'green',
      badgeText: `Chuyên viên Tư vấn · ${projectsList.length} Dự án được phân bổ`,
      eyebrow: 'BÀN LÀM VIỆC KINH DOANH CÁ NHÂN',
      title: 'Hiệu suất Bán hàng Cá nhân',
      description: 'Khách hàng cá nhân đang chăm sóc, lịch hẹn hôm nay và giỏ hàng dự án được bán.',
      leadLabel: 'Lead của tôi',
      leadNote: 'Khách hàng cá nhân đang chăm sóc',
      dealLabel: 'Hợp đồng của tôi',
      valueLabel: 'Doanh số cá nhân',
      collectedLabel: 'Khách đã thanh toán',
      collectedNote: 'Tiền thu từ HĐ cá nhân',
      attentionTitle: 'Việc của bạn hôm nay',
      attentionSub: 'Lịch hẹn khách & trạng thái hợp đồng cá nhân',
      attentionEmpty: 'Hôm nay không có lịch hẹn hoặc giao dịch tồn đọng.',
      inventoryTitle: 'Giỏ hàng được phân bổ',
      inventorySub: `${overview.sellingProjects} dự án được bán · ${overview.inventory.total} sản phẩm`,
      inventoryEmpty: 'Chưa có sản phẩm thuộc dự án được cấp quyền bán.',
      chartTitle: 'Doanh số cá nhân',
      chartSub: '12 tháng nỗ lực của bạn',
      dealsTitle: 'Hợp đồng của tôi',
      dealsSub: '5 hợp đồng cá nhân gần nhất',
    }
  }, [user?.role, projectsList.length, overview.sellingProjects, overview.inventory.total])

  const todayAppointments = (appointments.data?.content ?? []).filter((appointment) => appointment.status === 'PENDING')
  const period = `${data.win.from.format('DD/MM')} – ${data.win.to.format('DD/MM/YYYY')}`

  const kpis = [
    { label: roleConfig.leadLabel, value: overview.openLeads.toLocaleString('vi-VN'), note: roleConfig.leadNote, icon: <TeamOutlined />, tone: 'blue' },
    { label: roleConfig.dealLabel, value: overview.signedCount.toLocaleString('vi-VN'), note: `Trong kỳ ${period}`, icon: <FileTextOutlined />, tone: 'green' },
    { label: roleConfig.valueLabel, value: formatMoneyShort(overview.signedValue), note: 'Theo ngày ký hợp đồng', icon: <DollarOutlined />, tone: 'green' },
    { label: roleConfig.collectedLabel, value: formatMoneyShort(overview.collectedFromRecent), note: roleConfig.collectedNote, icon: <WalletOutlined />, tone: 'amber' },
  ]

  const attention = useMemo(() => {
    if (user?.role === 'MANAGER') {
      return [
        ...overview.pendingApprovals.map((deal) => ({
          key: `approval-${deal.id}`,
          title: `${deal.contractCode} chờ quản lý duyệt`,
          meta: `Cần duyệt cọc · ${formatMoneyShort(deal.contractValue)}`,
          tone: 'amber' as const,
          icon: <CheckCircleOutlined />,
          to: paths.deals,
        })),
        ...overview.unpaidDeals.slice(0, 2).map((deal) => ({
          key: `payment-${deal.id}`,
          title: `${deal.contractCode} chưa thu đủ`,
          meta: PAYMENT_STATUS_LABEL[deal.paymentStatus] ?? deal.paymentStatus,
          tone: 'red' as const,
          icon: <WalletOutlined />,
          to: paths.deals,
        })),
        ...todayAppointments.slice(0, 2).map((appointment) => ({
          key: `appointment-${appointment.id}`,
          title: appointment.title,
          meta: formatDateTime(appointment.startTime),
          tone: 'blue' as const,
          icon: <CalendarOutlined />,
          to: paths.appointments,
        })),
      ].slice(0, 5)
    }

    if (user?.role === 'SALES') {
      return [
        ...todayAppointments.map((appointment) => ({
          key: `appointment-${appointment.id}`,
          title: `Lịch hẹn: ${appointment.title}`,
          meta: formatDateTime(appointment.startTime),
          tone: 'blue' as const,
          icon: <CalendarOutlined />,
          to: paths.appointments,
        })),
        ...overview.pendingApprovals.map((deal) => ({
          key: `approval-${deal.id}`,
          title: `${deal.contractCode} đang chờ duyệt`,
          meta: `Đã gửi quản lý · ${formatMoneyShort(deal.contractValue)}`,
          tone: 'amber' as const,
          icon: <CheckCircleOutlined />,
          to: paths.deals,
        })),
        ...overview.unpaidDeals.slice(0, 2).map((deal) => ({
          key: `payment-${deal.id}`,
          title: `${deal.contractCode} cần nhắc khách đóng`,
          meta: PAYMENT_STATUS_LABEL[deal.paymentStatus] ?? deal.paymentStatus,
          tone: 'red' as const,
          icon: <WalletOutlined />,
          to: paths.deals,
        })),
      ].slice(0, 5)
    }

    return [
      ...overview.pendingApprovals.slice(0, 2).map((deal) => ({
        key: `approval-${deal.id}`,
        title: `${deal.contractCode} chờ duyệt`,
        meta: formatMoneyShort(deal.contractValue),
        tone: 'amber' as const,
        icon: <CheckCircleOutlined />,
        to: paths.deals,
      })),
      ...overview.unpaidDeals.slice(0, 2).map((deal) => ({
        key: `payment-${deal.id}`,
        title: `${deal.contractCode} chưa thu đủ`,
        meta: PAYMENT_STATUS_LABEL[deal.paymentStatus] ?? deal.paymentStatus,
        tone: 'red' as const,
        icon: <WalletOutlined />,
        to: paths.deals,
      })),
      ...todayAppointments.slice(0, 2).map((appointment) => ({
        key: `appointment-${appointment.id}`,
        title: appointment.title,
        meta: formatDateTime(appointment.startTime),
        tone: 'blue' as const,
        icon: <CalendarOutlined />,
        to: paths.appointments,
      })),
    ].slice(0, 5)
  }, [user?.role, overview.pendingApprovals, overview.unpaidDeals, todayAppointments])

  const reload = () => {
    data.refetch()
    void appointments.refetch()
  }
  const isLoading = data.isLoading || appointments.isLoading

  return (
    <div className="overview-dashboard">
      <section className="overview-dashboard__head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span className="overview-dashboard__eyebrow" style={{ margin: 0 }}>
              {roleConfig.eyebrow}
            </span>
            <Tag color={roleConfig.badgeColor} style={{ fontWeight: 600, borderRadius: 4, margin: 0 }}>
              {roleConfig.badgeText}
            </Tag>
          </div>
          <h1>{roleConfig.title}</h1>
          <p>{roleConfig.description}</p>
          {projectsList.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              <span style={{ fontSize: 12, color: '#718076', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ProjectOutlined /> {user?.role === 'ADMIN' ? 'Toàn bộ dự án:' : user?.role === 'MANAGER' ? 'Dự án thuộc khối:' : 'Dự án phân bổ:'}
              </span>
              {projectsList.map((pj) => (
                <Tag
                  key={pj.id}
                  style={{
                    borderRadius: 4,
                    background: '#f4f7f5',
                    borderColor: '#d6e2d9',
                    color: '#1a3324',
                    fontSize: 12,
                    margin: 0,
                  }}
                >
                  {pj.name}
                </Tag>
              ))}
            </div>
          )}
        </div>
        <div className="overview-dashboard__actions">
          <Segmented value={range} options={rangeOptions} onChange={(value) => setRange(value as RangeKey)} />
          <Tooltip title="Tải lại số liệu">
            <Button aria-label="Tải lại số liệu" icon={<ReloadOutlined />} onClick={reload} />
          </Tooltip>
        </div>
      </section>

      {(data.error || appointments.error) && (
        <Alert
          type="error"
          showIcon
          message="Một phần dữ liệu tổng quan chưa tải được."
          action={<Button size="small" onClick={reload}>Thử lại</Button>}
        />
      )}

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 14 }} />
      ) : (
        <>
          <section className="overview-dashboard__kpis" aria-label="Chỉ số bán hàng chính">
            {kpis.map((kpi) => (
              <Card className={`overview-kpi overview-kpi--${kpi.tone}`} variant="borderless" key={kpi.label}>
                <span className="overview-kpi__icon">{kpi.icon}</span>
                <span className="overview-kpi__label">{kpi.label}</span>
                <strong className="overview-kpi__value">{kpi.value}</strong>
                <small>{kpi.note}</small>
              </Card>
            ))}
          </section>

          <section className="overview-dashboard__operations">
            <Card className="stitch-card overview-dashboard__attention" variant="borderless">
              <div className="overview-dashboard__section-head">
                <div>
                  <h2>{roleConfig.attentionTitle}</h2>
                  <p>{roleConfig.attentionSub}</p>
                </div>
                <Button type="link" onClick={() => navigate(paths.deals)}>Mở hợp đồng</Button>
              </div>
              {attention.length ? (
                <div className="overview-attention-list">
                  {attention.map((item) => (
                    <button
                      className={`overview-attention overview-attention--${item.tone}`}
                      key={item.key}
                      onClick={() => navigate(item.to)}
                    >
                      <span>{item.icon}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.meta}</small>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={roleConfig.attentionEmpty} />
              )}
            </Card>

            <Card className="stitch-card overview-dashboard__inventory" variant="borderless">
              <div className="overview-dashboard__section-head">
                <div>
                  <h2>{roleConfig.inventoryTitle}</h2>
                  <p>{roleConfig.inventorySub}</p>
                </div>
                <Button type="link" onClick={() => navigate(paths.products)}>Xem sản phẩm</Button>
              </div>
              {overview.inventory.total ? (
                <>
                  <div className="overview-inventory__total">
                    <strong>{overview.inventory.available.toLocaleString('vi-VN')}</strong>
                    <span>sản phẩm còn trống</span>
                  </div>
                  <div className="overview-inventory__bar" aria-label="Phân bổ giỏ hàng">
                    <i className="available" style={{ width: `${(overview.inventory.available / overview.inventory.total) * 100}%` }} />
                    <i className="reserved" style={{ width: `${(overview.inventory.reserved / overview.inventory.total) * 100}%` }} />
                    <i className="sold" style={{ width: `${(overview.inventory.sold / overview.inventory.total) * 100}%` }} />
                  </div>
                  <div className="overview-inventory__legend">
                    <span><i className="available" />Còn trống <b>{overview.inventory.available}</b></span>
                    <span><i className="reserved" />Giữ chỗ <b>{overview.inventory.reserved}</b></span>
                    <span><i className="sold" />Đã bán <b>{overview.inventory.sold}</b></span>
                  </div>
                </>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={roleConfig.inventoryEmpty} />
              )}
            </Card>
          </section>

          <section className="overview-dashboard__content">
            <Card className="stitch-card overview-dashboard__chart" variant="borderless">
              <div className="overview-dashboard__section-head">
                <div>
                  <h2>{roleConfig.chartTitle}</h2>
                  <p>{roleConfig.chartSub}</p>
                </div>
                <strong>{formatMoneyShort(overview.signedValue)}</strong>
              </div>
              {overview.chart.some((m) => m.value > 0) ? (
                <div className="overview-dashboard__chart-area">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overview.chart} margin={{ top: 6, right: 0, left: -14, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#e8eee9" />
                      <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: t.colorTextMuted }} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        width={62}
                        tickFormatter={(value) => formatMoneyShort(value)}
                        tick={{ fontSize: 12, fill: t.colorTextMuted }}
                      />
                      <ChartTooltip formatter={(value: number) => [formatMoney(value), 'Đã ký']} cursor={{ fill: 'rgba(0, 107, 44, .05)' }} />
                      <Bar dataKey="value" name="Đã ký" fill={t.colorBrand} radius={[6, 6, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu doanh thu." style={{ marginTop: 40 }} />
              )}
            </Card>

            <Card className="stitch-card overview-dashboard__deals" variant="borderless">
              <div className="overview-dashboard__section-head">
                <div>
                  <h2>{roleConfig.dealsTitle}</h2>
                  <p>{roleConfig.dealsSub}</p>
                </div>
                <Button type="link" onClick={() => navigate(paths.deals)}>Xem tất cả</Button>
              </div>
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                dataSource={overview.recentDeals}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có hợp đồng." /> }}
                columns={[
                  { title: 'Mã hợp đồng', dataIndex: 'contractCode', ellipsis: true, render: (value: string) => <strong>{value}</strong> },
                  { title: 'Giá trị', dataIndex: 'contractValue', align: 'right', render: (value: number | null) => formatMoneyShort(value) },
                  {
                    title: 'Duyệt',
                    dataIndex: 'approvalStatus',
                    align: 'right',
                    render: (value: string) => (
                      <StatusPill tone={value === 'PENDING' ? 'amber' : 'green'} size="sm">
                        {APPROVAL_STATUS_LABEL[value] ?? value}
                      </StatusPill>
                    ),
                  },
                ]}
              />
            </Card>
          </section>
        </>
      )}
    </div>
  )
}
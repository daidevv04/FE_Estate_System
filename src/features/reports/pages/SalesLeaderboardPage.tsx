import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Empty, Segmented, Skeleton } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { paths } from '@/routes/paths'
import { useSalesLeaderboard } from '../leaderboardApi'
import { LeaderboardPodium } from '../components/LeaderboardPodium'
import { KpiPacingCard } from '../components/KpiPacingCard'
import { LeaderboardTable } from '../components/LeaderboardTable'

export function SalesLeaderboardPage() {
  const [period, setPeriod] = useState<'MONTH' | 'QUARTER' | 'YEAR' | 'ALL'>('MONTH')
  const now = dayjs()
  const currentYear = now.year()
  const currentMonth = now.month() + 1

  const leaderboardQuery = useSalesLeaderboard({
    period,
    year: currentYear,
    month: currentMonth,
  })

  const summary = leaderboardQuery.data
  const items = summary?.items ?? []

  const handleExportCsv = () => {
    if (items.length === 0 || leaderboardQuery.isError) return
    const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    const head = ['Hạng', 'Nhân viên kinh doanh', 'Danh hiệu', 'Số giao dịch', 'Doanh số (VND)', 'Hoa hồng (VND)']
    const lines = items.map((r) =>
      [r.rank, r.salesName, r.badge, r.dealsCount, r.totalRevenue, r.totalCommission].map(q).join(',')
    )
    const blob = new Blob(['\uFEFF' + [head.map(q).join(','), ...lines].join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bang-xep-hang-sales-${period}-${now.format('YYYYMMDD')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="crm-leaderboard">
      <PageHeader
        title="Bảng xếp hạng kinh doanh"
        breadcrumb={[{ title: 'Tổng quan', href: paths.dashboard }, { title: 'Bảng xếp hạng' }]}
        meta="Theo dõi doanh số, hoa hồng và tiến độ chỉ tiêu của đội ngũ kinh doanh."
        actions={<Button icon={<DownloadOutlined />} onClick={handleExportCsv} disabled={!items.length || leaderboardQuery.isError}>Xuất CSV</Button>}
      />
      <Card
        className="stitch-card"
        variant="borderless"
        styles={{ body: { padding: '16px 20px' } }}
      >
        <div className="crm-leaderboard__toolbar">
            <Segmented
              size="middle"
              aria-label="Kỳ báo cáo"
              value={period}
              onChange={(v) => setPeriod(v as 'MONTH' | 'QUARTER' | 'YEAR' | 'ALL')}
              options={[
                { label: 'Tháng này', value: 'MONTH' },
                { label: 'Quý này', value: 'QUARTER' },
                { label: 'Năm nay', value: 'YEAR' },
                { label: 'Tất cả', value: 'ALL' },
              ]}
            />

            <Button
              icon={<ReloadOutlined />}
              onClick={() => void leaderboardQuery.refetch()}
              loading={leaderboardQuery.isFetching}
            >
              Làm mới
            </Button>

        </div>
      </Card>

      {leaderboardQuery.isError ? (
        <Alert type="error" showIcon message="Không thể tải bảng xếp hạng" description="Dữ liệu chưa được cập nhật. Vui lòng thử lại."
          action={<Button onClick={() => void leaderboardQuery.refetch()} loading={leaderboardQuery.isFetching}>Thử lại</Button>} />
      ) : leaderboardQuery.isLoading ? (
        <Card className="stitch-card" variant="borderless" aria-busy="true" aria-label="Đang tải bảng xếp hạng"><Skeleton active paragraph={{ rows: 6 }} /></Card>
      ) : !items.length ? (
        <Card className="stitch-card crm-data-state" variant="borderless">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có doanh số được ghi nhận trong kỳ này">
            <Button onClick={() => setPeriod('ALL')}>Xem tất cả thời gian</Button>
          </Empty>
        </Card>
      ) : <div className="crm-leaderboard__content">
      <KpiPacingCard summary={summary} loading={leaderboardQuery.isLoading} />

      {/* Top 3 Podium */}
      <LeaderboardPodium items={items} />

      {/* Leaderboard Detail Table */}
      <LeaderboardTable
        items={items}
        loading={leaderboardQuery.isLoading}
        totalTeamRevenue={summary?.teamAchievedRevenue}
      />
      </div>}
    </div>
  )
}

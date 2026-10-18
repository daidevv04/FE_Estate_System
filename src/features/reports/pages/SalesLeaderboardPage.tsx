import { DownloadOutlined, ReloadOutlined, TrophyOutlined } from '@ant-design/icons'
import { Button, Card, Segmented, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
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
    if (items.length === 0) return
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header Card */}
      <Card
        className="stitch-card"
        variant="borderless"
        styles={{ body: { padding: '16px 20px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Typography.Title level={4} style={{ margin: 0, color: '#0f172a' }}>
              <TrophyOutlined style={{ color: '#059669', marginRight: 8 }} />
              BẢNG XẾP HẠNG THI ĐUA SALES & KPI PACING
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Vinh danh các chiến binh chốt cọc xuất sắc và theo dõi tiến độ doanh số toàn sàn
            </Typography.Text>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Segmented
              size="middle"
              value={period}
              onChange={(v) => setPeriod(v as 'MONTH' | 'QUARTER' | 'YEAR' | 'ALL')}
              options={[
                { label: 'Tháng Này', value: 'MONTH' },
                { label: 'Quý Này', value: 'QUARTER' },
                { label: 'Năm Nay', value: 'YEAR' },
                { label: 'Toàn Bộ', value: 'ALL' },
              ]}
            />

            <Button
              icon={<ReloadOutlined />}
              onClick={() => void leaderboardQuery.refetch()}
              loading={leaderboardQuery.isFetching}
            >
              Làm mới
            </Button>

            <Button icon={<DownloadOutlined />} onClick={handleExportCsv} disabled={items.length === 0}>
              Xuất CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* KPI Pacing Progress Bar */}
      <KpiPacingCard summary={summary} loading={leaderboardQuery.isLoading} />

      {/* Top 3 Podium */}
      <LeaderboardPodium items={items} />

      {/* Leaderboard Detail Table */}
      <LeaderboardTable
        items={items}
        loading={leaderboardQuery.isLoading}
        totalTeamRevenue={summary?.teamAchievedRevenue}
      />
    </div>
  )
}

import { TrophyOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Card, Typography } from 'antd'
import { StatusPill } from '@/components/common/StatusPill'
import { formatMoney } from '@/lib/format'
import type { SalesLeaderboardItem } from '../leaderboardApi'

export function LeaderboardPodium({ items }: { items: SalesLeaderboardItem[] }) {
  const leaders = items.filter((item) => item.rank >= 1 && item.rank <= 3).sort((a, b) => a.rank - b.rank)
  if (!leaders.length) return null
  return (
    <Card className="stitch-card" variant="borderless" title="Nhân viên dẫn đầu">
      <div className="crm-podium-grid">
        {leaders.map((item) => (
          <article className={'crm-podium-entry' + (item.rank === 1 ? ' crm-podium-entry--first' : '')} key={item.salesId}>
            <div className="crm-podium-entry__top">
              <Avatar icon={item.rank === 1 ? <TrophyOutlined /> : <UserOutlined />} />
              <StatusPill tone={item.rank === 1 ? 'green' : 'gray'} dot={false}>Hạng {item.rank}</StatusPill>
            </div>
            <Typography.Title level={3}>{item.salesName}</Typography.Title>
            <div className="crm-podium-entry__revenue stitch-num">{formatMoney(item.totalRevenue)}</div>
            <Typography.Text type="secondary">{item.dealsCount} giao dịch</Typography.Text>
            <div className="crm-podium-entry__commission">Hoa hồng <strong className="stitch-num">{formatMoney(item.totalCommission)}</strong></div>
          </article>
        ))}
      </div>
    </Card>
  )
}

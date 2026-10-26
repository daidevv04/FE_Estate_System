import { TrophyOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Card, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatMoney } from '@/lib/format'
import type { SalesLeaderboardItem } from '../leaderboardApi'

interface Props {
  items: SalesLeaderboardItem[]
  loading?: boolean
  totalTeamRevenue?: number
}

const BADGE_COLOR: Record<string, string> = {
  GOLD: 'gold',
  SILVER: 'default',
  BRONZE: 'orange',
  STANDARD: 'blue',
}

export function LeaderboardTable({ items, loading = false, totalTeamRevenue = 0 }: Props) {
  const columns: ColumnsType<SalesLeaderboardItem> = [
    {
      title: 'Hạng',
      dataIndex: 'rank',
      width: 80,
      align: 'center',
      render: (rank: number) => {
        if (rank === 1) return <span style={{ fontSize: 18 }}>🥇</span>
        if (rank === 2) return <span style={{ fontSize: 18 }}>🥈</span>
        if (rank === 3) return <span style={{ fontSize: 18 }}>🥉</span>
        return <span style={{ fontWeight: 700, color: '#64748b' }}>#{rank}</span>
      },
    },
    {
      title: 'Nhân viên kinh doanh',
      dataIndex: 'salesName',
      width: 220,
      render: (name: string, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar
            size="small"
            icon={<UserOutlined />}
            style={{
              background: r.rank === 1 ? '#fde047' : r.rank === 2 ? '#cbd5e1' : r.rank === 3 ? '#fed7aa' : '#e2e8f0',
              color: r.rank === 1 ? '#854d0e' : '#334155',
            }}
          />
          <div>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>{name}</div>
            <Tag color={BADGE_COLOR[r.badge]} style={{ fontSize: 11, padding: '0 4px', margin: 0 }}>
              {r.badge === 'GOLD' ? 'Vua Bán Hàng' : r.badge === 'SILVER' ? 'Á Quân' : r.badge === 'BRONZE' ? 'Chiến Binh' : 'Sales'}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Số căn / lô đã chốt',
      dataIndex: 'dealsCount',
      width: 150,
      align: 'center',
      render: (count: number) => (
        <span className="stitch-num" style={{ fontWeight: 700 }}>
          {count} giao dịch
        </span>
      ),
    },
    {
      title: 'Doanh số thực đạt',
      dataIndex: 'totalRevenue',
      width: 180,
      align: 'right',
      render: (rev: number) => (
        <span className="stitch-num" style={{ fontWeight: 800, color: '#047857', fontSize: 15 }}>
          {formatMoney(rev)}
        </span>
      ),
    },
    {
      title: 'Hoa hồng ghi nhận',
      dataIndex: 'totalCommission',
      width: 170,
      align: 'right',
      render: (comm: number) => (
        <span className="stitch-num" style={{ fontWeight: 600, color: '#2563eb' }}>
          +{formatMoney(comm)}
        </span>
      ),
    },
    {
      title: 'Đóng góp doanh số',
      key: 'contribution',
      width: 140,
      align: 'right',
      render: (_, r) => {
        const pct = totalTeamRevenue > 0 ? ((r.totalRevenue / totalTeamRevenue) * 100).toFixed(1) : '0'
        return (
          <Tooltip title={`${formatMoney(r.totalRevenue)} trên tổng ${formatMoney(totalTeamRevenue)}`}>
            <span className="stitch-num" style={{ color: '#64748b', fontWeight: 600 }}>
              {pct}%
            </span>
          </Tooltip>
        )
      },
    },
  ]

  return (
    <Card
      className="stitch-card"
      variant="borderless"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrophyOutlined style={{ color: '#059669' }} />
          <span>Chi tiết doanh số</span>
        </div>
      }
      styles={{ body: { padding: '12px 16px' } }}
    >
      <Table<SalesLeaderboardItem>
        rowKey="salesId"
        columns={columns}
        dataSource={items}
        loading={loading}
        size="middle"
        pagination={false}
        scroll={{ x: 960 }}
        locale={{ emptyText: 'Chưa có dữ liệu chốt cọc trong kỳ' }}
      />
    </Card>
  )
}

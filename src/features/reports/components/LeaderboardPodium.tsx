import { CrownOutlined, TrophyOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Card, Tag, Typography } from 'antd'
import { formatMoney } from '@/lib/format'
import type { SalesLeaderboardItem } from '../leaderboardApi'

interface Props {
  items: SalesLeaderboardItem[]
}

export function LeaderboardPodium({ items }: Props) {
  const rank1 = items.find((i) => i.rank === 1)
  const rank2 = items.find((i) => i.rank === 2)
  const rank3 = items.find((i) => i.rank === 3)

  if (!rank1 && !rank2 && !rank3) {
    return null
  }

  return (
    <Card
      className="stitch-card"
      style={{
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        marginBottom: 20,
      }}
      styles={{ body: { padding: '24px 16px 16px 16px' } }}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Typography.Title level={4} style={{ margin: 0, color: '#0f172a' }}>
          <TrophyOutlined style={{ color: '#d97706', marginRight: 8 }} />
          BẢNG VINH DANH TOP 3 CHIẾN BINH DOANH SỐ
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Ghi nhận thành tích chốt cọc và doanh số xuất sắc trong kỳ thi đua
        </Typography.Text>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {/* RANK 2 - BẠC (SILVER) */}
        {rank2 && (
          <div
            style={{
              flex: '1 1 200px',
              maxWidth: 240,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Avatar
              size={56}
              icon={<UserOutlined />}
              style={{
                background: '#e2e8f0',
                color: '#475569',
                border: '3px solid #94a3b8',
                marginBottom: 8,
              }}
            />
            <Tag color="default" style={{ fontWeight: 700, borderColor: '#94a3b8', color: '#475569' }}>
              🥈 HẠNG 2 · Á QUÂN
            </Tag>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginTop: 4, textAlign: 'center' }}>
              {rank2.salesName}
            </div>
            <div
              className="stitch-num"
              style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginTop: 2 }}
            >
              {formatMoney(rank2.totalRevenue)}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {rank2.dealsCount} giao dịch · +{formatMoney(rank2.totalCommission)} HH
            </div>
            <div
              style={{
                width: '100%',
                height: 120,
                background: 'linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)',
                borderRadius: '8px 8px 0 0',
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: 28,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              }}
            >
              2
            </div>
          </div>
        )}

        {/* RANK 1 - VÀNG (GOLD) */}
        {rank1 && (
          <div
            style={{
              flex: '1 1 220px',
              maxWidth: 260,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 2,
            }}
          >
            <CrownOutlined style={{ fontSize: 28, color: '#eab308', marginBottom: 2 }} />
            <Avatar
              size={72}
              icon={<UserOutlined />}
              style={{
                background: '#fef08a',
                color: '#854d0e',
                border: '4px solid #eab308',
                boxShadow: '0 0 16px rgba(234, 179, 8, 0.4)',
                marginBottom: 8,
              }}
            />
            <Tag color="gold" style={{ fontWeight: 800, fontSize: 12, padding: '2px 8px' }}>
              👑 HẠNG 1 · VUA BÁN HÀNG
            </Tag>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#0f172a', marginTop: 4, textAlign: 'center' }}>
              {rank1.salesName}
            </div>
            <div
              className="stitch-num"
              style={{ fontWeight: 900, fontSize: 19, color: '#047857', marginTop: 2 }}
            >
              {formatMoney(rank1.totalRevenue)}
            </div>
            <div style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
              {rank1.dealsCount} giao dịch · +{formatMoney(rank1.totalCommission)} HH
            </div>
            <div
              style={{
                width: '100%',
                height: 160,
                background: 'linear-gradient(180deg, #fde047 0%, #eab308 100%)',
                borderRadius: '8px 8px 0 0',
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#713f12',
                fontWeight: 900,
                fontSize: 36,
                boxShadow: '0 10px 15px -3px rgba(234, 179, 8, 0.3)',
              }}
            >
              1
            </div>
          </div>
        )}

        {/* RANK 3 - ĐỒNG (BRONZE) */}
        {rank3 && (
          <div
            style={{
              flex: '1 1 200px',
              maxWidth: 240,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Avatar
              size={56}
              icon={<UserOutlined />}
              style={{
                background: '#fed7aa',
                color: '#9a3412',
                border: '3px solid #f97316',
                marginBottom: 8,
              }}
            />
            <Tag color="orange" style={{ fontWeight: 700 }}>
              🥉 HẠNG 3 · CHIẾN BINH
            </Tag>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginTop: 4, textAlign: 'center' }}>
              {rank3.salesName}
            </div>
            <div
              className="stitch-num"
              style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginTop: 2 }}
            >
              {formatMoney(rank3.totalRevenue)}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {rank3.dealsCount} giao dịch · +{formatMoney(rank3.totalCommission)} HH
            </div>
            <div
              style={{
                width: '100%',
                height: 90,
                background: 'linear-gradient(180deg, #fdba74 0%, #ea580c 100%)',
                borderRadius: '8px 8px 0 0',
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: 26,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              }}
            >
              3
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

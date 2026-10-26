import type { ReactNode } from 'react'
import { Card, Skeleton, Typography } from 'antd'
import { tokens } from '@/theme/tokens'
import type { StatusTone } from './StatusPill'

export interface KpiCardProps {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon: ReactNode
  tone?: StatusTone
  loading?: boolean
}

export function KpiCard({ label, value, sub, icon, tone = 'green', loading = false }: KpiCardProps) {
  const c = tokens.tones[tone] ?? tokens.tones.gray

  return (
    <Card className="stitch-card crm-kpi" variant="borderless" aria-busy={loading} style={{ height: '100%' }} styles={{ body: { padding: 20 } }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <Typography.Text className="stitch-label" style={{ color: tokens.colorTextMuted }}>
          {label}
        </Typography.Text>
        <span
          style={{
            flex: '0 0 auto',
            width: 36,
            height: 36,
            borderRadius: tokens.radiusMd,
            display: 'grid',
            placeItems: 'center',
            background: c.bg,
            color: c.fg,
            fontSize: 17,
          }}
        >
          {icon}
        </span>
      </div>
      <div style={{ marginTop: 10 }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: tokens.colorText,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {loading ? <Skeleton.Input active size="small" className="crm-kpi__skeleton" /> : value}
        </div>
        {!loading && sub && (
          <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
            {sub}
          </Typography.Text>
        )}
      </div>
    </Card>
  )
}

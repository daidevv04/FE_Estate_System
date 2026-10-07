import { categoryLabel, statusLabel } from '../api'

/** Màu pill theo enum backend — cùng tông với bảng 9.12. */
const CATEGORY_PILL: Record<string, { bg: string; fg: string }> = {
  WELCOME: { bg: '#DCFCE7', fg: '#15803D' },
  FOLLOW_UP: { bg: '#E0F2FE', fg: '#0369A1' },
  PROMOTION: { bg: '#FEF3C7', fg: '#B45309' },
  CONTRACT: { bg: '#F3E8FF', fg: '#6D28D9' },
}

export function CategoryPill({ category }: { category?: string | null }) {
  const p = CATEGORY_PILL[category ?? ''] ?? { bg: '#F1F5F9', fg: '#475569' }
  return <span className="stitch-pill" style={{ background: p.bg, color: p.fg }}>{categoryLabel(category ?? null)}</span>
}

export function StatusPill({ status }: { status?: string | null }) {
  const p = status === 'ACTIVE' ? { bg: '#DCFCE7', fg: '#15803D' } : { bg: '#F1F5F9', fg: '#475569' }
  return (
    <span className="stitch-pill" style={{ background: p.bg, color: p.fg }}>
      <span className="stitch-pill__dot" style={{ background: p.fg }} />
      {statusLabel(status ?? null)}
    </span>
  )
}

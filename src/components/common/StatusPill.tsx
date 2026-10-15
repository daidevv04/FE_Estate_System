import type { CSSProperties, ReactNode } from 'react'
import { tokens } from '@/theme/tokens'

export type StatusTone = 'green' | 'teal' | 'amber' | 'blue' | 'purple' | 'red' | 'gray'
export type Tone = StatusTone

export interface StatusPillProps {
  tone?: StatusTone
  children: ReactNode
  dot?: boolean
  size?: 'md' | 'sm'
  style?: CSSProperties
  className?: string
  icon?: ReactNode
}

export function StatusPill({
  tone = 'gray',
  children,
  dot = true,
  size = 'md',
  style,
  className = '',
  icon,
}: StatusPillProps) {
  const t = tokens.tones[tone] ?? tokens.tones.gray

  return (
    <span
      className={`stitch-pill ${size === 'sm' ? 'stitch-pill--sm' : ''} ${className}`.trim()}
      style={{
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.border}`,
        ...style,
      }}
    >
      {icon}
      {dot && <span className="stitch-pill__dot" style={{ background: t.dot }} />}
      {children}
    </span>
  )
}

import type { ReactNode } from 'react'
import { StatusPill as CommonStatusPill, type Tone } from '@/components/common/StatusPill'
import { tokens as t } from '@/theme/tokens'
import { statusLabel, type AppointmentStatus } from '../api'

const STATUS_TONE: Record<AppointmentStatus, Tone> = {
  PENDING: 'amber',
  DONE: 'green',
  CANCELLED: 'gray',
}

export const isOverdue = (status: AppointmentStatus, endTime: string) =>
  status === 'PENDING' && new Date(endTime).getTime() < Date.now()

export function StatusPill({ status, overdue, size }: { status: AppointmentStatus; overdue?: boolean; size?: 'sm' | 'md' }) {
  if (overdue) {
    return <CommonStatusPill tone="red" size={size}>Quá hạn</CommonStatusPill>
  }
  return <CommonStatusPill tone={STATUS_TONE[status]} size={size}>{statusLabel(status)}</CommonStatusPill>
}

export function OverdueNote({ children }: { children: ReactNode }) {
  return <span style={{ fontSize: 12, color: t.colorErrorText }}>{children}</span>
}

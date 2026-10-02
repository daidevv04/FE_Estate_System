import type { ReactNode } from 'react'
import { tokens as t } from '@/theme/tokens'
import { statusLabel, type AppointmentStatus } from '../api'

/** Trạng thái luôn có NHÃN CHỮ + chấm màu (không phụ thuộc riêng màu để nhận biết) */
const TONE: Record<AppointmentStatus, { bg: string; fg: string; dot: string }> = {
  PENDING: { bg: t.colorWarningBg, fg: t.colorWarningText, dot: t.colorWarning },
  DONE: { bg: t.colorSuccessBg, fg: t.colorSuccessText, dot: t.colorSuccess },
  CANCELLED: { bg: t.colorSurfaceSunken, fg: t.colorTextMuted, dot: t.colorBorderStrong },
}

/** Lịch PENDING nhưng đã qua giờ kết thúc — suy ra từ thời gian thật, KHÔNG phải trạng thái nghiệp vụ mới */
export const isOverdue = (status: AppointmentStatus, endTime: string) =>
  status === 'PENDING' && new Date(endTime).getTime() < Date.now()

export function StatusPill({ status, overdue }: { status: AppointmentStatus; overdue?: boolean }) {
  const c = TONE[status]
  return (
    <span className="stitch-pill" style={{ background: overdue ? t.colorErrorBg : c.bg, color: overdue ? t.colorErrorText : c.fg }}>
      <span className="stitch-pill__dot" style={{ background: overdue ? t.colorError : c.dot }} />
      {overdue ? 'Quá hạn' : statusLabel(status)}
    </span>
  )
}

export function OverdueNote({ children }: { children: ReactNode }) {
  return <span style={{ fontSize: 12, color: t.colorErrorText }}>{children}</span>
}

import { tokens as t } from '@/theme/tokens'
import { roleLabel, statusLabel, type ManagedUser, type UserStatus } from '../api'

const ROLE = { ADMIN: { bg: t.colorTealBg, fg: t.colorTeal }, MANAGER: { bg: t.colorVioletBg, fg: t.colorVioletText }, SALES: { bg: t.colorInfoBg, fg: t.colorInfoText } }
const STATUS: Record<UserStatus, { bg: string; fg: string; dot: string }> = {
  ACTIVE: { bg: t.colorSuccessBg, fg: t.colorSuccessText, dot: t.colorSuccess },
  INACTIVE: { bg: t.colorSurfaceSunken, fg: t.colorTextMuted, dot: t.colorBorderStrong },
  LOCKED: { bg: t.colorErrorBg, fg: t.colorErrorText, dot: t.colorError },
}

export function RolePill({ role }: Pick<ManagedUser, 'role'>) {
  const tone = ROLE[role]
  return <span className="stitch-pill" style={{ background: tone.bg, color: tone.fg }}>{roleLabel(role)}</span>
}

export function StatusPill({ status }: Pick<ManagedUser, 'status'>) {
  const tone = STATUS[status]
  return <span className="stitch-pill" style={{ background: tone.bg, color: tone.fg }}><span className="stitch-pill__dot" style={{ background: tone.dot }} />{statusLabel(status)}</span>
}
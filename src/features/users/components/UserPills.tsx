import { StatusPill as CommonStatusPill, type Tone } from '@/components/common/StatusPill'
import { roleLabel, statusLabel, type ManagedUser, type UserStatus } from '../api'

const ROLE_TONE: Record<ManagedUser['role'], Tone> = {
  ADMIN: 'teal',
  MANAGER: 'purple',
  SALES: 'blue',
}

const STATUS_TONE: Record<UserStatus, Tone> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  LOCKED: 'red',
}

export function RolePill({ role, size }: Pick<ManagedUser, 'role'> & { size?: 'sm' | 'md' }) {
  return (
    <CommonStatusPill tone={ROLE_TONE[role]} size={size} dot={false}>
      {roleLabel(role)}
    </CommonStatusPill>
  )
}

export function StatusPill({ status, size }: Pick<ManagedUser, 'status'> & { size?: 'sm' | 'md' }) {
  return (
    <CommonStatusPill tone={STATUS_TONE[status]} size={size}>
      {statusLabel(status)}
    </CommonStatusPill>
  )
}
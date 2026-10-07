import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { UUID } from '@/types/api'
import type { UserRole } from '@/store/authStore'

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED'

/** API user-service. Tuyệt đối không khai báo password, token, OTP, hoặc twoFactorSecret vào UI state. */
export interface ManagedUser {
  id: UUID
  username: string
  email: string | null
  fullName: string
  phone: string | null
  address: string | null
  role: UserRole
  status: UserStatus
  is2faEnabled: boolean | null
  emailVerifiedAt: string | null
  createdAt: string | null
  updatedAt: string | null
  createdBy: UUID | null
  updatedBy: UUID | null
}

export interface UserInput {
  username: string
  email: string | null
  fullName: string
  phone: string | null
  address: string | null
  role: UserRole
  status: UserStatus
}

/** Chỉ gửi trong request tạo user; không persist password vào store hay query cache. */
export interface CreateUserInput {
  username: string
  password: string
  email: string | null
  fullName: string
  phone: string | null
  address: string | null
  role: UserRole
}

type UserWire = Omit<ManagedUser, 'fullName' | 'is2faEnabled' | 'emailVerifiedAt' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> & {
  fullName?: string
  is2faEnabled?: boolean
  emailVerifiedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  createdBy?: UUID | null
  updatedBy?: UUID | null
  full_name?: string
  is_2fa_enabled?: boolean
  email_verified_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  created_by?: UUID | null
  updated_by?: UUID | null
}

/** Gateway cũ trả camelCase, user-service mới có thể trả snake_case. Chuẩn hóa ngay ở boundary. */
const normalize = (user: UserWire): ManagedUser => ({
  ...user,
  fullName: user.fullName ?? user.full_name ?? user.username,
  is2faEnabled: user.is2faEnabled ?? user.is_2fa_enabled ?? null,
  emailVerifiedAt: user.emailVerifiedAt ?? user.email_verified_at ?? null,
  createdAt: user.createdAt ?? user.created_at ?? null,
  updatedAt: user.updatedAt ?? user.updated_at ?? null,
  createdBy: user.createdBy ?? user.created_by ?? null,
  updatedBy: user.updatedBy ?? user.updated_by ?? null,
})

const KEY = ['users']
const mapInput = (body: UserInput) => ({
  fullName: body.fullName.trim(), email: body.email?.trim() || null,
  phone: body.phone?.trim() || null, address: body.address?.trim() || null,
})
const mapCreateInput = (body: CreateUserInput) => ({
  username: body.username.trim(), password: body.password, fullName: body.fullName.trim(), email: body.email?.trim() || null,
  phone: body.phone?.trim() || null, address: body.address?.trim() || null, role: body.role,
})

export const USER_ROLES: { value: UserRole; label: string; scope: string }[] = [
  { value: 'ADMIN', label: 'Quản trị viên', scope: 'Toàn hệ thống' },
  { value: 'MANAGER', label: 'Quản lý', scope: 'Phạm vi team' },
  { value: 'SALES', label: 'Kinh doanh', scope: 'Dữ liệu được giao' },
]
export const USER_STATUSES: { value: UserStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'INACTIVE', label: 'Ngừng hoạt động' },
  { value: 'LOCKED', label: 'Đã khóa' },
]
export const roleLabel = (role: string) => USER_ROLES.find((x) => x.value === role)?.label ?? role
export const roleScope = (role: string) => USER_ROLES.find((x) => x.value === role)?.scope ?? '—'
export const statusLabel = (status: string) => USER_STATUSES.find((x) => x.value === status)?.label ?? status

export function useUsers() {
  return useQuery({ queryKey: [...KEY, 'list'], queryFn: () => api.get<UserWire[]>('/users').then((r) => r.data.map(normalize)), retry: false })
}

export function useUser(id?: UUID) {
  return useQuery({ queryKey: [...KEY, id], enabled: Boolean(id), retry: false, queryFn: () => api.get<UserWire>(`/users/${id}`).then((r) => normalize(r.data)) })
}

export function useUserMutations() {
  const qc = useQueryClient()
  const done = () => void qc.invalidateQueries({ queryKey: KEY })
  return {
    create: useMutation({ mutationFn: (body: CreateUserInput) => api.post<UserWire>('/users', mapCreateInput(body)).then((r) => normalize(r.data)), onSuccess: done, gcTime: 0 }),
    update: useMutation({ mutationFn: ({ id, body }: { id: UUID; body: UserInput }) => api.patch<UserWire>(`/users/${id}/profile`, mapInput(body)).then((r) => normalize(r.data)), onSuccess: done }),
    role: useMutation({ mutationFn: ({ id, role }: { id: UUID; role: UserRole }) => api.patch<UserWire>(`/users/${id}/role`, { role }).then((r) => normalize(r.data)), onSuccess: done }),
    status: useMutation({ mutationFn: ({ id, status }: { id: UUID; status: UserStatus }) => api.patch<UserWire>(`/users/${id}/status`, { status }).then((r) => normalize(r.data)), onSuccess: done }),
    remove: useMutation({ mutationFn: (id: UUID) => api.delete(`/users/${id}`), onSuccess: (_data, id) => { qc.removeQueries({ queryKey: [...KEY, id] }); done() } }),
  }
}

export function apiErrorMessage(error: unknown) {
  const err = error as { response?: { status?: number; data?: { detail?: string; message?: string; errors?: string[] } } }
  const data = err.response?.data
  const detail = data?.detail ?? data?.message ?? data?.errors?.[0]
  if (err.response?.status === 403) return 'Bạn không có quyền quản trị người dùng'
  if (err.response?.status === 404) return 'Không tìm thấy người dùng'
  if (err.response?.status === 409) return detail ?? 'Username hoặc email đã được sử dụng'
  if (detail === 'Current password is incorrect') return 'Mật khẩu hiện tại không đúng'
  if (detail === 'New password must differ from current password') return 'Mật khẩu mới phải khác mật khẩu hiện tại'
  if (err.response?.status === 400) return detail ?? 'Dữ liệu người dùng chưa hợp lệ'
  return detail ?? 'Có lỗi xảy ra, vui lòng thử lại'
}
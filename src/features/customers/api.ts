import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Page, UUID } from '@/types/api'

/**
 * Khách hàng — shape THẬT của customer-service (CustomerResponse.java).
 * Endpoint: GET /customers (Page, lọc ownerId|status|demandType|source|keyword, sort),
 * GET /customers/{id}, POST /customers, PATCH /customers/{id} (partial), DELETE /customers/{id}.
 */
export type CustomerStatus = 'NEW' | 'POTENTIAL' | 'CUSTOMER' | 'INACTIVE'
export type DemandType = 'BUY' | 'SELL' | 'RENT' | 'INVEST'

export interface Customer {
  id: UUID
  fullName: string
  phone: string | null
  email: string | null
  demandType: DemandType | null
  source: string | null
  ownerId: UUID
  status: CustomerStatus
  createdAt: string
  updatedAt: string
}

/** GET /api/users trả MẢNG TRẦN; chỉ ADMIN đọc được (SALES/MANAGER → 403). */
export interface StaffUser { id: UUID; fullName: string; role: string; status?: string }

export interface CustomerInput {
  fullName: string
  phone?: string | null
  email?: string | null
  demandType?: DemandType | null
  source?: string | null
  ownerId?: UUID | null
  status?: CustomerStatus | null
}

/** Nhãn theo đúng enum backend + chữ dùng trong màn Stitch 9.8 */
export const CUSTOMER_STATUS: { value: CustomerStatus; label: string }[] = [
  { value: 'NEW', label: 'Mới' },
  { value: 'POTENTIAL', label: 'Tiềm năng' },
  { value: 'CUSTOMER', label: 'Khách hàng' },
  { value: 'INACTIVE', label: 'Ngừng hoạt động' },
]
export const DEMAND_TYPE: { value: DemandType; label: string }[] = [
  { value: 'BUY', label: 'Mua ở thực' },
  { value: 'INVEST', label: 'Đầu tư Regal' },
  { value: 'RENT', label: 'Thuê thương mại' },
  { value: 'SELL', label: 'Chuyển nhượng' },
]
export const statusLabel = (s: string) => CUSTOMER_STATUS.find((x) => x.value === s)?.label ?? s
export const demandLabel = (d: string | null) => DEMAND_TYPE.find((x) => x.value === d)?.label ?? '—'

/** Backend CHƯA có cột mã khách hàng → sinh mã hiển thị KH-<năm tạo>-<4 ký tự id> */
export const customerCode = (c: Pick<Customer, 'id' | 'createdAt'>) =>
  `KH-${(c.createdAt ?? '').slice(0, 4)}-${c.id.replace(/-/g, '').slice(0, 4).toUpperCase()}`

const KEY = ['customers']

/**
 * 1 request duy nhất (size 500 + sort mới nhất trước) rồi lọc/phân trang phía client —
 * đủ cho dữ liệu hiện tại và cho 4 thẻ KPI + bảng cùng lúc.
 * ponytail: trần 500 dòng; khi vượt thì đổi sang phân trang server (backend đã hỗ trợ page/size).
 */
export function useCustomers() {
  return useQuery({
    queryKey: [...KEY, 'list'],
    queryFn: () =>
      api.get<Page<Customer>>('/customers', { params: { size: 500, sort: 'createdAt,desc' } })
        .then((r) => r.data),
  })
}

/** Danh sách nhân viên để hiện tên + chọn người phụ trách; lỗi 403 thì coi như rỗng */
export function useStaff() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: () => api.get<StaffUser[]>('/users').then((r) => r.data),
    retry: false,
  })
}

export function useCustomerMutations() {
  const qc = useQueryClient()
  const done = () => void qc.invalidateQueries({ queryKey: KEY })
  return {
    create: useMutation({
      mutationFn: (body: CustomerInput) => api.post<Customer>('/customers', body).then((r) => r.data),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: UUID; body: Partial<CustomerInput> }) =>
        api.patch<Customer>(`/customers/${id}`, body).then((r) => r.data),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (id: UUID) => api.delete(`/customers/${id}`),
      onSuccess: done,
    }),
  }
}

/** Câu lỗi tiếng Việt từ ApiExceptionHandler của customer-service */
export function apiErrorMessage(e: unknown) {
  const err = e as { response?: { status?: number; data?: { detail?: string; message?: string } } }
  const detail = err.response?.data?.detail ?? err.response?.data?.message
  if (err.response?.status === 409) return detail ?? 'Trùng số điện thoại hoặc email'
  if (err.response?.status === 403) return 'Bạn không có quyền với khách hàng này'
  if (err.response?.status === 404) return 'Không tìm thấy khách hàng'
  return detail ?? 'Có lỗi xảy ra, vui lòng thử lại'
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Page, UUID } from '@/types/api'

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

export const customerCode = (c: Pick<Customer, 'id' | 'createdAt'>) =>
  `KH-${(c.createdAt ?? '').slice(0, 4)}-${c.id.replace(/-/g, '').slice(0, 4).toUpperCase()}`

const KEY = ['customers']

export function useCustomers() {
  return useQuery({
    queryKey: [...KEY, 'list'],
    queryFn: () =>
      api.get<Page<Customer>>('/customers', { params: { size: 500, sort: 'createdAt,desc' } })
        .then((r) => r.data),
  })
}

export function useCustomer(id?: UUID) {
  return useQuery({
    queryKey: [...KEY, id],
    enabled: Boolean(id),
    retry: false,
    queryFn: () => api.get<Customer>(`/customers/${id}`).then((r) => r.data),
  })
}

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

export function apiErrorMessage(e: unknown) {
  const err = e as { response?: { status?: number; data?: { detail?: string; message?: string } } }
  const detail = err.response?.data?.detail ?? err.response?.data?.message
  if (err.response?.status === 409) return detail ?? 'Trùng số điện thoại hoặc email'
  if (err.response?.status === 403) return 'Bạn không có quyền với khách hàng này'
  if (err.response?.status === 404) return 'Không tìm thấy khách hàng'
  return detail ?? 'Có lỗi xảy ra, vui lòng thử lại'
}

export type CareType = 'CALL' | 'MEETING' | 'EMAIL' | 'NOTE'

export const CARE_TYPE_LABEL: Record<CareType, string> = {
  CALL: 'Cuộc gọi',
  MEETING: 'Gặp mặt',
  EMAIL: 'Email',
  NOTE: 'Ghi chú',
}

export interface CustomerCare {
  id: UUID
  customerId: UUID
  type: CareType
  content: string
  createdBy: UUID
  createdAt: string
}

export function useCustomerCares(customerId?: string) {
  return useQuery({
    queryKey: ['customer-cares', customerId],
    queryFn: () => api.get<Page<CustomerCare>>(`/customers/${customerId}/cares`, { params: { size: 50, sort: 'createdAt,desc' } }).then((r) => r.data),
    enabled: Boolean(customerId),
  })
}

export function useCareMutations(customerId?: string) {
  const qc = useQueryClient()
  const done = () => { void qc.invalidateQueries({ queryKey: ['customer-cares', customerId] }) }
  return {
    create: useMutation({
      mutationFn: (body: { type: CareType; content: string }) => api.post<CustomerCare>(`/customers/${customerId}/cares`, body).then((r) => r.data),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (careId: string) => api.delete(`/customers/${customerId}/cares/${careId}`),
      onSuccess: done,
    }),
  }
}

export interface SendCustomerEmailInput {
  templateId?: UUID
  toEmail?: string
  subject?: string
  body?: string
  note?: string
}

export function useSendCustomerEmail(customerId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SendCustomerEmailInput) =>
      api.post(`/customers/${customerId}/emails`, body).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['customer-cares', customerId] })
      void qc.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

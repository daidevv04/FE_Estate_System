import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Page, UUID } from '@/types/api'

/** api dùng chung kiểu UUID của app — re-export để component chỉ cần import từ '../api' */
export type { UUID }

/**
 * Hợp đồng — shape THẬT của crm-service (Deal.java / DealResponse.java):
 * id, leadId, salesId, contractCode, contractValue, depositAmount, depositDate, signedDate,
 * paymentStatus, paymentMethod (chuỗi tự do), approvalStatus, approvedBy, approvedAt,
 * fileUrl, status, note, createdAt, updatedAt.
 *
 * Endpoint THẬT (DealController.java): GET /deals (lọc leadId|salesId|status|paymentStatus|approvalStatus
 * + page/size/sort), GET /deals/{id}, POST /deals, PATCH /deals/{id}, DELETE /deals/{id},
 * GET|POST /deals/{id}/payments (append-only). KHÔNG có /deals/{id}/approve|reject|payment-status|deposit
 * → duyệt/từ chối và cập nhật tiền cọc đều đi qua PATCH /deals/{id}.
 */
export type DealStatus = 'IN_PROGRESS' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID'
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUIRED'
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'LOAN'

export interface Deal {
  id: UUID
  leadId: UUID
  salesId: UUID
  contractCode: string
  contractValue: number | null
  depositAmount: number | null
  depositDate: string | null
  signedDate: string | null
  paymentStatus: PaymentStatus
  paymentMethod: string | null
  approvalStatus: ApprovalStatus
  approvedBy: UUID | null
  approvedAt: string | null
  fileUrl: string | null
  status: DealStatus
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface DealPayment {
  id: UUID
  dealId: UUID
  amount: number
  paidAt: string
  method: PaymentMethod | null
  receiptUrl: string | null
  note: string | null
  createdBy: UUID | null
  createdAt: string
}

/** PATCH chỉ đổi field nào gửi lên; POST bắt buộc leadId + contractCode */
export interface DealInput {
  leadId?: UUID
  contractCode?: string
  contractValue?: number | null
  depositAmount?: number | null
  depositDate?: string | null
  signedDate?: string | null
  paymentStatus?: PaymentStatus
  paymentMethod?: PaymentMethod | null
  approvalStatus?: ApprovalStatus
  fileUrl?: string | null
  status?: DealStatus
  note?: string | null
  salesId?: UUID
}

export interface DealPaymentInput {
  amount: number
  paidAt: string
  method?: PaymentMethod
  receiptUrl?: string
  note?: string
}

export const DEAL_STATUS_LABEL: Record<DealStatus, string> = {
  IN_PROGRESS: 'Đang xử lý',
  ACTIVE: 'Đang hiệu lực',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  UNPAID: 'Chưa thanh toán',
  PARTIAL: 'Thanh toán một phần',
  PAID: 'Đã thanh toán',
}

export const APPROVAL_STATUS_LABEL: Record<ApprovalStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  NOT_REQUIRED: 'Không cần duyệt',
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  LOAN: 'Vay ngân hàng',
}

const options = <T extends string>(map: Record<T, string>) =>
  (Object.keys(map) as T[]).map((value) => ({ value, label: map[value] }))

export const DEAL_STATUS_OPTIONS = options(DEAL_STATUS_LABEL)
export const PAYMENT_STATUS_OPTIONS = options(PAYMENT_STATUS_LABEL)
export const APPROVAL_STATUS_OPTIONS = options(APPROVAL_STATUS_LABEL)
export const PAYMENT_METHOD_OPTIONS = options(PAYMENT_METHOD_LABEL)

export const dealStatusLabel = (v: string) => DEAL_STATUS_LABEL[v as DealStatus] ?? v
export const paymentStatusLabel = (v: string) => PAYMENT_STATUS_LABEL[v as PaymentStatus] ?? v
export const approvalStatusLabel = (v: string) => APPROVAL_STATUS_LABEL[v as ApprovalStatus] ?? v

export const paymentMethodLabel = (v: string | null) =>
  v ? (PAYMENT_METHOD_LABEL[v as PaymentMethod] ?? v) : '—'

// ─────────────────────────── Bộ lọc ───────────────────────────

/** Lọc gửi THẲNG lên server (DealController.list nhận đúng các tham số này) */
export interface DealServerFilters {
  status?: DealStatus
  paymentStatus?: PaymentStatus
  approvalStatus?: ApprovalStatus
  salesId?: UUID
}

/** Lọc phía client: backend không có `keyword` cho /deals nên tìm chữ + khoảng ngày/giá trị ở FE */
export interface DealFilters extends DealServerFilters {
  q: string
  signedFrom: string | null
  signedTo: string | null
  valueRange: string
}

export const EMPTY_FILTERS: DealFilters = {
  q: '', signedFrom: null, signedTo: null, valueRange: 'all',
}

export const VALUE_OPTIONS = [
  { value: 'all', label: 'Giá trị: Tất cả' },
  { value: 'lt2', label: 'Dưới 2 tỷ' },
  { value: '2to5', label: '2 – 5 tỷ' },
  { value: '5to10', label: '5 – 10 tỷ' },
  { value: 'gt10', label: 'Trên 10 tỷ' },
]

export const matchValue = (range: string, value: number | null) => {
  if (range === 'all' || range === '') return true
  if (value == null) return false
  const ty = value / 1_000_000_000
  if (range === 'lt2') return ty < 2
  if (range === '2to5') return ty >= 2 && ty < 5
  if (range === '5to10') return ty >= 5 && ty <= 10
  return ty > 10
}

/** Chuỗi tìm kiếm của 1 hợp đồng: mã HĐ + tên/SĐT khách + mã căn + tên dự án + ghi chú */
export interface DealSearchContext {
  customerName: string
  customerPhone: string
  productCode: string
  projectName: string
}

export const searchText = (deal: Deal, ctx: DealSearchContext) =>
  [deal.contractCode, ctx.customerName, ctx.customerPhone, ctx.productCode, ctx.projectName, deal.note ?? '']
    .join(' ').toLowerCase()

export const matchDeal = (deal: Deal, f: DealFilters, ctx: DealSearchContext) => {
  const q = f.q.trim().toLowerCase()
  if (q && !searchText(deal, ctx).includes(q)) return false
  if (!matchValue(f.valueRange, deal.contractValue)) return false
  if (f.signedFrom || f.signedTo) {
    if (!deal.signedDate) return false
    if (f.signedFrom && deal.signedDate < f.signedFrom) return false
    if (f.signedTo && deal.signedDate > f.signedTo) return false
  }
  return true
}


// ─────────────────────────── Hooks ───────────────────────────

const KEY = ['deals']

/**
 * 1 request (size 500) như màn 9.8/9.18: vừa đổ bảng, vừa tính 4 thẻ KPI + dòng tổng kết cùng lúc.
 * ponytail: trần 500 hợp đồng; vượt thì chuyển sang phân trang server (API đã có page/size).
 */
export function useDeals(filters: DealServerFilters) {
  return useQuery({
    queryKey: [...KEY, 'list', filters],
    queryFn: () =>
      api.get<Page<Deal>>('/deals', {
        params: { size: 500, sort: 'createdAt,desc', ...filters },
      }).then((r) => r.data),
  })
}

interface LeadRef { id: UUID; customerId: UUID; productId: UUID; stage: string }
interface CustomerRef { id: UUID; fullName: string; phone: string | null }
interface ProductRef { id: UUID; projectId: UUID; code: string }
interface ProjectRef { id: UUID; name: string }

/** Danh mục suy ra tên khách/căn/dự án: GET /deals chỉ trả leadId, không trả tên khách */
export function useDealCatalog() {
  const leads = useQuery({
    queryKey: ['leads', 'list'],
    queryFn: () => api.get<Page<LeadRef>>('/leads', { params: { size: 500 } }).then((r) => r.data),
  })
  const customers = useQuery({
    queryKey: ['customers', 'list'],
    queryFn: () => api.get<Page<CustomerRef>>('/customers', { params: { size: 500 } }).then((r) => r.data),
  })
  const products = useQuery({
    queryKey: ['products', 'list'],
    queryFn: () => api.get<Page<ProductRef>>('/products', { params: { size: 500 } }).then((r) => r.data),
  })
  const projects = useQuery({
    queryKey: ['projects', 'list'],
    queryFn: () => api.get<Page<ProjectRef>>('/projects', { params: { size: 200 } }).then((r) => r.data),
  })
  return { leads, customers, products, projects }
}

/** GET /users trả mảng trần và chỉ ADMIN đọc được — SALES/MANAGER 403 thì coi như rỗng */
export function useDealStaff() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: () => api.get<{ id: UUID; fullName: string }[]>('/users').then((r) => r.data),
    retry: false,
  })
}

/** Chạy N promise với tối đa `limit` request song song — không bắn 500 request cùng lúc */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let cursor = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++
        out[i] = await fn(items[i])
      }
    }),
  )
  return out
}

/**
 * Các đợt thanh toán của từng hợp đồng — API hiện tại KHÔNG có endpoint tổng hợp doanh thu
 * (9.24 doanh thu vẫn chờ analytic-service). SALES không có quyền trên hợp đồng của người khác
 * → 403 được coi là "chưa có đợt nào" thay vì làm hỏng cả bảng.
 * ponytail: mỗi hợp đồng 1 GET (song song tối đa 6); có endpoint tổng hợp thì thay bằng 1 call.
 */
export function useDealPayments(dealIds: UUID[]) {
  const key = [...dealIds].sort().join(',')
  return useQuery({
    queryKey: [...KEY, 'payments', key],
    enabled: dealIds.length > 0,
    queryFn: async () => {
      const rows = await mapLimit(dealIds, 6, (id) =>
        api.get<DealPayment[]>(`/deals/${id}/payments`).then((r) => r.data).catch(() => [] as DealPayment[]))
      const map: Record<UUID, DealPayment[]> = {}
      dealIds.forEach((id, i) => { map[id] = rows[i] ?? [] })
      return map
    },
  })
}

export function useDealMutations() {
  const qc = useQueryClient()
  const done = () => void qc.invalidateQueries({ queryKey: KEY })
  return {
    create: useMutation({
      mutationFn: (body: DealInput) => api.post<Deal>('/deals', body).then((r) => r.data),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: UUID; body: DealInput }) =>
        api.patch<Deal>(`/deals/${id}`, body).then((r) => r.data),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (id: UUID) => api.delete(`/deals/${id}`),
      onSuccess: done,
    }),
    addPayment: useMutation({
      mutationFn: ({ id, body }: { id: UUID; body: DealPaymentInput }) =>
        api.post<DealPayment>(`/deals/${id}/payments`, body).then((r) => r.data),
      onSuccess: done,
    }),
  }
}

/** Câu lỗi tiếng Việt theo ApiExceptionHandler của crm-service */
export function apiErrorMessage(e: unknown) {
  const err = e as { response?: { status?: number; data?: { detail?: string; message?: string } } }
  const detail = err.response?.data?.detail ?? err.response?.data?.message
  if (err.response?.status === 409) return detail ?? 'Trùng mã hợp đồng hoặc lead đã có hợp đồng'
  if (err.response?.status === 403) return 'Bạn không có quyền với hợp đồng này'
  if (err.response?.status === 404) return 'Không tìm thấy hợp đồng'
  if (err.response?.status === 400) return detail ?? 'Dữ liệu chưa hợp lệ'
  return detail ?? 'Có lỗi xảy ra, vui lòng thử lại'
}

/** % đã thu = tổng các đợt thanh toán / giá trị hợp đồng. Tiền cọc KHÔNG cộng vào đây (xem DealPaymentService). */
export const progressPct = (collected: number, contractValue: number | null) =>
  contractValue && contractValue > 0 ? Math.min(100, Math.round((collected / contractValue) * 100)) : 0

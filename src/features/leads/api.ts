import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { api } from '@/api/client'
import type { Page, UUID } from '@/types/api'

/** api dùng chung kiểu UUID của app — re-export để component chỉ cần import từ '../api' */
export type { UUID }

/**
 * Lead — shape THẬT của crm-service (LeadResponse.java):
 * id, customerId, productId, stage, expectedValue, closeDate, assignedTo, createdAt, updatedAt.
 * Endpoint: GET /leads (customerId|productId|assignedTo|stage|closeDate + page/size/sort),
 * GET /leads/{id}, GET /leads/{id}/stage-history, POST /leads, PATCH /leads/{id}, DELETE /leads/{id}.
 * Entity KHÔNG có: nguồn lead, ghi chú/hẹn chăm sóc, lý do mất, hợp đồng → màn 9.18 không dựng các dòng đó.
 */
export type LeadStage =
  | 'NEW' | 'CONTACTED' | 'INTERESTED' | 'PROPOSAL_SENT'
  | 'NEGOTIATION' | 'INTERNAL_REVIEW' | 'WON' | 'LOST'

export interface Lead {
  id: UUID
  customerId: UUID
  productId: UUID
  stage: LeadStage
  expectedValue: number | null
  closeDate: string | null
  assignedTo: UUID
  createdAt: string
  updatedAt: string
}

export type ProductType = 'APARTMENT' | 'LAND' | 'TOWNHOUSE'

export interface Product {
  id: UUID
  projectId: UUID
  code: string
  type: ProductType
  area: number | null
  block: string | null
  price: number | null
  status: string
}

export interface Project {
  id: UUID
  name: string
  status: string
}

/** CreateLeadRequest/UpdateLeadRequest — PATCH chỉ đổi field nào gửi lên */
export interface LeadInput {
  customerId?: UUID
  productId?: UUID
  stage?: LeadStage
  expectedValue?: number | null
  closeDate?: string | null
  assignedTo?: UUID
}

/** Thứ tự 8 giai đoạn backend, nhãn chữ theo đúng màn Stitch 9.18 */
export const LEAD_STAGES: LeadStage[] = [
  'NEW', 'CONTACTED', 'INTERESTED', 'PROPOSAL_SENT', 'NEGOTIATION', 'INTERNAL_REVIEW', 'WON', 'LOST',
]

export const STAGE_LABEL: Record<LeadStage, string> = {
  NEW: 'Mới',
  CONTACTED: 'Đã liên hệ',
  INTERESTED: 'Quan tâm',
  PROPOSAL_SENT: 'Đã gửi báo giá',
  NEGOTIATION: 'Đàm phán',
  INTERNAL_REVIEW: 'Đánh giá nội bộ',
  WON: 'Thắng (Won)',
  LOST: 'Mất (Lost)',
}

/** Hậu tố class CSS theo giai đoạn (màu chấm/badge lấy từ Stitch 9.18, xem stitch.css mục .kb) */
export const STAGE_CLASS: Record<LeadStage, string> = {
  NEW: 'is-new',
  CONTACTED: 'is-contacted',
  INTERESTED: 'is-interested',
  PROPOSAL_SENT: 'is-proposal',
  NEGOTIATION: 'is-negotiation',
  INTERNAL_REVIEW: 'is-review',
  WON: 'is-won',
  LOST: 'is-lost',
}

/** 6 bước đang chạy — WON/LOST là cột kết quả, không tính vào "lead đang mở" */
export const OPEN_STAGES = LEAD_STAGES.slice(0, 6)
export const stageIndex = (s: LeadStage) => LEAD_STAGES.indexOf(s) + 1

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  APARTMENT: 'Căn hộ',
  LAND: 'Đất nền',
  TOWNHOUSE: 'Nhà phố',
}

const KEY = ['leads']

/**
 * 1 request duy nhất (size 500) rồi lọc/đếm phía client — cùng cách màn 9.8/9.10 đang làm,
 * đủ cho cả 8 cột kanban + 3 thẻ KPI cùng lúc, tránh 8 request theo từng stage.
 * ponytail: trần 500 lead; vượt thì chuyển sang phân trang server + lọc theo stage (API đã hỗ trợ).
 */
export function useLeads() {
  return useQuery({
    queryKey: [...KEY, 'list'],
    queryFn: () =>
      api.get<Page<Lead>>('/leads', { params: { size: 500, sort: 'createdAt,desc' } })
        .then((r) => r.data),
  })
}

/** Danh mục suy ra tên căn + tên dự án cho thẻ lead (2 endpoint dashboard đang dùng, không thêm API mới) */
export function useLeadCatalog() {
  const products = useQuery({
    queryKey: ['products', 'list'],
    queryFn: () => api.get<Page<Product>>('/products', { params: { size: 500 } }).then((r) => r.data),
  })
  const projects = useQuery({
    queryKey: ['projects', 'list'],
    queryFn: () => api.get<Page<Project>>('/projects', { params: { size: 200 } }).then((r) => r.data),
  })
  return { products, projects }
}

export function useLeadMutations() {
  const qc = useQueryClient()
  const done = () => void qc.invalidateQueries({ queryKey: KEY })

  /** Kéo thả/đổi bước: cập nhật lạc quan rồi trả lại dữ liệu cũ nếu API lỗi */
  const move = useMutation({
    mutationFn: ({ id, stage }: { id: UUID; stage: LeadStage }) =>
      api.patch<Lead>(`/leads/${id}`, { stage }).then((r) => r.data),
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: [...KEY, 'list'] })
      const before = qc.getQueryData<Page<Lead>>([...KEY, 'list'])
      if (before) {
        qc.setQueryData<Page<Lead>>([...KEY, 'list'], {
          ...before,
          content: before.content.map((l) => (l.id === id ? { ...l, stage } : l)),
        })
      }
      return { before }
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.before) qc.setQueryData([...KEY, 'list'], ctx.before)
    },
    onSettled: done,
  })

  return {
    move,
    create: useMutation({
      mutationFn: (body: LeadInput) => api.post<Lead>('/leads', body).then((r) => r.data),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: UUID; body: Partial<LeadInput> }) =>
        api.patch<Lead>(`/leads/${id}`, body).then((r) => r.data),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (id: UUID) => api.delete(`/leads/${id}`),
      onSuccess: done,
    }),
  }
}

/** Câu lỗi tiếng Việt từ ApiExceptionHandler của crm-service */
export function apiErrorMessage(e: unknown) {
  const err = e as { response?: { status?: number; data?: { detail?: string; message?: string } } }
  const detail = err.response?.data?.detail ?? err.response?.data?.message
  if (err.response?.status === 404) return detail?.includes('Product') ? 'Không tìm thấy căn/sản phẩm đã chọn' : 'Không tìm thấy lead'
  if (err.response?.status === 403) return 'Bạn không có quyền với lead này'
  if (err.response?.status === 409) return detail ?? 'Lead đã có hợp đồng, không xóa được'
  return detail ?? 'Có lỗi xảy ra, vui lòng thử lại'
}

/** Thắng/Mất là kết cục nên đứng yên; các bước đang chạy tiến 1 bước, "Đánh giá nội bộ" → Thắng */
export function nextStage(s: LeadStage): LeadStage {
  const i = LEAD_STAGES.indexOf(s)
  if (i < 0 || i >= OPEN_STAGES.length) return s
  return i === OPEN_STAGES.length - 1 ? 'WON' : LEAD_STAGES[i + 1]
}

// ── Định dạng & suy diễn hiển thị ───────────────────────────────────────────

const nf = new Intl.NumberFormat('vi-VN')

/** 5.200.000.000 ₫ — số đầy đủ như thiết kế */
export const fullVnd = (n: number | null | undefined) => (n == null ? '—' : `${nf.format(n)} ₫`)

/** 18,2 tỷ ₫ — tổng giá trị trên đầu cột (dưới 1 tỷ hiện "tr") */
export function compactVnd(n: number) {
  if (!n) return '0 ₫'
  if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace('.', ',').replace(',0', '')} tỷ ₫`
  return `${(n / 1e6).toFixed(0)} tr ₫`
}

export const shortDate = (d: string | null | undefined) => (d ? dayjs(d).format('DD/MM/YYYY') : '—')

/** Quá hạn = đã qua hạn chốt mà lead vẫn đang chạy (không phải Thắng/Mất) */
export function overdueDays(l: Pick<Lead, 'stage' | 'closeDate'>, today: Dayjs = dayjs()) {
  if (!l.closeDate || l.stage === 'WON' || l.stage === 'LOST') return 0
  const d = dayjs(l.closeDate).startOf('day')
  return d.isBefore(today.startOf('day')) ? today.startOf('day').diff(d, 'day') : 0
}

/** "Trần Bảo Minh" → "Bảo Minh" (tên ngắn trên thẻ như thiết kế) */
export function shortName(fullName: string | undefined) {
  if (!fullName) return '—'
  return fullName.trim().split(/\s+/).slice(-2).join(' ')
}

export function initials(fullName: string | undefined) {
  if (!fullName) return '?'
  const parts = fullName.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return `${first}${last}`.toUpperCase()
}

const AVATAR_CLASSES = ['av-purple', 'av-emerald', 'av-teal', 'av-amber']
/** Màu avatar cố định theo id (4 tông của thiết kế) — cùng người luôn cùng màu */
export const avatarClass = (id: string) =>
  AVATAR_CLASSES[[...id].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_CLASSES.length]

const SOURCE_TAG_CLASSES: [RegExp, string][] = [
  [/web|form|landing/i, 'tag-web'],
  [/facebook|fb|ads|google|social/i, 'tag-ads'],
  [/zalo/i, 'tag-zalo'],
  [/hotline|call|điện thoại|dien thoai/i, 'tag-hotline'],
]
/** Nguồn lead chỉ có ở hồ sơ khách hàng (customer.source) — entity lead không có field này */
export function sourceTagClass(source: string | null | undefined) {
  if (!source) return 'tag-other'
  return SOURCE_TAG_CLASSES.find(([re]) => re.test(source))?.[1] ?? 'tag-other'
}

// ── Bộ lọc ──────────────────────────────────────────────────────────────────

export type ValueBucket = 'all' | 'lt3' | '3-7' | '7-15' | 'gt15'
export type CloseWindow = '30d' | 'week' | 'month' | 'quarter' | 'all'

export const VALUE_OPTIONS: { value: ValueBucket; label: string }[] = [
  { value: 'all', label: 'Mức giá: Tất cả' },
  { value: 'lt3', label: 'Dưới 3 tỷ' },
  { value: '3-7', label: '3 - 7 tỷ' },
  { value: '7-15', label: '7 - 15 tỷ' },
  { value: 'gt15', label: 'Trên 15 tỷ' },
]

export const CLOSE_OPTIONS: { value: CloseWindow; label: string }[] = [
  { value: '30d', label: 'Hạn chốt: 30 ngày' },
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'quarter', label: 'Quý này' },
  { value: 'all', label: 'Tất cả' },
]

const BILLION = 1e9
export function matchValue(v: number | null, bucket: ValueBucket) {
  if (bucket === 'all') return true
  const n = v ?? 0
  if (bucket === 'lt3') return n < 3 * BILLION
  if (bucket === '3-7') return n >= 3 * BILLION && n < 7 * BILLION
  if (bucket === '7-15') return n >= 7 * BILLION && n < 15 * BILLION
  return n >= 15 * BILLION
}

/** "Hạn chốt" tính từ hôm nay; lead không có hạn chốt chỉ hiện khi chọn "Tất cả" */
export function matchClose(d: string | null, win: CloseWindow, today: Dayjs = dayjs()) {
  if (win === 'all') return true
  if (!d) return false
  const date = dayjs(d)
  if (win === 'week') return date.isSame(today, 'week')
  if (win === 'month') return date.isSame(today, 'month')
  // dayjs core không có đơn vị 'quarter' → so quý bằng tháng
  if (win === 'quarter') {
    return date.year() === today.year() && Math.floor(date.month() / 3) === Math.floor(today.month() / 3)
  }
  // "Hạn chốt" là việc cần chốt trong 30 ngày tới — lead ĐÃ QUÁ HẠN vẫn phải hiện (ảnh thiết kế
  // có thẻ "Quá hạn 2 ngày" ngay trong khung mặc định), nên chỉ loại ngày nằm quá xa phía sau.
  return !date.isAfter(today.add(30, 'day'))
}


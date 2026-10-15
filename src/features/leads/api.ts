import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { api } from '@/api/client'
import type { Page, UUID } from '@/types/api'

export type { UUID }

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

export interface LeadInput {
  customerId?: UUID
  productId?: UUID
  stage?: LeadStage
  expectedValue?: number | null
  closeDate?: string | null
  assignedTo?: UUID
}

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

export const OPEN_STAGES = LEAD_STAGES.slice(0, 6)
export const stageIndex = (s: LeadStage) => LEAD_STAGES.indexOf(s) + 1

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  APARTMENT: 'Căn hộ',
  LAND: 'Đất nền',
  TOWNHOUSE: 'Nhà phố',
}

const KEY = ['leads']

export function useLeads() {
  return useQuery({
    queryKey: [...KEY, 'list'],
    queryFn: () =>
      api.get<Page<Lead>>('/leads', { params: { size: 500, sort: 'createdAt,desc' } })
        .then((r) => r.data),
  })
}

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

  const move = useMutation({
    mutationFn: ({ id, stage }: { id: UUID; stage: LeadStage }) =>
      api.patch<Lead>(`/leads/${id}`, { stage }).then((r) => r.data),
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: [...KEY, 'list'] })
      const before = qc.getQueryData<Page<Lead>>([...KEY, 'list'])
      if (before && Array.isArray(before.content)) {
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

export function apiErrorMessage(e: unknown) {
  const err = e as { response?: { status?: number; data?: { detail?: string; message?: string } } }
  const detail = err.response?.data?.detail ?? err.response?.data?.message
  if (err.response?.status === 404) return detail?.includes('Product') ? 'Không tìm thấy căn/sản phẩm đã chọn' : 'Không tìm thấy lead'
  if (err.response?.status === 403) return 'Bạn không có quyền với lead này'
  if (err.response?.status === 409) return detail ?? 'Lead đã có hợp đồng, không xóa được'
  return detail ?? 'Có lỗi xảy ra, vui lòng thử lại'
}

export function nextStage(s: LeadStage): LeadStage {
  const i = LEAD_STAGES.indexOf(s)
  if (i < 0 || i >= OPEN_STAGES.length) return s
  return i === OPEN_STAGES.length - 1 ? 'WON' : LEAD_STAGES[i + 1]
}

const nf = new Intl.NumberFormat('vi-VN')

export const fullVnd = (n: number | null | undefined) => (n == null ? '—' : `${nf.format(n)} ₫`)

export function compactVnd(n: number) {
  if (!n) return '0 ₫'
  if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace('.', ',').replace(',0', '')} tỷ ₫`
  return `${(n / 1e6).toFixed(0)} tr ₫`
}

export const shortDate = (d: string | null | undefined) => (d ? dayjs(d).format('DD/MM/YYYY') : '—')

export function overdueDays(l: Pick<Lead, 'stage' | 'closeDate'>, today: Dayjs = dayjs()) {
  if (!l.closeDate || l.stage === 'WON' || l.stage === 'LOST') return 0
  const d = dayjs(l.closeDate).startOf('day')
  return d.isBefore(today.startOf('day')) ? today.startOf('day').diff(d, 'day') : 0
}

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
export const avatarClass = (id: string) =>
  AVATAR_CLASSES[[...id].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_CLASSES.length]

const SOURCE_TAG_CLASSES: [RegExp, string][] = [
  [/web|form|landing/i, 'tag-web'],
  [/facebook|fb|ads|google|social/i, 'tag-ads'],
  [/zalo/i, 'tag-zalo'],
  [/hotline|call|điện thoại|dien thoai/i, 'tag-hotline'],
]
export function sourceTagClass(source: string | null | undefined) {
  if (!source) return 'tag-other'
  return SOURCE_TAG_CLASSES.find(([re]) => re.test(source))?.[1] ?? 'tag-other'
}

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

export function matchClose(d: string | null, win: CloseWindow, today: Dayjs = dayjs()) {
  if (win === 'all') return true
  if (!d) return false
  const date = dayjs(d)
  if (win === 'week') return date.isSame(today, 'week')
  if (win === 'month') return date.isSame(today, 'month')
  if (win === 'quarter') {
    return date.year() === today.year() && Math.floor(date.month() / 3) === Math.floor(today.month() / 3)
  }
  return !date.isAfter(today.add(30, 'day'))
}

export interface LeadStageHistory {
  id: UUID
  leadId: UUID
  fromStage: LeadStage | null
  toStage: LeadStage
  changedBy: UUID
  changedAt: string
}

export function useLead(id?: string) {
  return useQuery({
    queryKey: [...KEY, 'detail', id],
    queryFn: () => api.get<Lead>(`/leads/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  })
}

export function useStageHistory(leadId?: string) {
  return useQuery({
    queryKey: [...KEY, 'history', leadId],
    queryFn: () => api.get<LeadStageHistory[]>(`/leads/${leadId}/stages`).then((r) => r.data).catch(() => [] as LeadStageHistory[]),
    enabled: Boolean(leadId),
  })
}


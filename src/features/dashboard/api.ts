import { useQueries, useQuery } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { api } from '@/api/client'
import type { Page, UUID } from '@/types/api'

export type LeadStage =
  | 'NEW' | 'CONTACTED' | 'INTERESTED' | 'PROPOSAL_SENT'
  | 'NEGOTIATION' | 'INTERNAL_REVIEW' | 'WON' | 'LOST'

export const LEAD_STAGES: LeadStage[] = [
  'NEW', 'CONTACTED', 'INTERESTED', 'PROPOSAL_SENT', 'NEGOTIATION', 'INTERNAL_REVIEW', 'WON', 'LOST',
]

export const STAGE_LABEL: Record<LeadStage, string> = {
  NEW: 'Mới tiếp nhận',
  CONTACTED: 'Đã liên hệ',
  INTERESTED: 'Quan tâm thực tế',
  PROPOSAL_SENT: 'Gửi báo giá & bảng tính',
  NEGOTIATION: 'Đàm phán chính sách',
  INTERNAL_REVIEW: 'Chờ duyệt đặt cọc',
  WON: 'Chốt thành công',
  LOST: 'Mất cơ hội',
}

export const OPEN_STAGES = LEAD_STAGES.slice(0, 6)
export const HOT_STAGES: LeadStage[] = ['INTERESTED', 'NEGOTIATION']

export interface DealRow {
  id: UUID; leadId: UUID; salesId: UUID; contractCode: string
  contractValue: number | null; depositAmount: number | null
  signedDate: string | null; paymentStatus: string; approvalStatus: string; status: string
  createdAt: string
}
export interface LeadRow {
  id: UUID; customerId: UUID; productId: UUID; stage: LeadStage
  expectedValue: number | null; closeDate: string | null; assignedTo: UUID; createdAt: string
}
export interface ProductRow { id: UUID; projectId: UUID; code: string; block: string | null; price: number | null; status: 'AVAILABLE' | 'RESERVED' | 'SOLD' }
export interface ProjectRow { id: UUID; name: string; status: string }
export interface CustomerRow { id: UUID; fullName: string; phone: string | null; status: string; createdAt: string }
export interface UserRow { id: UUID; fullName: string; role: string; status: string }
export interface PaymentRow { id: UUID; dealId: UUID; amount: number; paidAt: string; method: string | null }

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  UNPAID: 'Chưa thanh toán', PARTIAL: 'Thanh toán một phần', PAID: 'Đã thanh toán',
}
export const APPROVAL_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', NOT_REQUIRED: 'Không cần duyệt',
}

export const paidTotal = (payments: PaymentRow[] | undefined) =>
  sum((payments ?? []).map((p) => p.amount))

export type RangeKey = 'today' | '7d' | '30d' | 'quarter'
export const RANGE_OPTIONS: { label: string; value: RangeKey }[] = [
  { label: 'Hôm nay', value: 'today' },
  { label: '7 ngày', value: '7d' },
  { label: '30 ngày', value: '30d' },
  { label: 'Quý này', value: 'quarter' },
]

export interface Window { from: Dayjs; to: Dayjs; prevFrom: Dayjs; prevTo: Dayjs }

export function rangeWindow(range: RangeKey): Window {
  const now = dayjs()
  if (range === 'today') {
    const from = now.startOf('day')
    return { from, to: now, prevFrom: from.subtract(1, 'day'), prevTo: from }
  }
  const days = range === '7d' ? 7 : range === '30d' ? 30 : null
  const from = days
    ? now.subtract(days - 1, 'day').startOf('day')
    : now.month(Math.floor(now.month() / 3) * 3).startOf('month')
  const len = now.diff(from, 'day') + 1
  return { from, to: now, prevFrom: from.subtract(len, 'day'), prevTo: from }
}

const inWindow = (ts: string | null | undefined, from: Dayjs, to: Dayjs) => {
  if (!ts) return false
  const d = dayjs(ts)
  return !d.isBefore(from) && !d.isAfter(to)
}

const sum = (values: (number | null | undefined)[]) => values.reduce<number>((acc, v) => acc + (v ?? 0), 0)

export const signedAt = (d: DealRow) => d.signedDate ?? d.createdAt

export const dealsIn = (deals: DealRow[], from: Dayjs, to: Dayjs) =>
  deals.filter((d) => inWindow(signedAt(d), from, to))

export const contractValueIn = (deals: DealRow[], from: Dayjs, to: Dayjs) =>
  sum(dealsIn(deals, from, to).map((d) => d.contractValue))

export const leadsCreatedIn = (leads: LeadRow[], from: Dayjs, to: Dayjs) =>
  leads.filter((l) => inWindow(l.createdAt, from, to)).length

export const openLeads = (leads: LeadRow[]) => leads.filter((l) => l.stage !== 'WON' && l.stage !== 'LOST')
export const hotLeads = (leads: LeadRow[]) => leads.filter((l) => HOT_STAGES.includes(l.stage))
export const wonCount = (leads: LeadRow[]) => leads.filter((l) => l.stage === 'WON').length
export const lostCount = (leads: LeadRow[]) => leads.filter((l) => l.stage === 'LOST').length

export const winRate = (leads: LeadRow[]) => {
  const closed = wonCount(leads) + lostCount(leads)
  return closed === 0 ? 0 : (wonCount(leads) / closed) * 100
}

export interface StageStat { stage: LeadStage; count: number; pct: number; value: number }

export const pipelineByStage = (leads: LeadRow[]): StageStat[] => {
  const total = Math.max(1, leads.length)
  return LEAD_STAGES.map((stage) => {
    const rows = leads.filter((l) => l.stage === stage)
    return { stage, count: rows.length, pct: (rows.length / total) * 100, value: sum(rows.map((l) => l.expectedValue)) }
  })
}

export interface MonthRevenue { period: string; value: number; expected: number }

export function revenueByMonth(deals: DealRow[], leads: LeadRow[], months = 12): MonthRevenue[] {
  const now = dayjs()
  return Array.from({ length: months }, (_, i) => {
    const m = now.subtract(months - 1 - i, 'month')
    const value = sum(
      deals.filter((d) => dayjs(signedAt(d)).isSame(m, 'month')).map((d) => d.contractValue),
    )
    const expected = sum(
      leads
        .filter((l) => dayjs(l.closeDate ?? l.createdAt).isSame(m, 'month'))
        .map((l) => l.expectedValue),
    )
    return { period: `T${m.month() + 1}`, value, expected }
  })
}

export interface ProjectStat {
  projectId: UUID; name: string; managerId: UUID | null
  leads: number; openLeads: number; deals: number; value: number
}

export function projectPerformance(
  projects: ProjectRow[], products: ProductRow[], leads: LeadRow[], deals: DealRow[],
): ProjectStat[] {
  const projectOfProduct = new Map(products.map((p) => [p.id, p.projectId]))
  const projectOfLead = new Map(leads.map((l) => [l.id, projectOfProduct.get(l.productId)]))
  return projects
    .map((pj) => {
      const own = leads.filter((l) => projectOfLead.get(l.id) === pj.id)
      const ownIds = new Set(own.map((l) => l.id))
      const ownDeals = deals.filter((d) => ownIds.has(d.leadId))
      const bySales = new Map<UUID, number>()
      for (const d of ownDeals) bySales.set(d.salesId, (bySales.get(d.salesId) ?? 0) + (d.contractValue ?? 0))
      const topSales = [...bySales.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? own[0]?.assignedTo ?? null
      return {
        projectId: pj.id,
        name: pj.name,
        managerId: topSales,
        leads: own.length,
        openLeads: own.filter((l) => l.stage !== 'WON' && l.stage !== 'LOST').length,
        deals: ownDeals.length,
        value: sum(ownDeals.map((d) => d.contractValue)),
      }
    })
    .filter((p) => p.leads > 0 || p.deals > 0)
    .sort((a, b) => b.value - a.value)
}

const useList = <T,>(url: string, params: Record<string, unknown>, key: string) =>
  useQuery({
    queryKey: ['dashboard', key],
    queryFn: () => api.get<Page<T>>(url, { params }).then((r) => r.data),
  })

export function useDashboardData(range: RangeKey) {
  const win = rangeWindow(range)
  const deals = useList<DealRow>('/deals', { size: 200, sort: 'createdAt,desc' }, 'deals')
  const leads = useList<LeadRow>('/leads', { size: 500, sort: 'createdAt,desc' }, 'leads')
  const products = useList<ProductRow>('/products', { size: 500 }, 'products')
  const projects = useList<ProjectRow>('/projects', { size: 200 }, 'projects')
  const customers = useList<CustomerRow>('/customers', { size: 500 }, 'customers')
  const users = useQuery({
    queryKey: ['dashboard', 'users'],
    queryFn: () => api.get<UserRow[]>('/users').then((r) => r.data),
  })

  const isLoading =
    deals.isLoading || leads.isLoading || products.isLoading || projects.isLoading ||
    customers.isLoading
  const error =
    deals.error ?? leads.error ?? products.error ?? projects.error ?? customers.error

  const latest = [...(deals.data?.content ?? [])]
    .sort((a, b) => dayjs(signedAt(b)).valueOf() - dayjs(signedAt(a)).valueOf())
    .slice(0, 5)
  const paymentQueries = useQueries({
    queries: latest.map((d) => ({
      queryKey: ['dashboard', 'deal-payments', d.id],
      queryFn: () => api.get<PaymentRow[]>(`/deals/${d.id}/payments`).then((r) => r.data),
    })),
  })

  return {
    win,
    deals, leads, products, projects, customers, users,
    latest,
    paymentsByDealId: new Map(latest.map((d, i) => [d.id, paymentQueries[i]?.data])),
    isLoading,
    error,
    updatedAt: Math.max(
      deals.dataUpdatedAt, leads.dataUpdatedAt, products.dataUpdatedAt,
      projects.dataUpdatedAt, customers.dataUpdatedAt, users.dataUpdatedAt,
    ),
    refetch: () => {
      void deals.refetch(); void leads.refetch(); void products.refetch()
      void projects.refetch(); void customers.refetch(); void users.refetch()
    },
  }
}

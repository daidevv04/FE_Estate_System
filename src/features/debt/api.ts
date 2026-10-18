import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { UUID } from '@/types/api'

export type AgingBucket = 'DUE_SOON' | 'OVERDUE_1_30' | 'OVERDUE_31_60' | 'OVERDUE_60_PLUS'

export interface DebtAgingItem {
  scheduleId: UUID
  dealId: UUID
  contractCode: string
  leadId: UUID | null
  customerId: UUID | null
  productId: UUID | null
  productCode: string
  projectId: UUID | null
  projectName: string
  salesId: UUID | null
  installmentNo: number
  installmentName: string
  amountDue: number
  amountPaid: number
  amountRemaining: number
  dueDate: string
  daysDiff: number
  agingBucket: AgingBucket
  lastRemindedAt: string | null
}

export interface DebtAgingSummary {
  totalReceivable: number
  collectedThisMonth: number
  expectedThisMonth: number
  dueSoonAmount: number
  overdueAmount: number
  overdueCount: number
  items: DebtAgingItem[]
}

export interface RemindPaymentInput {
  scheduleId: string
  note?: string
}

export interface RemindPaymentResult {
  success: boolean
  scheduleId: string
  dealId: string
  contractCode: string
  salesId: string | null
  inAppSent: boolean
  emailSent: boolean
  remindedAt: string
  message: string
}

export const debtKeys = {
  all: ['debt-aging'] as const,
  summary: () => [...debtKeys.all, 'summary'] as const,
}

export function useDebtAgingSummary() {
  return useQuery({
    queryKey: debtKeys.summary(),
    queryFn: async () => {
      const { data } = await api.get<DebtAgingSummary>('/deals/debt-aging')
      return data
    },
  })
}

export function useRemindPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ scheduleId, note }: RemindPaymentInput) => {
      const { data } = await api.post<RemindPaymentResult>(`/deals/schedules/${scheduleId}/remind`, { note })
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: debtKeys.all })
    },
  })
}

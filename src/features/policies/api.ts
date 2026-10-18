import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

export interface PolicyOption {
  id: string
  name: string
  description: string
  discountRate: number
  paymentScheduleNote: string
}

export interface DiscountCalculateInput {
  listedPrice: number
  policyId?: string
  bulkQuantity?: number
  isLoyalCustomer?: boolean
  customVoucherAmount?: number
}

export interface DiscountCalculateResult {
  listedPrice: number
  baseDiscountRate: number
  bulkDiscountRate: number
  loyalDiscountRate: number
  totalDiscountRate: number
  percentageDiscountAmount: number
  voucherDiscountAmount: number
  totalDiscountAmount: number
  netContractValue: number
  policyName: string
  discountAppliedBreakdowns: string[]
}

export const policyKeys = {
  all: ['sales-policies'] as const,
  list: () => [...policyKeys.all, 'list'] as const,
}

export function useSalesPolicies() {
  return useQuery({
    queryKey: policyKeys.list(),
    queryFn: async () => {
      const { data } = await api.get<PolicyOption[]>('/sales-policies')
      return data
    },
  })
}

export function useCalculateDiscount() {
  return useMutation({
    mutationFn: async (input: DiscountCalculateInput) => {
      const { data } = await api.post<DiscountCalculateResult>('/sales-policies/calculate', input)
      return data
    },
  })
}

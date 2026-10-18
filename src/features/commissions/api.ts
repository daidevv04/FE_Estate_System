import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { UUID } from '@/types/api'

export type CommissionStatus = 'PENDING' | 'PARTIALLY_PAID' | 'FULLY_PAID' | 'CANCELLED'
export type CommissionMilestoneStatus = 'PENDING_MILESTONE' | 'ELIGIBLE' | 'APPROVED' | 'PAID'

export interface DealCommissionMilestone {
  id: UUID
  dealCommissionId: UUID
  milestoneNo: number
  name: string
  customerPaidThresholdPct: number
  payoutPercentage: number
  amountExpected: number
  amountPaid: number
  status: CommissionMilestoneStatus
  approvedBy: UUID | null
  approvedAt: string | null
  paidAt: string | null
  note: string | null
  createdAt: string
}

export interface DealCommission {
  id: UUID
  dealId: UUID
  salesId: UUID
  contractValue: number
  commissionRate: number
  commissionAmount: number
  bonusAmount: number
  totalExpected: number
  totalPaid: number
  status: CommissionStatus
  createdAt: string
  milestones: DealCommissionMilestone[]
}

export interface CommissionSummary {
  totalExpected: number
  totalPaid: number
  totalEligible: number
  totalPending: number
}

export interface CommissionsResponse {
  summary: CommissionSummary
  commissions: DealCommission[]
}

export interface MilestoneRule {
  milestoneNo: number
  name: string
  customerPaidThresholdPct: number
  payoutPercentage: number
}

export interface ProjectCommissionPolicy {
  id: UUID
  projectId: UUID
  commissionRate: number
  defaultBonusAmount: number
  milestoneRules: string
  createdAt: string
  updatedAt: string
}

export interface UpdateCommissionPolicyInput {
  commissionRate: number
  defaultBonusAmount: number
  milestoneRules: string
}

export const commissionKeys = {
  all: ['commissions'] as const,
  my: () => [...commissionKeys.all, 'my'] as const,
  list: () => [...commissionKeys.all, 'list'] as const,
  deal: (dealId: UUID) => [...commissionKeys.all, 'deal', dealId] as const,
  policy: (projectId: UUID) => ['commission-policy', projectId] as const,
}

export function useMyCommissions() {
  return useQuery({
    queryKey: commissionKeys.my(),
    queryFn: async () => {
      const { data } = await api.get<CommissionsResponse>('/commissions/my')
      return data
    },
  })
}

export function useAllCommissions() {
  return useQuery({
    queryKey: commissionKeys.list(),
    queryFn: async () => {
      const { data } = await api.get<CommissionsResponse>('/commissions')
      return data
    },
  })
}

export function useDealCommission(dealId?: UUID | null) {
  return useQuery({
    queryKey: commissionKeys.deal(dealId || ('' as UUID)),
    queryFn: async () => {
      if (!dealId) throw new Error('Missing dealId')
      const { data } = await api.get<DealCommission>(`/deals/${dealId}/commission`)
      return data
    },
    enabled: Boolean(dealId),
  })
}

export function useApproveMilestone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ milestoneId }: { milestoneId: UUID }) => {
      const { data } = await api.post<DealCommissionMilestone>(`/commissions/milestones/${milestoneId}/approve`)
      return data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: commissionKeys.all })
    },
  })
}

export function usePayoutMilestone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ milestoneId, note }: { milestoneId: UUID; note?: string }) => {
      const { data } = await api.post<DealCommissionMilestone>(`/commissions/milestones/${milestoneId}/payout`, { note })
      return data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: commissionKeys.all })
    },
  })
}

export function useProjectCommissionPolicy(projectId?: UUID | null) {
  return useQuery({
    queryKey: commissionKeys.policy(projectId || ('' as UUID)),
    queryFn: async () => {
      if (!projectId) throw new Error('Missing projectId')
      const { data } = await api.get<ProjectCommissionPolicy>(`/projects/${projectId}/commission-policy`)
      return data
    },
    enabled: Boolean(projectId),
  })
}

export function useUpdateProjectCommissionPolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, input }: { projectId: UUID; input: UpdateCommissionPolicyInput }) => {
      const { data } = await api.put<ProjectCommissionPolicy>(`/projects/${projectId}/commission-policy`, input)
      return data
    },
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: commissionKeys.policy(vars.projectId) })
      void qc.invalidateQueries({ queryKey: commissionKeys.all })
    },
  })
}

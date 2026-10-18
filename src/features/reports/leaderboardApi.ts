import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

export type LeaderboardBadge = 'GOLD' | 'SILVER' | 'BRONZE' | 'STANDARD'

export interface SalesLeaderboardItem {
  rank: number
  salesId: string
  salesName: string
  dealsCount: number
  totalRevenue: number
  totalCommission: number
  badge: LeaderboardBadge
}

export interface SalesLeaderboardSummary {
  period: 'MONTH' | 'QUARTER' | 'YEAR' | 'ALL'
  year: number
  month: number | null
  teamTargetRevenue: number
  teamAchievedRevenue: number
  teamPacingRate: number
  totalDealsCount: number
  items: SalesLeaderboardItem[]
}

export interface LeaderboardParams {
  period?: 'MONTH' | 'QUARTER' | 'YEAR' | 'ALL'
  year?: number
  month?: number
}

export const leaderboardKeys = {
  all: ['sales-leaderboard'] as const,
  filter: (params: LeaderboardParams) => [...leaderboardKeys.all, params] as const,
}

export function useSalesLeaderboard(params: LeaderboardParams = {}) {
  return useQuery({
    queryKey: leaderboardKeys.filter(params),
    queryFn: async () => {
      const { data } = await api.get<SalesLeaderboardSummary>('/reports/leaderboard', {
        params: {
          period: params.period ?? 'MONTH',
          year: params.year,
          month: params.month,
        },
      })
      return data
    },
  })
}

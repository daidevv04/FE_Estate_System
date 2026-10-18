import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { UUID } from '@/types/api'

export interface CompanyLegalInfo {
  companyName: string
  brandName: string
  taxCode: string
  headquarterAddress: string
  hotline: string
  website: string
  representativeName: string
  representativePosition: string
}

export interface ProductPrintDto {
  id: UUID
  code: string
  block: string | null
  type: string | null
  price: number | null
  area: number | null
  bedroom: number | null
  direction: string | null
}

export interface ProjectPrintDto {
  id: UUID
  name: string
  location: string | null
  investor: string | null
}

export interface PaymentPrintDto {
  id: UUID
  amount: number
  paidAt: string
  method: string | null
  receiptUrl: string | null
  note: string | null
  createdBy: UUID | null
}

export interface SchedulePrintDto {
  id: UUID
  installmentNo: number
  name: string
  percentage: number | null
  amountDue: number
  dueDate: string
  notes: string | null
}

export interface DealPrintData {
  dealId: UUID
  contractCode: string
  contractValue: number
  depositAmount: number | null
  depositDate: string | null
  signedDate: string | null
  paymentMethod: string | null
  paymentStatus: string
  dealStatus: string
  approvalStatus: string
  note: string | null
  leadId: UUID | null
  customerId: UUID | null
  salesId: UUID | null
  company: CompanyLegalInfo
  product: ProductPrintDto | null
  project: ProjectPrintDto | null
  payments: PaymentPrintDto[]
  schedules: SchedulePrintDto[]
}

export const documentKeys = {
  all: ['documents'] as const,
  printData: (dealId: string) => [...documentKeys.all, 'print-data', dealId] as const,
}

export function useDealPrintData(dealId?: string | null) {
  return useQuery({
    queryKey: documentKeys.printData(dealId || ''),
    queryFn: async () => {
      if (!dealId) throw new Error('Thiếu mã hợp đồng')
      const { data } = await api.get<DealPrintData>(`/deals/${dealId}/print-data`)
      return data
    },
    enabled: Boolean(dealId),
  })
}

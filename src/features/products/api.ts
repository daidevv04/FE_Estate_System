import { useQueries, useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Page } from '@/types/api'
import { useProductTotal, type Product, type ProductFilters as Filters, type ProductStatus } from '@/features/projects/api'

export {
  DIRECTION, PRODUCT_STATUS, PRODUCT_TYPE, apiErrorMessage, labelOf,
  useProductMutations, useProducts, useProjectMutations, useProjects,
  type Product, type ProductFilters as ProductFilters, type ProductInput, type ProductStatus, type ProductType,
} from '@/features/projects/api'

export function useProductTotals() {
  const scopes: (Filters | Record<string, never>)[] = [{}, { status: 'AVAILABLE' }, { status: 'RESERVED' }, { status: 'SOLD' }]
  const results = useQueries({ queries: scopes.map((params) => ({ queryKey: ['products', 'total', params], queryFn: () => api.get<Page<Product>>('/products', { params: { ...params, page: 0, size: 1 } }).then((r) => r.data?.totalElements ?? 0) })) })
  const counts: Record<ProductStatus, number> = { AVAILABLE: results[1]?.data ?? 0, RESERVED: results[2]?.data ?? 0, SOLD: results[3]?.data ?? 0 }
  return { all: results[0]?.data ?? 0, counts, isLoading: results.some((r) => r.isLoading) }
}

export function useProduct(id?: string) {
  return useQuery({
    queryKey: ['products', 'detail', id],
    enabled: Boolean(id),
    queryFn: () => api.get<Product>(`/products/${id}`).then((r) => r.data),
  })
}

export { useProductTotal }
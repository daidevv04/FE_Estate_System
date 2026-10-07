import { useQueries, useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Page } from '@/types/api'
import { useProductTotal, type Product, type ProductFilters as Filters, type ProductStatus } from '@/features/projects/api'

/** Domain product đã nằm ở features/projects (dùng chung với màn 9.15) — re-export, không nhân bản. */
export {
  DIRECTION, PRODUCT_STATUS, PRODUCT_TYPE, apiErrorMessage, labelOf,
  useProductMutations, useProducts, useProjectMutations, useProjects,
  type Product, type ProductFilters as ProductFilters, type ProductInput, type ProductStatus, type ProductType,
} from '@/features/projects/api'

/** KPI 9.16: đếm 4 nhóm bằng totalElements của chính GET /products — không có endpoint tổng hợp riêng. */
export function useProductTotals() {
  const scopes: (Filters | Record<string, never>)[] = [{}, { status: 'AVAILABLE' }, { status: 'RESERVED' }, { status: 'SOLD' }]
  const results = useQueries({ queries: scopes.map((params) => ({ queryKey: ['products', 'total', params], queryFn: () => api.get<Page<Product>>('/products', { params: { ...params, page: 0, size: 1 } }).then((r) => r.data?.totalElements ?? 0) })) })
  const counts: Record<ProductStatus, number> = { AVAILABLE: results[1]?.data ?? 0, RESERVED: results[2]?.data ?? 0, SOLD: results[3]?.data ?? 0 }
  return { all: results[0]?.data ?? 0, counts, isLoading: results.some((r) => r.isLoading) }
}

/** 9.17: chi tiết 1 sản phẩm — GET /products/{id} đã có sẵn ở ProductController, chỉ thêm hook theo id từ route. */
export function useProduct(id?: string) {
  return useQuery({
    queryKey: ['products', 'detail', id],
    enabled: Boolean(id),
    queryFn: () => api.get<Product>(`/products/${id}`).then((r) => r.data),
  })
}

export { useProductTotal }
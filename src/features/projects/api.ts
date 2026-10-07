import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Page, UUID } from '@/types/api'

export type { UUID }

export type ProjectStatus = 'PLANNING' | 'SELLING' | 'SOLD_OUT' | 'CLOSED'
export type ProductStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD'
export type ProductType = 'APARTMENT' | 'LAND' | 'TOWNHOUSE'
export type Direction = 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW'

export interface Project { id: UUID; name: string; location: string | null; investor: string | null; description: string | null; imageUrl: string | null; status: ProjectStatus; createdAt: string; updatedAt: string }
export interface Product { id: UUID; projectId: UUID; code: string; type: ProductType; area: number; block: string | null; price: number | null; bedroom: number | null; direction: Direction | null; imageUrl: string | null; status: ProductStatus; createdAt: string; updatedAt: string }
export interface ProjectInput { name?: string; location?: string | null; investor?: string | null; description?: string | null; imageUrl?: string | null; status?: ProjectStatus }
export interface ProductInput { projectId?: UUID; code?: string; type?: ProductType; area?: number; block?: string | null; price?: number | null; bedroom?: number | null; direction?: Direction | null; imageUrl?: string | null; status?: ProductStatus }
export interface ProductFilters { projectId?: UUID; keyword?: string; type?: ProductType; status?: ProductStatus; block?: string; minPrice?: number; maxPrice?: number; page?: number; size?: number }

export const PROJECT_STATUS: { value: ProjectStatus; label: string }[] = [
  { value: 'PLANNING', label: 'Chuẩn bị' }, { value: 'SELLING', label: 'Đang bán' }, { value: 'SOLD_OUT', label: 'Hết hàng' }, { value: 'CLOSED', label: 'Đã đóng' },
]
export const PRODUCT_STATUS: { value: ProductStatus; label: string }[] = [
  { value: 'AVAILABLE', label: 'Còn trống' }, { value: 'RESERVED', label: 'Đang giữ chỗ' }, { value: 'SOLD', label: 'Đã bán' },
]
export const PRODUCT_TYPE: { value: ProductType; label: string }[] = [
  { value: 'APARTMENT', label: 'Căn hộ' }, { value: 'LAND', label: 'Đất nền' }, { value: 'TOWNHOUSE', label: 'Nhà phố' },
]
export const DIRECTION: { value: Direction; label: string }[] = [
  { value: 'N', label: 'Bắc' }, { value: 'S', label: 'Nam' }, { value: 'E', label: 'Đông' }, { value: 'W', label: 'Tây' },
  { value: 'NE', label: 'Đông Bắc' }, { value: 'NW', label: 'Tây Bắc' }, { value: 'SE', label: 'Đông Nam' }, { value: 'SW', label: 'Tây Nam' },
]
export const labelOf = (items: { value: string; label: string }[], value: string | null) => items.find((item) => item.value === value)?.label ?? value ?? '—'

const projectsKey = ['projects']
export function useProjects(params: { status?: ProjectStatus; investor?: string; keyword?: string; page?: number; size?: number; sort?: string }) {
  return useQuery({ queryKey: [...projectsKey, params], queryFn: () => api.get<Page<Project>>('/projects', { params }).then((r) => r.data) })
}
export function useProject(id?: string) {
  return useQuery({ queryKey: [...projectsKey, id], enabled: Boolean(id), queryFn: () => api.get<Project>(`/projects/${id}`).then((r) => r.data) })
}
export function useProjectProducts(projectId?: string, params: ProductFilters = {}) {
  return useQuery({ queryKey: ['products', projectId, params], enabled: Boolean(projectId), queryFn: () => api.get<Page<Product>>('/products', { params: { projectId, ...params } }).then((r) => r.data) })
}
/** 9.16: danh sách product toàn hệ thống — cùng endpoint /projects/:id sử dụng. */
export function useProducts(params: ProductFilters = {}) {
  return useQuery({ queryKey: ['products', 'all', params], queryFn: () => api.get<Page<Product>>('/products', { params }).then((r) => r.data) })
}
/** 9.16 KPI: backend chưa có endpoint tổng hợp nên đếm bằng totalElements của chính /products
 *  (size=1 để không tải nội dung). Số liệu luôn từ API, không hardcode. */
export function useProductTotal(params: ProductFilters = {}) {
  return useQuery({ queryKey: ['products', 'total', params], queryFn: () => api.get<Page<Product>>('/products', { params: { ...params, page: 0, size: 1 } }).then((r) => r.data?.totalElements ?? 0) })
}
export function useProjectMutations() {
  const qc = useQueryClient(); const done = () => void qc.invalidateQueries({ queryKey: projectsKey })
  return {
    create: useMutation({ mutationFn: (body: ProjectInput) => api.post<Project>('/projects', body).then((r) => r.data), onSuccess: done }),
    update: useMutation({ mutationFn: ({ id, body }: { id: UUID; body: ProjectInput }) => api.patch<Project>(`/projects/${id}`, body).then((r) => r.data), onSuccess: done }),
    remove: useMutation({ mutationFn: (id: UUID) => api.delete(`/projects/${id}`), onSuccess: done }),
    uploadProjectImage: useMutation({ mutationFn: ({ id, file }: { id: UUID; file: File }) => { const data = new FormData(); data.append('image', file); return api.post<Project>(`/projects/${id}/image`, data).then((r) => r.data) }, onSuccess: done }),
    createProduct: useMutation({ mutationFn: (body: ProductInput) => api.post<Product>('/products', body).then((r) => r.data), onSuccess: () => void qc.invalidateQueries({ queryKey: ['products'] }) }),
    updateProduct: useMutation({ mutationFn: ({ id, body }: { id: UUID; body: ProductInput }) => api.patch<Product>(`/products/${id}`, body).then((r) => r.data), onSuccess: () => void qc.invalidateQueries({ queryKey: ['products'] }) }),
    removeProduct: useMutation({ mutationFn: (id: UUID) => api.delete(`/products/${id}`), onSuccess: () => void qc.invalidateQueries({ queryKey: ['products'] }) }),
    uploadProductImage: useMutation({ mutationFn: ({ id, file }: { id: UUID; file: File }) => { const data = new FormData(); data.append('image', file); return api.post<Product>(`/products/${id}/image`, data).then((r) => r.data) }, onSuccess: () => void qc.invalidateQueries({ queryKey: ['products'] }) }),
  }
}
/** 9.16: /products dùng chung mutation của dự án — tách tên để gọi rõ ý ở màn danh sách product. */
export const useProductMutations = useProjectMutations

export function apiErrorMessage(e: unknown) {
  const err = e as { response?: { status?: number; data?: { detail?: string; message?: string } } }; const detail = err.response?.data?.detail ?? err.response?.data?.message
  if (err.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này'
  if (err.response?.status === 404) return 'Không tìm thấy dữ liệu'
  if (err.response?.status === 409) return detail ?? 'Dữ liệu đang được liên kết, không thể xoá'
  return detail ?? 'Có lỗi xảy ra, vui lòng thử lại'
}
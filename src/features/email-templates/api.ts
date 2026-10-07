import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Page, UUID } from '@/types/api'

/**
 * Mẫu email — shape THẬT của customer-service (EmailTemplateResponse.java).
 * Endpoint: GET /email-templates (Page, lọc category|status|keyword), GET /email-templates/{id},
 * POST (CreateEmailTemplateRequest), PATCH (UpdateEmailTemplateRequest: field null = giữ nguyên),
 * DELETE. Read: mọi vai trò. Ghi: ADMIN/MANAGER (chặn ở service).
 * Backend KHÔNG có endpoint lịch sử gửi/analytics → module không dựng màn hiệu suất.
 */
export type EmailTemplateCategory = 'WELCOME' | 'FOLLOW_UP' | 'PROMOTION' | 'CONTRACT'
export type EmailTemplateStatus = 'ACTIVE' | 'INACTIVE'

export interface EmailTemplate {
  id: UUID
  name: string
  subject: string
  /** HTML của email — render trong iframe sandbox ở modal xem trước. */
  body: string
  category: EmailTemplateCategory
  status: EmailTemplateStatus
  createdBy: UUID | null
  createdAt: string
  updatedAt: string
}

export interface EmailTemplateFilters {
  category?: EmailTemplateCategory
  status?: EmailTemplateStatus
  keyword?: string
  page?: number
  size?: number
}

/** Thân request ghi (Create/Update DTO). PATCH: field bỏ trống = giữ nguyên giá trị cũ. */
export interface EmailTemplateInput {
  name?: string
  subject?: string
  body?: string
  category?: EmailTemplateCategory
  status?: EmailTemplateStatus
}

export const EMAIL_TEMPLATE_CATEGORY: { value: EmailTemplateCategory; label: string }[] = [
  { value: 'WELCOME', label: 'Chào mừng' },
  { value: 'FOLLOW_UP', label: 'Theo dõi' },
  { value: 'PROMOTION', label: 'Khuyến mãi' },
  { value: 'CONTRACT', label: 'Hợp đồng' },
]
export const EMAIL_TEMPLATE_STATUS: { value: EmailTemplateStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Đang dùng' },
  { value: 'INACTIVE', label: 'Ngừng dùng' },
]
export const categoryLabel = (c: string | null) =>
  EMAIL_TEMPLATE_CATEGORY.find((x) => x.value === c)?.label ?? c ?? '—'
export const statusLabel = (s: string | null) =>
  EMAIL_TEMPLATE_STATUS.find((x) => x.value === s)?.label ?? s ?? '—'

const KEY = ['email-templates']

export function useEmailTemplates(params: EmailTemplateFilters = {}) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => api.get<Page<EmailTemplate>>('/email-templates', { params }).then((r) => r.data),
  })
}

/** 9.12: chi tiết 1 mẫu — nguồn chuẩn cho modal xem trước (không đọc body từ row của bảng). */
export function useEmailTemplate(id?: UUID) {
  return useQuery({
    queryKey: [...KEY, id],
    enabled: Boolean(id),
    retry: false,
    queryFn: () => api.get<EmailTemplate>(`/email-templates/${id}`).then((r) => r.data),
  })
}

/** 9.12 KPI: backend chưa có endpoint tổng hợp nên đếm bằng totalElements của chính
 *  GET /email-templates (size=1 để không tải nội dung). Số liệu luôn từ API, không hardcode. */
export function useEmailTemplateTotals() {
  const scopes: (EmailTemplateFilters | Record<string, never>)[] = [{}, { status: 'ACTIVE' }, { status: 'INACTIVE' }]
  const results = useQueries({
    queries: scopes.map((params) => ({
      queryKey: [...KEY, 'total', params],
      queryFn: () =>
        api.get<Page<EmailTemplate>>('/email-templates', { params: { ...params, page: 0, size: 1 } })
          .then((r) => r.data?.totalElements ?? 0),
    })),
  })
  return {
    all: results[0]?.data ?? 0,
    active: results[1]?.data ?? 0,
    inactive: results[2]?.data ?? 0,
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
  }
}

/** Ghi mẫu email: POST tạo, PATCH cập nhật (field bỏ trống giữ nguyên), DELETE xóa. */
export function useEmailTemplateMutations() {
  const qc = useQueryClient()
  const done = () => void qc.invalidateQueries({ queryKey: KEY })
  return {
    create: useMutation({
      mutationFn: (body: EmailTemplateInput) => api.post<EmailTemplate>('/email-templates', body).then((r) => r.data),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: UUID; body: EmailTemplateInput }) =>
        api.patch<EmailTemplate>(`/email-templates/${id}`, body).then((r) => r.data),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (id: UUID) => api.delete(`/email-templates/${id}`),
      // Xoá hẳn cache của mẫu vừa xoá: invalidate sẽ khiến trang chi tiết gọi lại id đã chết → 404.
      onSuccess: (_data, id) => {
        qc.removeQueries({ queryKey: [...KEY, id] })
        done()
      },
    }),
  }
}

/** Câu lỗi tiếng Việt từ ApiExceptionHandler của customer-service */
export function apiErrorMessage(e: unknown) {
  const err = e as { response?: { status?: number; data?: { detail?: string; message?: string } } }
  const detail = err.response?.data?.detail ?? err.response?.data?.message
  if (err.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này'
  if (err.response?.status === 404) return 'Không tìm thấy mẫu email'
  if (err.response?.status === 400) return detail ?? 'Dữ liệu chưa hợp lệ, vui lòng kiểm tra lại'
  return detail ?? 'Có lỗi xảy ra, vui lòng thử lại'
}
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { api } from '@/api/client'
import type { Page, UUID } from '@/types/api'
import { tokens as t } from '@/theme/tokens'

export type { UUID }

export type AppointmentStatus = 'PENDING' | 'DONE' | 'CANCELLED'

export interface Appointment {
  id: UUID
  customerId: UUID
  salesId: UUID
  title: string
  startTime: string
  endTime: string
  color: string | null
  reminderMinutes: number | null
  status: AppointmentStatus
  reminderSentAt?: string | null

}

export interface AppointmentInput {
  customerId?: UUID
  title: string
  startTime: string
  endTime: string
  color?: string | null
  reminderMinutes?: number | null
  salesId?: UUID | null
  status?: AppointmentStatus
}

export const APPOINTMENT_STATUS: { value: AppointmentStatus; label: string }[] = [
  { value: 'PENDING', label: 'Chờ diễn ra' },
  { value: 'DONE', label: 'Đã hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]
export const statusLabel = (s: string) => APPOINTMENT_STATUS.find((x) => x.value === s)?.label ?? s

export const EVENT_COLORS = [
  { value: '#16A34A', label: 'Xanh lá (mặc định)' },
  { value: '#0D9488', label: 'Xanh ngọc' },
  { value: '#0EA5E9', label: 'Xanh dương' },
  { value: '#8B5CF6', label: 'Tím' },
  { value: '#F59E0B', label: 'Hổ phách' },
  { value: '#EF4444', label: 'Đỏ' },
]

export const eventColor = (color: string | null | undefined) =>
  /^#[0-9a-fA-F]{6}$/.test(color ?? '') ? (color as string) : t.colorBrand

const REMINDERS = [0, 15, 30, 60, 120, 240, 1440]
export const REMINDER_OPTIONS = REMINDERS.map((m) => ({
  value: m,
  label: m === 0 ? 'Không nhắc' : m < 60 ? `Trước ${m} phút` : `Trước ${m / 60} giờ`,
}))
export const reminderLabel = (m: number | null | undefined) =>
  m == null ? '—' : (REMINDER_OPTIONS.find((r) => r.value === m)?.label ?? `Trước ${m} phút`)

export const appointmentCode = (a: Pick<Appointment, 'id' | 'startTime'>) =>
  `APT-${dayjs(a.startTime).format('YYYYMMDD')}-${a.id.replace(/-/g, '').slice(0, 4).toUpperCase()}`

export interface AppointmentFilters {
  from: string
  to: string
  status?: AppointmentStatus
  salesId?: UUID
  customerId?: UUID
}

const KEY = ['appointments']

export function useAppointments(filters: AppointmentFilters) {
  return useQuery({
    queryKey: [...KEY, 'list', filters],
    queryFn: () =>
      api
        .get<Page<Appointment>>('/appointments', { params: { ...filters, size: 500, sort: 'startTime,asc' } })
        .then((r) => r.data),
  })
}

export function useAppointment(id?: UUID) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: () => api.get<Appointment>(`/appointments/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  })
}

export function useAppointmentMutations() {
  const qc = useQueryClient()
  const done = () => {
    void qc.invalidateQueries({ queryKey: KEY })
    void qc.invalidateQueries({ queryKey: ['appointment'] })
  }
  return {
    create: useMutation({
      mutationFn: (body: AppointmentInput) => api.post<Appointment>('/appointments', body).then((r) => r.data),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: UUID; body: Partial<AppointmentInput> }) =>
        api.patch<Appointment>(`/appointments/${id}`, body).then((r) => r.data),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (id: UUID) => api.delete(`/appointments/${id}`),
      onSuccess: done,
    }),
  }
}

export function apiErrorMessage(e: unknown) {
  const err = e as { response?: { status?: number; data?: { detail?: string; message?: string } } }
  const detail = err.response?.data?.detail ?? err.response?.data?.message
  const status = err.response?.status
  if (status === 409) return 'Khung giờ này đã có lịch hẹn khác, vui lòng chọn giờ khác'
  if (status === 400) {
    if (detail?.includes('endTime')) return 'Thời gian kết thúc phải sau thời gian bắt đầu'
    if (detail?.includes('startTime')) return 'Thời gian bắt đầu phải ở tương lai'
    return detail ?? 'Dữ liệu lịch hẹn không hợp lệ'
  }
  if (status === 403) return 'Bạn không có quyền với lịch hẹn này'
  if (status === 404) return 'Không tìm thấy lịch hẹn'
  return detail ?? 'Có lỗi xảy ra, vui lòng thử lại'
}

export const wallClock = (d: Dayjs) => d.format('YYYY-MM-DDTHH:mm:ss')

export const startOfWeek = (d: Dayjs = dayjs()) => d.startOf('day').subtract((d.day() + 6) % 7, 'day')
export const weekDays = (weekStart: Dayjs): Dayjs[] => Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'))
export const weekRange = (weekStart: Dayjs) => ({
  from: wallClock(weekStart),
  to: wallClock(weekStart.add(7, 'day')),
})

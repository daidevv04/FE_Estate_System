import dayjs from 'dayjs'

const nf = new Intl.NumberFormat('vi-VN')

/** 5200000000 -> "5.200.000.000" */
export const formatNumber = (v: number | null | undefined) => (v == null ? '—' : nf.format(v))

/** 5200000000 -> "5.200.000.000 ₫" */
export const formatMoney = (v: number | null | undefined) => (v == null ? '—' : `${nf.format(v)} ₫`)

/** 5200000000 -> "5,2 tỷ" (chỉ dùng cho KPI) */
export const formatMoneyShort = (v: number | null | undefined) => {
  if (v == null) return '—'
  if (Math.abs(v) >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1).replace('.', ',')} tỷ`
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(0)} triệu`
  return nf.format(v)
}

export const formatDate = (v: string | null | undefined) => (v ? dayjs(v).format('DD/MM/YYYY') : '—')
export const formatDateTime = (v: string | null | undefined) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—')

/** Backend nhận LocalDateTime UTC KHÔNG kèm 'Z'/offset — xem mục 20 của docs/UI_DESIGN_PROMPT.md */
export const toUtcString = (d: dayjs.Dayjs | Date) => dayjs(d).toISOString().slice(0, 19)

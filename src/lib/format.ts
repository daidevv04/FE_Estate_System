import dayjs from 'dayjs'

const nf = new Intl.NumberFormat('vi-VN')

export const formatNumber = (v: number | null | undefined) => (v == null ? '—' : nf.format(v))

export const formatMoney = (v: number | null | undefined) => (v == null ? '—' : `${nf.format(v)} ₫`)

export const formatMoneyShort = (v: number | null | undefined) => {
  if (v == null) return '—'
  if (v === 0) return '0 ₫'
  if (Math.abs(v) >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1).replace(/\.0$/, '').replace('.', ',')} tỷ`
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(0)} triệu`
  return `${nf.format(v)} ₫`
}

export const formatDate = (v: string | null | undefined) => (v ? dayjs(v).format('DD/MM/YYYY') : '—')
export const formatDateTime = (v: string | null | undefined) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—')

export const toUtcString = (d: dayjs.Dayjs | Date) => dayjs(d).toISOString().slice(0, 19)

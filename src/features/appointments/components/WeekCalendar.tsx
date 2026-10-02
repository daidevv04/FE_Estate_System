import { Popover, Tooltip } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { tokens as t } from '@/theme/tokens'
import { eventColor, statusLabel, type Appointment, type UUID } from '../api'

const HOUR_H = 56
const GUTTER_W = 62
const MIN_DAY_W = 140
/** Bề ngang tối thiểu 1 thẻ lịch để thời gian + tên khách vẫn đọc được khi có lịch trùng giờ */
const MIN_CARD_W = 64
/** Trần bề ngang cột ngày: tránh 1 cụm trùng giờ làm lịch dài bất thường */
const MAX_DAY_W = 260
const DEFAULT_FROM_H = 7
const DEFAULT_TO_H = 20
const MIN_SPAN = 6
/** Trần số cột thẻ song song trong 1 cụm trùng giờ; phần vượt gom vào chip "+N" có popover */
const MAX_LANES = 3
/**
 * Trần chiều cao thẻ lịch (3 giờ = 168px). Lịch đặt dài (cả buổi/cả ngày) nếu vẽ đúng tỉ lệ sẽ
 * thành khối cao gấp mấy lần khung nhìn, đẩy cả lưới xuống dưới. Giờ thật vẫn ghi đủ trên thẻ
 * (03:04 – 15:37) và trong tooltip; thẻ chỉ dài tối đa 3 giờ, vạch đứt ở đáy báo còn kéo dài.
 * ponytail: hằng số theo design (HOUR_H). Cần zoom lên/xuống thì đổi tỉ lệ thay vì bỏ trần.
 */
const MAX_EVENT_H = 3 * HOUR_H
const WEEKDAY = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

interface Props {
  days: Dayjs[]
  appointments: Appointment[]
  customerName: (id: UUID) => string
  salesName: (id: UUID) => string
  onOpen: (a: Appointment) => void
  /** Click ô trống → mở form tạo lịch với đúng ngày/giờ vừa click */
  onCreateAt: (start: Dayjs) => void
}

interface Placed {
  item: Appointment & { start: number; end: number }
  lane: number
  lanes: number
}

/**
 * Xếp lịch trùng giờ thành cột song song: cụm = các lịch nối tiếp nhau về thời gian,
 * trong cụm mỗi lịch vào làn trống đầu tiên. Số làn của cụm = bề rộng chia đều.
 */
function layoutDay(items: (Appointment & { start: number; end: number })[]): Placed[] {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end)
  const out: Placed[] = []
  let cluster: { item: Appointment & { start: number; end: number }; lane: number }[] = []
  let clusterEnd = -Infinity
  const flush = () => {
    if (!cluster.length) return
    const lanes = Math.max(...cluster.map((c) => c.lane)) + 1
    for (const c of cluster) out.push({ item: c.item, lane: c.lane, lanes })
    cluster = []
  }
  for (const a of sorted) {
    if (cluster.length && a.start >= clusterEnd) {
      flush()
      clusterEnd = -Infinity
    }
    const used = new Set(cluster.map((c) => c.lane))
    let lane = 0
    while (used.has(lane)) lane += 1
    cluster.push({ item: a, lane })
    clusterEnd = Math.max(clusterEnd, a.end)
  }
  flush()
  return out
}

const hhmm = (d: Dayjs) => d.format('HH:mm')

/** Chi tiết trong tooltip — không nhồi hết vào thẻ để thẻ vẫn đọc được ở khung giờ ngắn */
function EventTooltip({ a, customer, sales }: { a: Appointment; customer: string; sales: string }) {
  return (
    <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
      <div style={{ fontWeight: 600 }}>{a.title}</div>
      <div>
        {hhmm(dayjs(a.startTime))} – {hhmm(dayjs(a.endTime))} · {dayjs(a.startTime).format('DD/MM/YYYY')}
      </div>
      <div>Khách hàng: {customer}</div>
      <div>Phụ trách: {sales}</div>
      <div>Trạng thái: {statusLabel(a.status)}</div>
    </div>
  )
}

function EventCard({
  a, top, height, left, width, customer, sales, onOpen,
}: {
  a: Appointment; top: number; height: number; left: string; width: string
  customer: string; sales: string; onOpen: (a: Appointment) => void
}) {
  const color = eventColor(a.color)
  const cancelled = a.status === 'CANCELLED'
  const tone = a.status === 'DONE' ? t.colorSuccess : cancelled ? t.colorTextMuted : color
  const tall = height >= 62
  const clipped = height >= MAX_EVENT_H - 1
  return (
    <Tooltip mouseEnterDelay={0.3} title={<EventTooltip a={a} customer={customer} sales={sales} />}>
      <button
        type="button"
        className={`cal-event${clipped ? ' cal-event--clipped' : ''}`}
        aria-label={`${a.title} — ${hhmm(dayjs(a.startTime))} đến ${hhmm(dayjs(a.endTime))}, khách ${customer}, ${statusLabel(a.status)}`}
        onClick={() => onOpen(a)}
        style={{
          top, height, left, width,
          borderLeftColor: tone,
          background: `${color}14`,
          opacity: cancelled ? 0.72 : 1,
        }}
      >
        <span className="cal-event__time">
          {hhmm(dayjs(a.startTime))} – {hhmm(dayjs(a.endTime))}
        </span>
        <span className="cal-event__title" style={{ textDecoration: cancelled ? 'line-through' : 'none' }}>
          {a.title}
        </span>
        <span className="cal-event__meta" style={{ display: tall ? 'block' : 'none' }}>
          {customer} · {sales}
        </span>
      </button>
    </Tooltip>
  )
}

export function WeekCalendar({ days, appointments, customerName, salesName, onOpen, onCreateAt }: Props) {
  const [now, setNow] = useState(() => dayjs())
  // Đường thời gian hiện tại tự nhích theo phút, không cần F5
  useEffect(() => {
    const id = window.setInterval(() => setNow(dayjs()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const { fromH, toH } = useMemo(() => {
    if (!appointments.length) return { fromH: DEFAULT_FROM_H, toH: DEFAULT_TO_H }
    // Luôn bao trọn lịch đang có để KHÔNG cắt mất lịch ngoài khung giờ mặc định
    const minStart = Math.min(...appointments.map((a) => dayjs(a.startTime).hour()))
    const maxEnd = Math.max(...appointments.map((a) => dayjs(a.endTime).hour() + (dayjs(a.endTime).minute() > 0 ? 1 : 0)))
    const fromH = Math.max(0, Math.min(DEFAULT_FROM_H, minStart))
    const toH = Math.min(24, Math.max(DEFAULT_TO_H, maxEnd, fromH + MIN_SPAN))
    return { fromH, toH }
  }, [appointments])

  const startMin = fromH * 60
  const endMin = toH * 60
  const y = (min: number) => ((min - startMin) / 60) * HOUR_H

  const byDay = useMemo(() => {
    const map = new Map<string, Placed[]>()
    for (const d of days) {
      const key = d.format('YYYY-MM-DD')
      const items = appointments
        .filter((a) => dayjs(a.startTime).format('YYYY-MM-DD') === key)
        .map((a) => ({ ...a, start: dayjs(a.startTime).valueOf(), end: dayjs(a.endTime).valueOf() }))
      map.set(key, layoutDay(items))
    }
    return map
  }, [appointments, days])

  const hours = useMemo(() => Array.from({ length: toH - fromH }, (_, i) => fromH + i), [fromH, toH])
  /**
   * Cột ngày nở ra theo số làn trùng giờ nhiều nhất trong tuần: cụm 3 lịch vẫn phải
   * để mỗi thẻ ≥ MIN_CARD_W. Khi vượt bề ngang khung thì .cal tự cuộn ngang.
   */
  const dayMinW = useMemo(() => {
    const maxLanes = Math.max(1, ...[...byDay.values()].flat().map((p) => p.lanes))
    return Math.min(MAX_DAY_W, Math.max(MIN_DAY_W, maxLanes * (MIN_CARD_W + 6) + 6))
  }, [byDay])
  const todayKey = dayjs().format('YYYY-MM-DD')
  const nowMin = now.hour() * 60 + now.minute()

  const slotFromClick = (day: Dayjs, e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const minutes = startMin + ((e.clientY - rect.top) / HOUR_H) * 60
    // Làm tròn 30 phút cho dễ chọn, đúng giờ tường (không đổi múi giờ)
    const rounded = Math.max(startMin, Math.min(endMin - 30, Math.round(minutes / 30) * 30))
    return day.startOf('day').add(rounded, 'minute')
  }

  return (
    <div className="cal">
      <div className="cal__inner" style={{ minWidth: GUTTER_W + days.length * dayMinW }}>
        <div className="cal__head" style={{ gridTemplateColumns: `${GUTTER_W}px repeat(${days.length}, 1fr)` }}>
          <div className="cal__gutter-head" />
          {days.map((d, i) => {
            const isToday = d.format('YYYY-MM-DD') === todayKey
            return (
              <div key={d.format('YYYY-MM-DD')} className={`cal__day-head${isToday ? ' is-today' : ''}`}>
                <span className="cal__dow">{WEEKDAY[i]}</span>
                <span className="cal__date stitch-num">{d.format('DD/MM')}</span>
              </div>
            )
          })}
        </div>

        <div
          className="cal__body"
          style={{
            gridTemplateColumns: `${GUTTER_W}px repeat(${days.length}, 1fr)`,
            height: (toH - fromH) * HOUR_H,
            backgroundImage: `repeating-linear-gradient(to bottom, ${t.colorBorder} 0 1px, transparent 1px ${HOUR_H}px)`,
            backgroundPosition: `0 0`,
          }}
        >
          <div className="cal__gutter">
            {hours.map((h) => (
              <div key={h} className="cal__hour stitch-num" style={{ height: HOUR_H }}>
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {days.map((d) => {
            const key = d.format('YYYY-MM-DD')
            const placed = byDay.get(key) ?? []
            const isToday = key === todayKey
            // Cụm ≤ MAX_LANES làn thì hiện ĐỦ thẻ (cột ngày đã nở đủ rộng để mỗi thẻ ≥ MIN_CARD_W).
            // Nhiều làn hơn thì giữ MAX_LANES-1 thẻ đọc được, gom phần còn lại vào chip "+N lịch".
            const fitsAll = placed.every((p) => p.lanes <= MAX_LANES)
            const shownLanes = Math.max(1, MAX_LANES - 1)
            const stackLanes = placed.length ? Math.max(...placed.map((p) => p.lanes)) : 1
            const shown = fitsAll ? placed : placed.filter((p) => p.lane < shownLanes)
            const stacked = fitsAll ? [] : placed.filter((p) => p.lane >= shownLanes)
            return (
              <div key={key} className={`cal__col${isToday ? ' is-today' : ''}`}>
                <button
                  type="button"
                  className="cal__slot"
                  aria-label={`Tạo lịch hẹn ngày ${d.format('DD/MM/YYYY')}`}
                  onClick={(e) => onCreateAt(slotFromClick(d, e))}
                />

                {isToday && nowMin >= startMin && nowMin <= endMin && (
                  <div className="cal__now" style={{ top: y(nowMin) }} aria-hidden>
                    <span className="cal__now-dot" />
                  </div>
                )}

                {shown.map((p) => (
                  <EventCard
                    key={p.item.id}
                    a={p.item}
                    top={y((p.item.start - dayjs(d).startOf('day').valueOf()) / 60_000)}
                    height={Math.min(MAX_EVENT_H, Math.max(30, ((p.item.end - p.item.start) / 60_000 / 60) * HOUR_H - 2))}
                    left={`calc(${(p.lane / p.lanes) * 100}% + 3px)`}
                    width={`calc(${100 / p.lanes}% - 6px)`}
                    customer={customerName(p.item.customerId)}
                    sales={salesName(p.item.salesId)}
                    onOpen={onOpen}
                  />
                ))}

                {stacked.length > 0 && (
                  <Popover
                    trigger="click"
                    placement="right"
                    title={`${stacked.length} lịch trùng giờ`}
                    content={
                      <div style={{ maxWidth: 300, display: 'grid', gap: 4 }}>
                        {stacked.map((p) => (
                          <button
                            key={p.item.id}
                            type="button"
                            className="cal-popover-item"
                            onClick={() => onOpen(p.item)}
                          >
                            <span style={{ fontWeight: 600 }}>{hhmm(dayjs(p.item.startTime))}</span>
                            {' '}
                            {p.item.title}
                            <span style={{ color: t.colorTextMuted }}> · {customerName(p.item.customerId)}</span>
                          </button>
                        ))}
                      </div>
                    }
                  >
                    <button
                      type="button"
                      className="cal-event cal-event--stack"
                      style={{
                        top: y((Math.min(...stacked.map((p) => p.item.start)) - dayjs(d).startOf('day').valueOf()) / 60_000),
                        height: Math.min(
                          MAX_EVENT_H,
                          Math.max(
                            30,
                            y((Math.max(...stacked.map((p) => p.item.end)) - Math.min(...stacked.map((p) => p.item.start))) / 60_000),
                          ),
                        ),
                        left: `calc(${(shownLanes / stackLanes) * 100}% + 3px)`,
                        width: `calc(${((stackLanes - shownLanes) / stackLanes) * 100}% - 6px)`,
                      }}
                      aria-label={`Xem thêm ${stacked.length} lịch trùng giờ`}
                    >
                      <span className="cal-event__title">+{stacked.length} lịch</span>
                    </button>
                  </Popover>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="cal__hint">
        Bấm ô trống để thêm lịch hẹn · Bấm thẻ lịch để xem chi tiết · Lịch trùng giờ tự tách cột
        {appointments.some((a) => a.status === 'CANCELLED') ? ' · Thẻ gạch ngang là lịch đã hủy' : ''}
      </div>
    </div>
  )
}


import { Button, Popover, Tooltip } from 'antd'
import { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { tokens as t } from '@/theme/tokens'
import { eventColor, statusLabel, type Appointment, type UUID } from '../api'

const DEFAULT_HOUR_H = 56
const MIN_HOUR_H = 34
const MAX_HOUR_H = 110
const GUTTER_W = 62
const MIN_DAY_W = 140
const MIN_CARD_W = 64
const MAX_DAY_W = 260
const DEFAULT_FROM_H = 7
const DEFAULT_TO_H = 20
const MIN_SPAN = 6
const MAX_LANES = 3
const WEEKDAY = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const STORAGE_KEY = 'estate_crm_calendar_zoom'

function getSavedHourHeight(): number {
  try {
    const v = Number(localStorage.getItem(STORAGE_KEY))
    if (v >= MIN_HOUR_H && v <= MAX_HOUR_H) return v
  } catch {
    // ignore
  }
  return DEFAULT_HOUR_H
}

interface Props {
  days: Dayjs[]
  appointments: Appointment[]
  customerName: (id: UUID) => string
  salesName: (id: UUID) => string
  onOpen: (a: Appointment) => void
  onCreateAt: (start: Dayjs) => void
}

interface Placed {
  item: Appointment & { start: number; end: number }
  lane: number
  lanes: number
}

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
  a, top, height, left, width, customer, sales, onOpen, hourHeight,
}: {
  a: Appointment; top: number; height: number; left: string; width: string
  customer: string; sales: string; onOpen: (a: Appointment) => void; hourHeight: number
}) {
  const color = eventColor(a.color)
  const cancelled = a.status === 'CANCELLED'
  const tone = a.status === 'DONE' ? t.colorSuccess : cancelled ? t.colorTextMuted : color
  const maxEventH = 3 * hourHeight
  const clipped = height >= maxEventH - 1
  const showMeta = height >= 50
  const compact = height < 32
  return (
    <Tooltip mouseEnterDelay={0.3} title={<EventTooltip a={a} customer={customer} sales={sales} />}>
      <button
        type="button"
        className={`cal-event${clipped ? ' cal-event--clipped' : ''}${compact ? ' cal-event--compact' : ''}`}
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
        {showMeta && (
          <span className="cal-event__meta">
            {customer} · {sales}
          </span>
        )}
      </button>
    </Tooltip>
  )
}

export function WeekCalendar({ days, appointments, customerName, salesName, onOpen, onCreateAt }: Props) {
  const [now, setNow] = useState(() => dayjs())
  const [hourHeight, setHourHeight] = useState<number>(getSavedHourHeight)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(hourHeight))
    } catch {
      // ignore
    }
  }, [hourHeight])

  useEffect(() => {
    const id = window.setInterval(() => setNow(dayjs()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const { fromH, toH } = useMemo(() => {
    if (!appointments.length) return { fromH: DEFAULT_FROM_H, toH: DEFAULT_TO_H }
    const minStart = Math.min(...appointments.map((a) => dayjs(a.startTime).hour()))
    const maxEnd = Math.max(...appointments.map((a) => dayjs(a.endTime).hour() + (dayjs(a.endTime).minute() > 0 ? 1 : 0)))
    const fromH = Math.max(0, Math.min(DEFAULT_FROM_H, minStart))
    const toH = Math.min(24, Math.max(DEFAULT_TO_H, maxEnd, fromH + MIN_SPAN))
    return { fromH, toH }
  }, [appointments])

  const zoomIn = useCallback(() => {
    setHourHeight((h) => Math.min(MAX_HOUR_H, h + 8))
  }, [])

  const zoomOut = useCallback(() => {
    setHourHeight((h) => Math.max(MIN_HOUR_H, h - 8))
  }, [])

  const resetZoom = useCallback(() => {
    setHourHeight(DEFAULT_HOUR_H)
  }, [])

  const fitView = useCallback(() => {
    if (!containerRef.current) return
    const availableHeight = containerRef.current.clientHeight - 42
    const totalHours = toH - fromH
    if (totalHours <= 0) return
    const calculated = Math.floor(availableHeight / totalHours)
    setHourHeight(Math.max(MIN_HOUR_H, Math.min(MAX_HOUR_H, calculated)))
  }, [fromH, toH])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY < 0 ? 6 : -6
        setHourHeight((prev) => Math.min(MAX_HOUR_H, Math.max(MIN_HOUR_H, prev + delta)))
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const zoomPct = Math.round((hourHeight / DEFAULT_HOUR_H) * 100)
  const startMin = fromH * 60
  const endMin = toH * 60
  const y = (min: number) => ((min - startMin) / 60) * hourHeight

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
  const dayMinW = useMemo(() => {
    const maxLanes = Math.max(1, ...[...byDay.values()].flat().map((p) => p.lanes))
    return Math.min(MAX_DAY_W, Math.max(MIN_DAY_W, maxLanes * (MIN_CARD_W + 6) + 6))
  }, [byDay])
  const todayKey = dayjs().format('YYYY-MM-DD')
  const nowMin = now.hour() * 60 + now.minute()

  const slotFromClick = (day: Dayjs, e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const minutes = startMin + ((e.clientY - rect.top) / hourHeight) * 60
    const rounded = Math.max(startMin, Math.min(endMin - 30, Math.round(minutes / 30) * 30))
    return day.startOf('day').add(rounded, 'minute')
  }

  return (
    <div className="cal-wrapper">
      <div className="cal-toolbar">
        <div className="cal-toolbar__left">
          <span className="cal-toolbar__hint">
            💡 Mẹo: Giữ <b>Ctrl + Cuộn chuột</b> để phóng to / thu nhỏ
          </span>
        </div>
        <div className="cal-toolbar__zoom">
          <Tooltip title="Thu nhỏ (Ctrl + Cuộn xuống)">
            <Button
              size="small"
              icon={<ZoomOutOutlined />}
              disabled={hourHeight <= MIN_HOUR_H}
              onClick={zoomOut}
            />
          </Tooltip>
          <Tooltip title="Bấm để đặt lại kích thước gốc 100%">
            <Button
              size="small"
              onClick={resetZoom}
              className="cal-toolbar__pct"
            >
              {zoomPct}%
            </Button>
          </Tooltip>
          <Tooltip title="Phóng to (Ctrl + Cuộn lên)">
            <Button
              size="small"
              icon={<ZoomInOutlined />}
              disabled={hourHeight >= MAX_HOUR_H}
              onClick={zoomIn}
            />
          </Tooltip>
          <Tooltip title="Tự động thu phóng vừa vặn toàn bộ khung giờ làm việc vào màn hình">
            <Button
              size="small"
              onClick={fitView}
            >
              Vừa màn hình
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="cal" ref={containerRef}>
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
              height: (toH - fromH) * hourHeight,
              backgroundImage: hourHeight >= 72
                ? `repeating-linear-gradient(to bottom, ${t.colorBorder} 0 1px, transparent 1px ${hourHeight / 2}px, rgba(228, 231, 240, 0.45) ${hourHeight / 2}px ${hourHeight / 2 + 1}px, transparent ${hourHeight / 2 + 1}px ${hourHeight}px)`
                : `repeating-linear-gradient(to bottom, ${t.colorBorder} 0 1px, transparent 1px ${hourHeight}px)`,
              backgroundPosition: '0 0',
            }}
          >
            <div className="cal__gutter">
              {hours.map((h) => (
                <div key={h} className="cal__hour stitch-num" style={{ height: hourHeight, lineHeight: `${Math.min(24, hourHeight)}px` }}>
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {days.map((d) => {
              const key = d.format('YYYY-MM-DD')
              const placed = byDay.get(key) ?? []
              const isToday = key === todayKey
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

                  {shown.map((p) => {
                    const durationMin = (p.item.end - p.item.start) / 60_000
                    const eventH = Math.min(3 * hourHeight, Math.max(26, (durationMin / 60) * hourHeight - 2))
                    return (
                      <EventCard
                        key={p.item.id}
                        a={p.item}
                        top={y((p.item.start - dayjs(d).startOf('day').valueOf()) / 60_000)}
                        height={eventH}
                        left={`calc(${(p.lane / p.lanes) * 100}% + 3px)`}
                        width={`calc(${100 / p.lanes}% - 6px)`}
                        customer={customerName(p.item.customerId)}
                        sales={salesName(p.item.salesId)}
                        onOpen={onOpen}
                        hourHeight={hourHeight}
                      />
                    )
                  })}

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
                            3 * hourHeight,
                            Math.max(
                              26,
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
      </div>

      <div className="cal__hint">
        Bấm ô trống để thêm lịch hẹn · Bấm thẻ lịch để xem chi tiết · Lịch trùng giờ tự tách cột
        {appointments.some((a) => a.status === 'CANCELLED') ? ' · Thẻ gạch ngang là lịch đã hủy' : ''}
      </div>
    </div>
  )
}


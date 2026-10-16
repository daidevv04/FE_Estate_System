import React, { useCallback, useEffect, useRef, useState } from 'react'
import './SelectableTableContainer.css'

interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

function isIntersecting(a: Rect, b: Rect): boolean {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom)
}

export interface SelectableTableContainerProps<T = unknown> {
  children: React.ReactNode
  items?: T[]
  rowKey?: string | ((item: T) => string)
  selectedKeys: string[]
  onSelectionChange?: (keys: string[]) => void
  onSelectChange?: (keys: string[]) => void
  disabled?: boolean
  hintText?: string
}

export function SelectableTableContainer<T = unknown>({
  children,
  items,
  rowKey = 'id',
  selectedKeys,
  onSelectionChange,
  onSelectChange,
  disabled = false,
  hintText,
}: SelectableTableContainerProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [marquee, setMarquee] = useState<{
    left: number
    top: number
    width: number
    height: number
    visible: boolean
  }>({ left: 0, top: 0, width: 0, height: 0, visible: false })

  const isDraggingRef = useRef(false)
  const startPosRef = useRef({ x: 0, y: 0 })
  const lastClickedKeyRef = useRef<string | null>(null)

  const notifyChange = useCallback(
    (keys: string[]) => {
      if (onSelectionChange) onSelectionChange(keys)
      if (onSelectChange) onSelectChange(keys)
    },
    [onSelectionChange, onSelectChange],
  )

  const getKey = useCallback(
    (item: T): string => {
      if (typeof rowKey === 'function') return rowKey(item)
      return String((item as Record<string, unknown>)[rowKey] ?? '')
    },
    [rowKey],
  )

  // Shift + Click support
  const handleTableClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return
      const target = e.target as HTMLElement
      // Ignore clicks on buttons, links, inputs
      if (target.closest('button') || target.closest('a') || target.closest('input:not([type="checkbox"])')) {
        return
      }

      const row = target.closest('tr[data-row-key]') as HTMLTableRowElement | null
      if (!row) return

      const currentKey = row.getAttribute('data-row-key')
      if (!currentKey) return

      if (e.shiftKey && lastClickedKeyRef.current && lastClickedKeyRef.current !== currentKey) {
        let keysOrder: string[] = []
        if (items && items.length > 0) {
          keysOrder = items.map(getKey)
        } else if (containerRef.current) {
          const rows = containerRef.current.querySelectorAll<HTMLTableRowElement>('tbody tr.ant-table-row[data-row-key]')
          keysOrder = Array.from(rows).map((tr) => tr.getAttribute('data-row-key')).filter(Boolean) as string[]
        }

        const lastIdx = keysOrder.indexOf(lastClickedKeyRef.current)
        const curIdx = keysOrder.indexOf(currentKey)

        if (lastIdx !== -1 && curIdx !== -1) {
          e.preventDefault()
          const start = Math.min(lastIdx, curIdx)
          const end = Math.max(lastIdx, curIdx)
          const rangeKeys = keysOrder.slice(start, end + 1)
          const newSet = new Set(selectedKeys)
          rangeKeys.forEach((k) => newSet.add(k))
          notifyChange(Array.from(newSet))
          return
        }
      }

      lastClickedKeyRef.current = currentKey
    },
    [disabled, items, getKey, selectedKeys, notifyChange],
  )

  // Mouse Drag Marquee Selection
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || e.button !== 0) return

      const target = e.target as HTMLElement
      // Do not start drag if user clicked directly on interactive elements
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('.ant-select') ||
        target.closest('.ant-pagination') ||
        target.closest('.ant-table-header')
      ) {
        return
      }

      const container = containerRef.current
      if (!container) return

      startPosRef.current = { x: e.clientX, y: e.clientY }
      const isCtrl = e.ctrlKey || e.metaKey
      const initialSelection = isCtrl ? [...selectedKeys] : []

      const onMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startPosRef.current.x
        const dy = moveEvent.clientY - startPosRef.current.y
        const distance = Math.hypot(dx, dy)

        if (!isDraggingRef.current) {
          if (distance > 7) {
            isDraggingRef.current = true
            document.body.classList.add('selectable-table-no-select')
          } else {
            return
          }
        }

        const rect = container.getBoundingClientRect()
        const marqueeScreenRect: Rect = {
          left: Math.min(startPosRef.current.x, moveEvent.clientX),
          top: Math.min(startPosRef.current.y, moveEvent.clientY),
          right: Math.max(startPosRef.current.x, moveEvent.clientX),
          bottom: Math.max(startPosRef.current.y, moveEvent.clientY),
        }

        // Relative marquee coordinates for display inside container
        const localLeft = marqueeScreenRect.left - rect.left + container.scrollLeft
        const localTop = marqueeScreenRect.top - rect.top + container.scrollTop
        const localWidth = marqueeScreenRect.right - marqueeScreenRect.left
        const localHeight = marqueeScreenRect.bottom - marqueeScreenRect.top

        setMarquee({
          left: localLeft,
          top: localTop,
          width: localWidth,
          height: localHeight,
          visible: true,
        })

        // Find intersecting rows
        const rows = container.querySelectorAll<HTMLTableRowElement>('tbody tr.ant-table-row[data-row-key]')
        const hitKeys = new Set<string>()

        rows.forEach((tr) => {
          const rowRect = tr.getBoundingClientRect()
          if (isIntersecting(marqueeScreenRect, rowRect)) {
            const key = tr.getAttribute('data-row-key')
            if (key) hitKeys.add(key)
          }
        })

        const combined = Array.from(new Set([...initialSelection, ...hitKeys]))
        notifyChange(combined)
      }

      const onMouseUp = () => {
        isDraggingRef.current = false
        document.body.classList.remove('selectable-table-no-select')
        setMarquee((prev) => ({ ...prev, visible: false }))
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [disabled, selectedKeys, notifyChange],
  )

  useEffect(() => {
    return () => {
      document.body.classList.remove('selectable-table-no-select')
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="selectable-table-container"
      onMouseDown={handleMouseDown}
      onClick={handleTableClick}
    >
      {hintText && (
        <div className="selectable-table-hint">
          <span>{hintText}</span>
        </div>
      )}

      {children}

      {marquee.visible && (
        <div
          className="selectable-table-marquee"
          style={{
            left: marquee.left,
            top: marquee.top,
            width: marquee.width,
            height: marquee.height,
          }}
        />
      )}
    </div>
  )
}

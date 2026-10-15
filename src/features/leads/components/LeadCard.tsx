import { MoreOutlined, WarningOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import type { Customer } from '@/features/customers/api'
import {
  PRODUCT_TYPE_LABEL, avatarClass, fullVnd, initials, shortDate, shortName,
  type Lead, type Product, type Project,
} from '../api'

export interface CardActionItem {
  key: string
  label: ReactNode
  danger?: boolean
}

interface Props {
  lead: Lead
  customer?: Customer
  product?: Product
  project?: Project
  ownerName?: string
  overdue: number
  dragging: boolean
  actions: MenuProps['items']
  onAction: (key: string) => void
  onOpen: (lead: Lead) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
}

const productLabel = (lead: Lead, product?: Product, project?: Project) => {
  if (!product) return `Căn #${lead.productId.slice(0, 8)}`
  const unit = `${PRODUCT_TYPE_LABEL[product.type] ?? 'Căn'} ${product.code}`
  return project ? `${unit} · ${project.name}` : unit
}

let globalLastDragEndTime = 0

export function LeadCard({
  lead, customer, product, project, ownerName, overdue, dragging, actions, onAction, onOpen, onDragStart, onDragEnd,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuWrapRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const isLost = lead.stage === 'LOST'
  const cls = [
    'kb-card',
    isLost ? 'is-lost' : '',
    lead.stage === 'WON' ? 'is-won' : '',
    overdue > 0 ? 'is-overdue' : '',
    dragging ? 'is-dragging' : '',
  ].filter(Boolean).join(' ')

  const stop = (e: MouseEvent) => e.stopPropagation()

  useEffect(() => {
    if (!menuOpen) return
    const onDocClick = (e: globalThis.MouseEvent) => {
      if (menuWrapRef.current && !menuWrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('click', onDocClick)
    return () => {
      window.removeEventListener('click', onDocClick)
    }
  }, [menuOpen])

  return (
    <div
      className={cls}
      role="button"
      tabIndex={0}
      draggable
      aria-label={`${customer?.fullName ?? 'Khách hàng'} · ${fullVnd(lead.expectedValue)}`}
      onClick={(e) => {
        if (isDraggingRef.current || Date.now() - globalLastDragEndTime < 250) {
          e.preventDefault()
          e.stopPropagation()
          return
        }
        onOpen(lead)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(lead)
        }
      }}
      onDragStart={(e) => {
        isDraggingRef.current = true
        e.dataTransfer.setData('text/plain', lead.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(lead.id)
      }}
      onDragEnd={() => {
        globalLastDragEndTime = Date.now()
        setTimeout(() => {
          isDraggingRef.current = false
        }, 120)
        onDragEnd()
      }}
    >
      <div className="kb-card__top">
        <span className="kb-card__name">{customer?.fullName ?? `Khách #${lead.customerId.slice(0, 8)}`}</span>
        <div className="kb-card__more-wrap" ref={menuWrapRef} onClick={stop}>
          <button
            type="button"
            className="kb-card__more-btn"
            aria-label="Thao tác"
            onClick={(e) => {
              stop(e)
              setMenuOpen((v) => !v)
            }}
          >
            <MoreOutlined />
          </button>
          {menuOpen && (
            <div className="kb-card__menu" role="menu">
              {((actions ?? []) as CardActionItem[]).filter(Boolean).map((act) => (
                <button
                  key={act.key}
                  type="button"
                  role="menuitem"
                  className={`kb-card__menu-item${act.danger ? ' is-danger' : ''}`}
                  onClick={(e) => {
                    stop(e)
                    setMenuOpen(false)
                    onAction(act.key)
                  }}
                >
                  {act.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="kb-card__prod">{productLabel(lead, product, project)}</div>

      <div className="kb-card__row">
        <span className="kb-card__value">{fullVnd(lead.expectedValue)}</span>
        {isLost ? (
          <span className="kb-card__date is-cancelled">Hủy {shortDate(lead.updatedAt)}</span>
        ) : (
          <span className="kb-card__date">{shortDate(lead.closeDate)}</span>
        )}
      </div>

      {overdue > 0 && (
        <div className="kb-card__warn">
          <span className="kb-card__warn-txt"><WarningOutlined /> Quá hạn {overdue} ngày</span>
          <span className="kb-card__warn-date">{shortDate(lead.closeDate)}</span>
        </div>
      )}

      <div className="kb-card__foot">
        {customer?.source ? (
          <span className="kb-tag" title={`Nguồn khách hàng: ${customer.source}`}>{customer.source}</span>
        ) : (
          <span />
        )}
        <div className="kb-owner" title={`Phụ trách: ${ownerName ?? 'chưa rõ'}`}>
          <span className="kb-owner__name">{shortName(ownerName)}</span>
          <span className={`kb-ava ${avatarClass(lead.assignedTo)}`}>{initials(ownerName)}</span>
        </div>
      </div>
    </div>
  )
}

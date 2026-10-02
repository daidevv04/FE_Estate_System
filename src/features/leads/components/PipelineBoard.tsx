import { PlusOutlined } from '@ant-design/icons'
import type { DragEvent } from 'react'
import type { MenuProps } from 'antd'
import { useMemo, useState } from 'react'
import type { Customer } from '@/features/customers/api'
import {
  LEAD_STAGES, STAGE_CLASS, STAGE_LABEL, compactVnd, nextStage, overdueDays, stageIndex,
  type Lead, type LeadStage, type Product, type Project, type UUID,
} from '../api'
import { LeadCard } from './LeadCard'

/** Số thẻ hiện đủ trong 1 cột trước khi gom phần còn lại vào nút "+N cơ hội khác" (như thiết kế) */
const VISIBLE = 3

interface Props {
  groups: Record<LeadStage, Lead[]>
  customerById: Map<UUID, Customer>
  productById: Map<UUID, Product>
  projectById: Map<UUID, Project>
  ownerName: (id: UUID) => string
  canDrag: boolean
  onOpen: (lead: Lead) => void
  onMove: (lead: Lead, stage: LeadStage) => void
  onAdvance: (lead: Lead) => void
  onLose: (lead: Lead) => void
  onDetail: (lead: Lead) => void
}

/** Bảng kanban 8 giai đoạn — cột 280px cố định, thiếu ngang thì cuộn, KHÔNG co cột */
export function PipelineBoard({
  groups, customerById, productById, projectById, ownerName, canDrag,
  onOpen, onMove, onAdvance, onLose, onDetail,
}: Props) {
  const [expanded, setExpanded] = useState<Partial<Record<LeadStage, boolean>>>({})
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<LeadStage | null>(null)

  const totals = useMemo(() => {
    const out = {} as Record<LeadStage, number>
    for (const s of LEAD_STAGES) out[s] = groups[s].reduce((sum, l) => sum + (l.expectedValue ?? 0), 0)
    return out
  }, [groups])

  const dropOn = (e: DragEvent, stage: LeadStage) => {
    e.preventDefault()
    setOverStage(null)
    const id = e.dataTransfer.getData('text/plain')
    const lead = Object.values(groups).flat().find((l) => l.id === id)
    if (lead && lead.stage !== stage) onMove(lead, stage)
  }

  return (
    <div className="kb-scroll">
      <div className="kb__track">
        {LEAD_STAGES.map((stage) => {
          const list = groups[stage]
          const cls = STAGE_CLASS[stage]
          const showAll = expanded[stage] || list.length <= VISIBLE
          const shown = showAll ? list : list.slice(0, VISIBLE)
          const hidden = list.length - shown.length

          return (
            <div
              key={stage}
              className={`kb-col ${cls}${overStage === stage && draggingId ? ' is-over' : ''}`}
              onDragOver={(e) => {
                if (!canDrag || !draggingId) return
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                if (overStage !== stage) setOverStage(stage)
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverStage(null)
              }}
              onDrop={(e) => dropOn(e, stage)}
            >
              <div className="kb-col__head">
                <div className="kb-col__id">
                  <span className={`kb-dot ${cls}`} />
                  <span className="kb-col__name">{stageIndex(stage)}. {STAGE_LABEL[stage]}</span>
                  <span className={`kb-count ${cls}`}>{list.length}</span>
                </div>
                <span className="kb-col__total">{compactVnd(totals[stage])}</span>
              </div>

              <div className="kb-col__list">
                {list.length === 0 && <div className="kb-col__empty">Chưa có lead ở bước này</div>}

                {shown.map((lead) => {
                  const upstream = nextStage(lead.stage)
                  const actions: MenuProps['items'] = [
                    ...(upstream !== lead.stage
                      ? [{ key: 'next', label: `Chuyển sang «${STAGE_LABEL[upstream]}»` }]
                      : []),
                    ...(lead.stage !== 'LOST' ? [{ key: 'lost', label: 'Chuyển sang «Mất»', danger: true }] : []),
                    { key: 'detail', label: 'Mở trang chi tiết lead' },
                  ]
                  return (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      customer={customerById.get(lead.customerId)}
                      product={productById.get(lead.productId)}
                      project={projectById.get(productById.get(lead.productId)?.projectId ?? '')}
                      ownerName={ownerName(lead.assignedTo)}
                      overdue={overdueDays(lead)}
                      dragging={draggingId === lead.id}
                      actions={actions}
                      onAction={(key) => {
                        if (key === 'next') onAdvance(lead)
                        else if (key === 'lost') onLose(lead)
                        else onDetail(lead)
                      }}
                      onOpen={onOpen}
                      onDragStart={setDraggingId}
                      onDragEnd={() => {
                        setDraggingId(null)
                        setOverStage(null)
                      }}
                    />
                  )
                })}

                {hidden > 0 && (
                  <button
                    type="button"
                    className={`kb-col__more${cls === 'is-lost' ? ' is-lost' : ''}`}
                    onClick={() => setExpanded((prev) => ({ ...prev, [stage]: true }))}
                  >
                    <PlusOutlined style={{ fontSize: 12 }} />
                    <span>+ {hidden} cơ hội khác trong bước này</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

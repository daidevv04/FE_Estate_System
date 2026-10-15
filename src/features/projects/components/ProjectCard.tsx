import {
  ArrowRightOutlined, BankOutlined, CalendarOutlined, DeleteOutlined,
  EditOutlined, EnvironmentOutlined,
} from '@ant-design/icons'
import { Button, Card, Typography } from 'antd'
import { formatDate } from '@/lib/format'
import type { Project, ProjectStatus } from '../api'

const STATUS_BADGE: Record<ProjectStatus, { bg: string; text: string; dot: string; label: string }> = {
  PLANNING: { bg: 'rgba(254, 243, 199, 0.94)', text: '#92400e', dot: '#f59e0b', label: 'Chuẩn bị' },
  SELLING: { bg: 'rgba(220, 252, 231, 0.94)', text: '#166534', dot: '#16a34a', label: 'Đang bán' },
  SOLD_OUT: { bg: 'rgba(224, 242, 254, 0.94)', text: '#075985', dot: '#0284c7', label: 'Hết hàng' },
  CLOSED: { bg: 'rgba(241, 245, 249, 0.94)', text: '#475569', dot: '#94a3b8', label: 'Đã đóng' },
}

interface Props {
  project: Project
  canManage: boolean
  onSelect: (id: string) => void
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

export function ProjectCard({ project: p, canManage, onSelect, onEdit, onDelete }: Props) {
  const st = STATUS_BADGE[p.status] ?? STATUS_BADGE.PLANNING

  return (
    <Card
      className="stitch-card project-card"
      variant="borderless"
      tabIndex={0}
      role="button"
      aria-label={`Xem dự án ${p.name}`}
      onClick={() => onSelect(p.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(p.id)
        }
      }}
      styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1 } }}
      cover={
        <div className="project-card__cover-wrap">
          <div className="project-card__fallback-icon" aria-hidden="true">
            <BankOutlined />
          </div>

          {p.imageUrl && (
            <img
              src={p.imageUrl}
              alt={p.name}
              className="project-card__img"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}

          <div className="project-card__scrim" />

          {/* Status badge with glassmorphism */}
          <span className="project-card__badge" style={{ background: st.bg, color: st.text }}>
            <span className="project-card__badge-dot" style={{ background: st.dot }} />
            {st.label}
          </span>

          {/* Investor chip */}
          {p.investor && (
            <div className="project-card__investor-pill">
              <BankOutlined style={{ fontSize: 12, color: '#6ee7b7' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.investor}
              </span>
            </div>
          )}
        </div>
      }
    >
      <div className="project-card__body">
        <span className="project-card__category">Dự án bất động sản</span>

        <Typography.Title level={4} className="project-card__title">
          {p.name}
        </Typography.Title>

        <div className="project-card__meta-list">
          <div className="project-card__meta-item">
            <EnvironmentOutlined style={{ color: '#059669', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.location || 'Chưa cập nhật địa điểm'}
            </span>
          </div>
          <div className="project-card__meta-item is-muted">
            <CalendarOutlined style={{ flexShrink: 0 }} />
            <span>Ngày tạo: {formatDate(p.createdAt)}</span>
          </div>
        </div>

        <div className="project-card__footer">
          {canManage ? (
            <div className="project-card__actions" onClick={(e) => e.stopPropagation()}>
              <Button
                size="small"
                type="text"
                icon={<EditOutlined style={{ fontSize: 13 }} />}
                onClick={() => onEdit(p)}
                className="project-card__action-btn"
              >
                Sửa
              </Button>
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                onClick={() => onDelete(p)}
                className="project-card__action-btn is-danger"
                title="Xoá dự án"
              />
            </div>
          ) : (
            <span className="project-card__desc-tag">
              {p.description ? 'Có tài liệu mô tả' : 'Xem thông tin dự án'}
            </span>
          )}

          <span className="project-card__cta">
            Chi tiết <ArrowRightOutlined className="project-card__cta-arrow" />
          </span>
        </div>
      </div>
    </Card>
  )
}

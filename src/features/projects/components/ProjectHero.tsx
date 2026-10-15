import {
  BankOutlined,
  BuildOutlined,
  CalendarOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  EditOutlined,
  EnvironmentOutlined,
  ExpandOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { Button, Typography } from 'antd'
import { useState } from 'react'
import { StatusPill, type StatusTone } from '@/components/common/StatusPill'
import { formatDate } from '@/lib/format'
import { PROJECT_STATUS, labelOf, type Project } from '../api'

interface Props {
  project: Project
  onEdit: () => void
  onOpenImage: () => void
}

export function ProjectHero({ project, onEdit, onOpenImage }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const description = project.description?.trim()

  const statusTone: StatusTone =
    project.status === 'SELLING'
      ? 'green'
      : project.status === 'PLANNING'
        ? 'amber'
        : project.status === 'SOLD_OUT'
          ? 'blue'
          : 'gray'

  return (
    <section className="project-hero">
      <div className="project-hero__media">
        {project.imageUrl && !imageFailed ? (
          <button
            type="button"
            className="project-hero__image-button"
            onClick={onOpenImage}
            aria-label={`Xem ảnh lớn ${project.name}`}
          >
            <img
              src={project.imageUrl}
              alt={`Ảnh dự án ${project.name}`}
              onError={() => setImageFailed(true)}
            />
            <div className="project-hero__scrim" />
            <span className="project-hero__badge">
              <span className="project-hero__badge-dot" />
              {labelOf(PROJECT_STATUS, project.status)}
            </span>
            {project.investor && (
              <div className="project-hero__investor-pill">
                <BuildOutlined /> {project.investor}
              </div>
            )}
            <span className="project-hero__zoom">
              <ExpandOutlined /> Xem ảnh lớn
            </span>
          </button>
        ) : (
          <div
            className="project-hero__mock-cover"
            role="button"
            tabIndex={0}
            onClick={onEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onEdit()
              }
            }}
            title="Bấm để tải ảnh hoặc cập nhật thông tin dự án"
          >
            <div className="project-hero__mock-bg-glow" />
            <div className="project-hero__mock-icon-wrap">
              <BankOutlined />
            </div>

            <span className="project-hero__badge">
              <span className="project-hero__badge-dot" />
              {labelOf(PROJECT_STATUS, project.status)}
            </span>

            {project.investor && (
              <div className="project-hero__investor-pill">
                <BuildOutlined /> {project.investor}
              </div>
            )}

            <div className="project-hero__mock-action">
              <CameraOutlined />
              <span>Cập nhật ảnh dự án</span>
            </div>
          </div>
        )}
      </div>

      <aside className="project-hero__summary" aria-label="Thông tin tổng quan dự án">
        <div className="project-hero__summary-header">
          <span className="project-hero__eyebrow">
            <SafetyCertificateOutlined /> TỔNG QUAN DỰ ÁN
          </span>
          <StatusPill tone={statusTone} size="sm">
            {labelOf(PROJECT_STATUS, project.status)}
          </StatusPill>
        </div>

        <div className="project-hero__facts-grid">
          <div className="project-hero__fact-card fact--green">
            <div className="project-hero__fact-icon">
              <EnvironmentOutlined />
            </div>
            <div className="project-hero__fact-body">
              <span className="project-hero__fact-label">Vị trí</span>
              <strong className="project-hero__fact-val" title={project.location || 'Chưa cập nhật'}>
                {project.location || 'Chưa cập nhật'}
              </strong>
            </div>
          </div>

          <div className="project-hero__fact-card fact--blue">
            <div className="project-hero__fact-icon">
              <BuildOutlined />
            </div>
            <div className="project-hero__fact-body">
              <span className="project-hero__fact-label">Chủ đầu tư</span>
              <strong className="project-hero__fact-val" title={project.investor || 'Chưa cập nhật'}>
                {project.investor || 'Chưa cập nhật'}
              </strong>
            </div>
          </div>

          <div className="project-hero__fact-card fact--purple">
            <div className="project-hero__fact-icon">
              <CalendarOutlined />
            </div>
            <div className="project-hero__fact-body">
              <span className="project-hero__fact-label">Ngày cập nhật</span>
              <strong className="project-hero__fact-val">
                {formatDate(project.updatedAt)}
              </strong>
            </div>
          </div>

          <div className="project-hero__fact-card fact--amber">
            <div className="project-hero__fact-icon">
              <CheckCircleOutlined />
            </div>
            <div className="project-hero__fact-body">
              <span className="project-hero__fact-label">Trạng thái</span>
              <strong className="project-hero__fact-val">
                {labelOf(PROJECT_STATUS, project.status)}
              </strong>
            </div>
          </div>
        </div>

        <div className="project-hero__description">
          <div className="project-hero__desc-head">
            <FileTextOutlined />
            <Typography.Text strong>Mô tả dự án</Typography.Text>
          </div>
          <p className={expanded ? undefined : 'is-clamped'}>
            {description || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa có mô tả chi tiết cho dự án này.</span>}
          </p>
          {description && description.length > 180 && (
            <Button type="link" size="small" onClick={() => setExpanded((value) => !value)}>
              {expanded ? 'Thu gọn' : 'Xem đầy đủ'}
            </Button>
          )}
        </div>

        <Button
          type="primary"
          block
          icon={<EditOutlined />}
          onClick={onEdit}
          className="project-hero__edit-btn"
        >
          Cập nhật thông tin & ảnh
        </Button>
      </aside>
    </section>
  )
}
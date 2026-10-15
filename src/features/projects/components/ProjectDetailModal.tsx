import {
  AppstoreOutlined,
  BankOutlined,
  EditOutlined,
  EnvironmentOutlined,
  ExportOutlined,
  FileTextOutlined,
  ProjectOutlined,
} from '@ant-design/icons'
import { Button, Empty, Modal, Skeleton, Space, Typography } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusPill, type Tone } from '@/components/common/StatusPill'
import { formatDate } from '@/lib/format'
import { paths } from '@/routes/paths'
import { PROJECT_STATUS, labelOf, useProject, useProjectProducts, type Project, type ProjectStatus } from '../api'
import './ProjectDetailModal.css'

interface Props { projectId?: string; onClose: () => void; onEdit: (project: Project) => void }

const STATUS_CONFIG: Record<ProjectStatus, { label: string; tone: Tone }> = {
  PLANNING: { label: 'Chuẩn bị', tone: 'amber' },
  SELLING: { label: 'Đang bán', tone: 'green' },
  SOLD_OUT: { label: 'Hết hàng', tone: 'blue' },
  CLOSED: { label: 'Đã đóng', tone: 'gray' },
}

export function ProjectDetailModal({ projectId, onClose, onEdit }: Props) {
  const navigate = useNavigate()
  const detail = useProject(projectId)
  const products = useProjectProducts(projectId)
  const project = detail.data
  const [imageFailed, setImageFailed] = useState(false)

  const productList = products.data?.content ?? []
  const totalProducts = products.data?.totalElements ?? 0
  const availableCount = productList.filter((p) => p.status === 'AVAILABLE').length

  const st = project ? STATUS_CONFIG[project.status] ?? STATUS_CONFIG.PLANNING : STATUS_CONFIG.PLANNING

  return (
    <Modal
      open={Boolean(projectId)}
      onCancel={onClose}
      width={1060}
      className="project-detail-modal"
      destroyOnHidden
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: '#DCFCE7', color: '#16A34A', display: 'grid', placeItems: 'center', fontSize: 18 }}>
            <ProjectOutlined />
          </span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>Hồ sơ dự án bất động sản</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>Thông tin chi tiết, phân phối sản phẩm & tình trạng triển khai</div>
          </div>
        </div>
      }
      footer={
        project && (
          <div className="project-detail-modal__footer">
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Dữ liệu dự án đồng bộ trực tiếp từ hệ thống CRM Đất Xanh Miền Trung.
            </Typography.Text>
            <Space size={10}>
              <Button onClick={onClose} style={{ height: 38, borderRadius: 8 }}>
                Đóng
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={() => {
                  onClose()
                  navigate(paths.project(project.id))
                }}
                style={{ height: 38, borderRadius: 8 }}
              >
                Trang dự án đầy đủ
              </Button>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => onEdit(project)}
                style={{ height: 38, borderRadius: 8, background: '#006b2c' }}
              >
                Chỉnh sửa dự án
              </Button>
            </Space>
          </div>
        )
      }
    >
      {detail.isLoading ? (
        <Skeleton active avatar paragraph={{ rows: 12 }} />
      ) : !project ? (
        <Empty description={detail.isError ? 'Không thể tải thông tin dự án.' : 'Không tìm thấy dự án.'}>
          <Button hidden={!detail.isError} onClick={() => void detail.refetch()}>
            Thử lại
          </Button>
        </Empty>
      ) : (
        <div className="project-detail-modal__content">
          <div className="pdm-hero">
            <div className="pdm-hero__media">
              {project.imageUrl && !imageFailed ? (
                <div className="pdm-hero__img-wrap">
                  <img src={project.imageUrl} alt={project.name} onError={() => setImageFailed(true)} />
                  <div className="pdm-hero__scrim" />
                </div>
              ) : (
                <div className="pdm-hero__empty">
                  <BankOutlined style={{ fontSize: 60, color: 'rgba(255,255,255,0.25)' }} />
                  <span>Chưa có hình ảnh đại diện</span>
                </div>
              )}

              <StatusPill tone={st.tone} className="pdm-status-badge">
                {st.label}
              </StatusPill>
            </div>

            <div className="pdm-hero__info">
              <div className="pdm-hero__eyebrow">
                <span>DỰ ÁN BẤT ĐỘNG SẢN</span>
                <span className="pdm-hero__id">MÃ #{project.id.slice(0, 8).toUpperCase()}</span>
              </div>

              <h2 className="pdm-hero__title">{project.name}</h2>

              <div className="pdm-hero__facts">
                <div className="pdm-hero__fact">
                  <EnvironmentOutlined className="pdm-icon--green" />
                  <span>{project.location || 'Chưa cập nhật địa điểm'}</span>
                </div>
                <div className="pdm-hero__fact">
                  <BankOutlined className="pdm-icon--blue" />
                  <span>Chủ đầu tư: <strong>{project.investor || 'Chưa cập nhật'}</strong></span>
                </div>
              </div>

              <div className="pdm-kpi-grid">
                <div className="pdm-kpi-card pdm-kpi-card--green">
                  <span className="pdm-kpi-label">TỔNG SẢN PHẨM</span>
                  <strong className="pdm-kpi-value">{totalProducts} <small>căn</small></strong>
                  <span className="pdm-kpi-sub">Bảng hàng toàn dự án</span>
                </div>
                <div className="pdm-kpi-card pdm-kpi-card--amber">
                  <span className="pdm-kpi-label">SẴN SÀNG GIAO DỊCH</span>
                  <strong className="pdm-kpi-value">{availableCount} <small>căn</small></strong>
                  <span className="pdm-kpi-sub">Đang mở bán</span>
                </div>
                <div className="pdm-kpi-card pdm-kpi-card--slate">
                  <span className="pdm-kpi-label">NGÀY CẬP NHẬT</span>
                  <strong className="pdm-kpi-value pdm-kpi-value--date">{formatDate(project.updatedAt)}</strong>
                  <span className="pdm-kpi-sub">Tạo ngày {formatDate(project.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="pdm-body-grid">
            <div className="pdm-card pdm-card--main">
              <div className="pdm-card__header">
                <div className="pdm-card__title">
                  <FileTextOutlined style={{ color: '#16a34a' }} />
                  <span>Nội dung & Mô tả dự án</span>
                </div>
                <span className="pdm-card__hint">Thông tin công bố</span>
              </div>
              <div className="pdm-card__content">
                {project.description ? (
                  <div className="pdm-description-text">{project.description}</div>
                ) : (
                  <div className="pdm-empty-desc">
                    <FileTextOutlined style={{ fontSize: 32, color: '#cbd5e1' }} />
                    <span>Dự án chưa có nội dung mô tả chi tiết.</span>
                    <Button size="small" type="dashed" icon={<EditOutlined />} onClick={() => onEdit(project)}>
                      Bổ sung mô tả ngay
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="pdm-card pdm-card--side">
              <div className="pdm-card__header">
                <div className="pdm-card__title">
                  <AppstoreOutlined style={{ color: '#0284c7' }} />
                  <span>Quản trị & Bảng hàng</span>
                </div>
                <StatusPill tone={st.tone}>{st.label}</StatusPill>
              </div>
              <div className="pdm-card__content">
                <div className="pdm-meta-list">
                  <div className="pdm-meta-row">
                    <span>Trạng thái mở bán</span>
                    <strong>{labelOf(PROJECT_STATUS, project.status)}</strong>
                  </div>
                  <div className="pdm-meta-row">
                    <span>Số lượng sản phẩm</span>
                    <strong>{totalProducts} căn</strong>
                  </div>
                  <div className="pdm-meta-row">
                    <span>Sản phẩm còn trống</span>
                    <strong style={{ color: '#16a34a' }}>{availableCount} căn sẵn sàng</strong>
                  </div>
                  <div className="pdm-meta-row">
                    <span>Ngày tạo hồ sơ</span>
                    <strong>{formatDate(project.createdAt)}</strong>
                  </div>
                </div>

                <div className="pdm-side-cta">
                  <Button
                    type="primary"
                    ghost
                    block
                    icon={<AppstoreOutlined />}
                    onClick={() => {
                      onClose()
                      navigate(paths.project(project.id))
                    }}
                    style={{ height: 40, borderRadius: 8, fontWeight: 600 }}
                  >
                    Xem bảng hàng chi tiết ({totalProducts} sản phẩm)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
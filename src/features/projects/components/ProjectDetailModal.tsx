import { AppstoreOutlined, CalendarOutlined, EditOutlined, EnvironmentOutlined, PictureOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, Empty, Modal, Skeleton, Space, Tag, Typography } from 'antd'
import { useState } from 'react'
import { formatDate } from '@/lib/format'
import { PROJECT_STATUS, labelOf, useProject, type Project } from '../api'
import './ProjectDetailModal.css'

interface Props { projectId?: string; onClose: () => void; onEdit: (project: Project) => void }

const tone: Record<Project['status'], string> = { PLANNING: 'gold', SELLING: 'green', SOLD_OUT: 'blue', CLOSED: 'default' }

/** Popup chỉ đọc dự án. Chỉ lấy field ProjectResponse thật, không dựng KPI sản phẩm chưa được API detail trả về. */
export function ProjectDetailModal({ projectId, onClose, onEdit }: Props) {
  const detail = useProject(projectId)
  const project = detail.data
  const [imageFailed, setImageFailed] = useState(false)

  return <Modal open={Boolean(projectId)} onCancel={onClose} width="92vw" style={{ top: '5vh' }} className="project-detail-modal" destroyOnHidden title="Thông tin dự án" footer={project && <div className="project-detail-modal__footer"><Typography.Text>Thông tin được tải mới từ hệ thống CRM.</Typography.Text><Space><Button onClick={onClose}>Đóng</Button><Button type="primary" icon={<EditOutlined />} onClick={() => onEdit(project)}>Chỉnh sửa</Button></Space></div>}>
    {detail.isLoading ? <Skeleton active avatar paragraph={{ rows: 12 }} /> : !project ? <Empty description={detail.isError ? 'Không thể tải thông tin dự án.' : 'Không tìm thấy dự án.'}><Button hidden={!detail.isError} onClick={() => void detail.refetch()}>Thử lại</Button></Empty> : <div className="project-detail-modal__content">
      <div className="project-detail-modal__hero">
        <div className="project-detail-modal__cover">{project.imageUrl && !imageFailed ? <img src={project.imageUrl} alt={`Ảnh dự án ${project.name}`} onError={() => setImageFailed(true)} /> : <PictureOutlined />}</div>
        <div className="project-detail-modal__identity"><Typography.Text type="secondary">DỰ ÁN BẤT ĐỘNG SẢN</Typography.Text><Typography.Title level={3}>{project.name}</Typography.Title><Tag color={tone[project.status]}>{labelOf(PROJECT_STATUS, project.status)}</Tag></div>
        <div className="project-detail-modal__audit"><span>Ngày tạo</span><strong>{formatDate(project.createdAt)}</strong><span>Cập nhật</span><strong>{formatDate(project.updatedAt)}</strong></div>
      </div>
      <div className="project-detail-modal__grid">
        <Card className="project-detail-modal__card" size="small" title={<Space size={7}><AppstoreOutlined />Tổng quan dự án</Space>} extra="Thông tin cơ bản"><div className="project-detail-modal__facts"><div><span>Tên dự án</span><strong>{project.name}</strong></div><div><span>Trạng thái</span><Tag color={tone[project.status]}>{labelOf(PROJECT_STATUS, project.status)}</Tag></div><div><span><EnvironmentOutlined /> Địa điểm</span><strong>{project.location || 'Chưa cập nhật'}</strong></div><div><span><UserOutlined /> Chủ đầu tư</span><strong>{project.investor || 'Chưa cập nhật'}</strong></div><div><span><CalendarOutlined /> Ngày tạo</span><strong>{formatDate(project.createdAt)}</strong></div><div><span>Cập nhật gần nhất</span><strong>{formatDate(project.updatedAt)}</strong></div></div></Card>
        <Card className="project-detail-modal__card project-detail-modal__description" size="small" title="Mô tả dự án" extra="Nội dung công bố"><Typography.Paragraph>{project.description || 'Chưa cập nhật'}</Typography.Paragraph></Card>
      </div>
    </div>}
  </Modal>
}
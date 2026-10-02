import { CalendarOutlined, EnvironmentOutlined, PictureOutlined, ShopOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Typography } from 'antd'
import { useState } from 'react'
import { formatDate } from '@/lib/format'
import { PROJECT_STATUS, labelOf, type Project } from '../api'

interface Props { project: Project; onEdit: () => void; onOpenImage: () => void }

/** Hero duy nhất: API hiện chỉ có một cover imageUrl, không dựng gallery giả. */
export function ProjectHero({ project, onEdit, onOpenImage }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const description = project.description?.trim()
  return <section className="project-hero">
    <div className="project-hero__media">
      {project.imageUrl && !imageFailed ? <button type="button" className="project-hero__image-button" onClick={onOpenImage} aria-label={`Xem ảnh lớn ${project.name}`}><img src={project.imageUrl} alt={`Ảnh dự án ${project.name}`} onError={() => setImageFailed(true)} /><span className="project-hero__zoom">Xem ảnh lớn</span></button> : <div className="project-hero__empty" role="img" aria-label="Chưa có hình ảnh dự án"><PictureOutlined /><strong>Chưa có hình ảnh dự án</strong><span>Thêm ảnh từ chức năng sửa dự án.</span></div>}
    </div>
    <aside className="project-hero__summary" aria-label="Thông tin tổng quan dự án">
      <span className="project-hero__eyebrow">TỔNG QUAN DỰ ÁN</span>
      <dl className="project-hero__facts"><div><dt><EnvironmentOutlined /> Vị trí</dt><dd>{project.location || 'Chưa cập nhật'}</dd></div><div><dt><UserOutlined /> Chủ đầu tư</dt><dd>{project.investor || 'Chưa cập nhật'}</dd></div><div><dt><CalendarOutlined /> Cập nhật</dt><dd>{formatDate(project.updatedAt)}</dd></div><div><dt><ShopOutlined /> Trạng thái</dt><dd>{labelOf(PROJECT_STATUS, project.status)}</dd></div></dl>
      <div className="project-hero__description"><Typography.Text strong>Mô tả dự án</Typography.Text><p className={expanded ? undefined : 'is-clamped'}>{description || 'Chưa có mô tả dự án.'}</p>{description && description.length > 220 && <Button type="link" size="small" onClick={() => setExpanded((value) => !value)}>{expanded ? 'Thu gọn' : 'Xem đầy đủ'}</Button>}</div>
      <Button block onClick={onEdit}>Cập nhật thông tin & ảnh</Button>
    </aside>
  </section>
}
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, EyeOutlined, MoreOutlined } from '@ant-design/icons'
import { App, Button, Card, Descriptions, Dropdown, Empty, Space, Typography } from 'antd'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDateTime } from '@/lib/format'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'
import {
  apiErrorMessage, categoryLabel, statusLabel,
  useEmailTemplate, useEmailTemplateMutations,
} from '../api'
import { CategoryPill, StatusPill } from '../components/EmailTemplatePills'
import { EmailTemplatePreviewModal } from '../components/EmailTemplatePreviewModal'

/** Rút HTML thành text thuần để hiển thị TÓM TẮT — màn chi tiết không render toàn bộ body. */
export const htmlToText = (html: string) =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

/** 9.13 (nhánh chỉ-đọc): thông tin mẫu + tóm tắt nội dung; toàn bộ email xem ở modal. */
export function EmailTemplateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const canWrite = useAuthStore((s) => s.user?.role === 'ADMIN' || s.user?.role === 'MANAGER')
  const [previewOpen, setPreviewOpen] = useState(false)

  const { data: template, isLoading, isError, error, refetch } = useEmailTemplate(id)
  const { remove } = useEmailTemplateMutations()

  const snippet = template?.body ? htmlToText(template.body).slice(0, 400) : ''

  const confirmDelete = () => {
    if (!template) return
    modal.confirm({
      title: `Xóa mẫu email «${template.name}»?`,
      content: 'Hành động này không hoàn tác được.',
      okText: 'Xóa', okButtonProps: { danger: true }, cancelText: 'Đóng',
      onOk: () =>
        remove.mutateAsync(template.id)
          .then(() => { message.success('Đã xóa mẫu email'); navigate(paths.emailTemplates) })
          .catch((e) => message.error(apiErrorMessage(e))),
    })
  }

  return (
    <>
      <PageHeader
        title={template?.name ?? 'Chi tiết mẫu email'}
        breadcrumb={[
          { title: 'Trang chủ', href: paths.dashboard },
          { title: 'Mẫu email', href: paths.emailTemplates },
          { title: 'Chi tiết' },
        ]}
        status={
          template && (
            <Space size={8} wrap>
              <CategoryPill category={template.category} />
              <StatusPill status={template.status} />
            </Space>
          )
        }
        meta={template ? `Cập nhật lần cuối ${formatDateTime(template.updatedAt)}` : undefined}
        actions={
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(paths.emailTemplates)}>Về danh sách</Button>
            <Button type="primary" icon={<EyeOutlined />} disabled={!template} onClick={() => setPreviewOpen(true)}>
              Xem trước
            </Button>
            {canWrite && template && (
              <>
                <Button icon={<EditOutlined />} onClick={() => navigate(paths.emailTemplateEdit(template.id))}>
                  Biên soạn
                </Button>
                <Dropdown
                  menu={{
                    items: [{ key: 'del', danger: true, icon: <DeleteOutlined />, label: 'Xóa mẫu email' }],
                    onClick: () => confirmDelete(),
                  }}
                >
                  <Button icon={<MoreOutlined />} aria-label="Thao tác khác" />
                </Dropdown>
              </>
            )}
          </Space>
        }
      />

      <Card className="stitch-card" variant="borderless" loading={isLoading} styles={{ body: { padding: 24 } }}>
        {isError && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={`Không thể tải mẫu email. ${apiErrorMessage(error)}`}
          >
            <Button type="primary" onClick={() => void refetch()}>Thử lại</Button>
          </Empty>
        )}
        {template && (
          <Descriptions
            column={{ xs: 1, sm: 1, md: 2, lg: 2 }}
            size="small"
            colon={false}
            styles={{ label: { color: '#64748b', width: 150 } }}
            items={[
              { key: 'name', label: 'Tên mẫu', children: <b>{template.name}</b> },
              { key: 'code', label: 'Mã mẫu', children: <span className="product-code">{template.id.replace(/-/g, '').slice(0, 16).toUpperCase()}</span> },
              { key: 'subject', label: 'Tiêu đề email', children: template.subject || '—' },
              { key: 'cat', label: 'Danh mục', children: `${categoryLabel(template.category)} (${template.category})` },
              { key: 'status', label: 'Trạng thái', children: `${statusLabel(template.status)} (${template.status})` },
              { key: 'created', label: 'Tạo lúc', children: formatDateTime(template.createdAt) },
              { key: 'updated', label: 'Cập nhật lúc', children: formatDateTime(template.updatedAt) },
            ]}
          />
        )}
      </Card>

      {template && (
        <Card
          className="stitch-card"
          variant="borderless"
          style={{ marginTop: 16 }}
          styles={{ body: { padding: 24 } }}
          title={<span className="stitch-label">NỘI DUNG MẪU EMAIL</span>}
          extra={<Button type="link" icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>Xem toàn bộ nội dung</Button>}
        >
          <Typography.Text style={{ display: 'block', fontSize: 13, color: '#64748b' }}>Tiêu đề email</Typography.Text>
          <Typography.Text style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 14 }}>
            {template.subject || '—'}
          </Typography.Text>
          {snippet ? (
            <div className="etp-snippet">{snippet}…</div>
          ) : (
            <Typography.Text type="secondary">Template chưa có nội dung email.</Typography.Text>
          )}
        </Card>
      )}

      <EmailTemplatePreviewModal
        open={previewOpen}
        loading={isLoading}
        error={isError ? error : null}
        template={template}
        canEdit={canWrite}
        onRetry={() => void refetch()}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  )
}

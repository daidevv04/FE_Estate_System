import { EditOutlined, FileTextOutlined, InfoCircleOutlined, MailOutlined } from '@ant-design/icons'
import { Button, Modal, Skeleton, Typography } from 'antd'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '@/lib/format'
import { paths } from '@/routes/paths'
import { apiErrorMessage, type EmailTemplate } from '../api'
import { EmailPreviewFrame } from './EmailPreviewFrame'
import './EmailTemplatePreviewModal.css'

interface Props {
  open: boolean
  loading: boolean
  error: Error | null
  template?: EmailTemplate
  canEdit: boolean
  onRetry: () => void
  onClose: () => void
}

/** Nhãn viết HOA + mã enum, đúng cách Stitch hiển thị: "HỢP ĐỒNG & GỬI CHỐ (CONTRACT)". */
const CATEGORY_TEXT: Record<string, string> = {
  WELCOME: 'CHÀO MỪNG',
  FOLLOW_UP: 'THEO DÕI',
  PROMOTION: 'KHUYẾN MÃI',
  CONTRACT: 'HỢP ĐỒNG & GỬI CHỐ',
}
const STATUS_TEXT: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Ngừng hoạt động',
}
/** Backend không có sender/recipient. Chỉ hiển thị đúng placeholder `{{...}}` là quy ước của mẫu. */
const TO_PLACEHOLDER = '{{customer_name}}'

/** 9.12 — modal lớn ở giữa: header icon + badge, metadata dạng dòng, email canvas, footer 2 nút. */
export function EmailTemplatePreviewModal({
  open, loading, error, template, canEdit, onRetry, onClose,
}: Props) {
  const navigate = useNavigate()
  const hasBody = Boolean(template?.body?.trim())

  // ESC đóng từ mọi nơi. rc-dialog chỉ nghe keydown trong bản thân panel, nên nếu
  // focus rơi ra (click vùng nền, đọc bằng screen reader) thì ESC bị bỏ qua.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const edit = () => {
    if (!template) return
    onClose()
    navigate(paths.emailTemplateEdit(template.id))
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={960}
      style={{ paddingBottom: 0 }}
      styles={{
        content: { display: 'flex', flexDirection: 'column', height: '90vh', padding: 0, overflow: 'hidden', borderRadius: 16 },
        header: { marginBottom: 0, padding: '20px 24px 18px', borderBottom: '1px solid #e5ebe7' },
        body: { flex: '1 1 auto', minHeight: 0, padding: 0 },
        footer: { marginTop: 0, padding: '14px 24px', borderTop: '1px solid #e5ebe7' },
      }}
      rootClassName="etp-modal-root"
      // Đưa focus vào chính modal khi mở để ESC luôn đóng được và có điểm neo
      // cho screen reader; focus quay lại nút "Xem trước" là việc của antd.
      afterOpenChange={(opened) => {
        if (!opened) return
        const box = document.querySelector<HTMLElement>('.ant-modal-content')
        box?.setAttribute('tabindex', '-1')
        box?.focus()
      }}
      title={
        <div className="etp-head">
          <span className="etp-head__icon"><MailOutlined /></span>
          <div className="etp-head__text">
            <div className="etp-head__eyebrow">Mẫu email</div>
            <div className="etp-head__title">Xem trước mẫu email</div>
            {template && (
              <div className="etp-head__sub">
                <span className="etp-tag etp-tag--brand">
                  {CATEGORY_TEXT[template.category] ?? template.category} ({template.category})
                </span>
                <span className={`etp-tag ${template.status === 'ACTIVE' ? 'etp-tag--ok' : 'etp-tag--off'}`}>
                  <i className="etp-tag__dot" />
                  {STATUS_TEXT[template.status] ?? template.status} ({template.status})
                </span>
              </div>
            )}
          </div>
        </div>
      }
      footer={
        <div className="etp-foot">
          <Typography.Text className="etp-foot__hint">
            <InfoCircleOutlined /> Dữ liệu biến (<code>{'{{...}}'}</code>) được điền khi gửi thực tế
          </Typography.Text>
          <span className="etp-foot__actions">
            <Button onClick={onClose}>Đóng</Button>
            {canEdit && (
              <Button type="primary" icon={<EditOutlined />} onClick={edit} disabled={!template}>
                Chỉnh sửa mẫu
              </Button>
            )}
          </span>
        </div>
      }
      destroyOnHidden
    >
      {loading && <div className="etp-state"><Skeleton active paragraph={{ rows: 8 }} /></div>}

      {!loading && error && (
        <div className="etp-state">
          <Typography.Text type="secondary">Không thể tải nội dung mẫu email.</Typography.Text>
          <Typography.Text type="secondary">{apiErrorMessage(error)}</Typography.Text>
          <Button type="primary" onClick={onRetry}>Thử lại</Button>
        </div>
      )}
      {!loading && !error && template && (
        <div className="etp-scroll">
          <div className="etp-meta etp-mail-meta">
            <p className="etp-meta__line">
              <span className="etp-meta__k">Đến:</span>
              <code className="etp-meta__ph">{TO_PLACEHOLDER}</code>
              <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                (biến khách hàng)
              </Typography.Text>
            </p>
            <p className="etp-meta__line">
              <span className="etp-meta__k">Tiêu đề:</span>
              <b>{template.subject || '—'}</b>
            </p>
            <div className="etp-meta__rule" />
            <div className="etp-meta__facts">
              <span><FileTextOutlined /> Mã mẫu: <code>{template.id.replace(/-/g, '').slice(0, 16).toUpperCase()}</code></span>
              <span>Danh mục: <b>{template.category}</b></span>
              <span>Cập nhật lần cuối: <b>{formatDate(template.updatedAt)}</b></span>
            </div>
          </div>

          {hasBody ? (
            <section className="etp-preview-stage" aria-label="Nội dung email">
              <div className="etp-preview-stage__bar">
                <span>NỘI DUNG EMAIL</span>
                <span className="etp-preview-stage__mode"><i /> Bản xem trước</span>
              </div>
              <div className="etp-canvas">
                {/* key = template.id: mở mẫu khác thì frame đo lại từ đầu, không giữ cao cũ. */}
                <EmailPreviewFrame key={template.id} html={template.body!} title={`Xem trước nội dung email: ${template.name}`} />
              </div>
            </section>
          ) : (
            <div className="etp-empty">Template chưa có nội dung email.</div>
          )}
        </div>
      )}
    </Modal>
  )
}
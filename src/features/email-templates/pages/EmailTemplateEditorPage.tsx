import { ArrowLeftOutlined, EyeOutlined, SaveOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Col, Empty, Form, Input, Row, Select, Space, Typography } from 'antd'
import { useDeferredValue, useEffect, useRef, useState } from 'react'
import { useBlocker, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'
import {
  apiErrorMessage, EMAIL_TEMPLATE_CATEGORY, EMAIL_TEMPLATE_STATUS,
  type EmailTemplateInput, useEmailTemplate, useEmailTemplateMutations,
} from '../api'
import { EmailPreviewFrame } from '../components/EmailPreviewFrame'

/** Chỉ dùng cho biên soạn: các trường bắt buộc của Create/Update DTO. */
type FormValues = Required<Pick<EmailTemplateInput, 'name' | 'subject' | 'body' | 'category' | 'status'>>

const BODY_MAX = 20000

/** 9.13 — `/email-templates/new` (tạo) và `/email-templates/:id/edit` (sửa) dùng chung màn này. */
export function EmailTemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isCreate = !id
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const [form] = Form.useForm<FormValues>()
  const canWrite = useAuthStore((s) => s.user?.role === 'ADMIN' || s.user?.role === 'MANAGER')

  const { data: template, isLoading, isError, error } = useEmailTemplate(id)
  const { create, update } = useEmailTemplateMutations()
  const saving = create.isPending || update.isPending

  const [dirty, setDirty] = useState(false)
  const body = Form.useWatch('body', form) ?? ''
  const subjectLive = Form.useWatch('subject', form) ?? ''
  // Gõ liên tục mà dựng lại iframe mỗi ký tự thì lag; hoãn sang mức ưu tiên thấp hơn.
  const previewBody = useDeferredValue(body)

  useEffect(() => {
    if (!template) return
    form.setFieldsValue({
      name: template.name,
      subject: template.subject,
      body: template.body ?? '',
      category: template.category,
      status: template.status,
    })
    setDirty(false)
  }, [template, form])

  // Rời trang khi còn sửa dở → hỏi lại (kể cả khi bấm nút Hủy, vì cũng đi qua router).
  // savedRef: sau khi lưu xong, việc điều hướng do chính luồng lưu phát ra không được chặn lại.
  const savedRef = useRef(false)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !saving && !savedRef.current && currentLocation.pathname !== nextLocation.pathname,
  )
  const askedRef = useRef(false)
  useEffect(() => {
    if (blocker.state !== 'blocked') { askedRef.current = false; return }
    if (askedRef.current) return
    askedRef.current = true
    modal.confirm({
      title: 'Bạn có thay đổi chưa được lưu.',
      content: 'Rời trang sẽ mất các thay đổi vừa nhập.',
      okText: 'Rời trang', cancelText: 'Tiếp tục chỉnh sửa',
      onOk: () => blocker.proceed?.(),
      onCancel: () => blocker.reset?.(),
    })
  }, [blocker.state, modal, blocker])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const backTo = isCreate ? paths.emailTemplates : paths.emailTemplate(id!)
  const saveError = create.error ?? update.error

  const onSave = async () => {
    let values: FormValues
    try { values = await form.validateFields() } catch { return }
    const payload: EmailTemplateInput = { ...values }
    if (isCreate) {
      const created = await create.mutateAsync(payload)
      message.success('Đã tạo mẫu email')
      setDirty(false)
      savedRef.current = true
      navigate(paths.emailTemplate(created.id), { replace: true })
      return
    }
    await update.mutateAsync({ id: id!, body: payload })
    message.success('Đã cập nhật mẫu email')
    setDirty(false)
    savedRef.current = true
    navigate(paths.emailTemplate(id!), { replace: true })
  }

  const onSaveClick = () => {
    onSave().catch((e) => message.error(apiErrorMessage(e)))
  }

  if (!canWrite) {
    return (
      <Card className="stitch-card" variant="borderless">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bạn không có quyền biên soạn mẫu email." />
      </Card>
    )
  }

  const heading = isCreate ? 'Tạo mẫu email' : 'Biên soạn mẫu email'

  return (
    <>
      <PageHeader
        title={heading}
        breadcrumb={[
          { title: 'Trang chủ', href: paths.dashboard },
          { title: 'Mẫu email', href: paths.emailTemplates },
          ...(isCreate ? [] : [{ title: template?.name ?? 'Chi tiết', href: backTo }]),
          { title: isCreate ? 'Tạo mới' : 'Biên soạn' },
        ]}
        meta={isCreate ? 'Mẫu mới tạo ở trạng thái ngừng dùng sẽ không được gửi tới khách hàng.' : undefined}
        actions={
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(backTo)}>Hủy</Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={onSaveClick}>
              Lưu mẫu
            </Button>
          </Space>
        }
      />

      {isError && (
        <Alert
          type="error" showIcon style={{ marginBottom: 16 }}
          message="Không tải được mẫu email"
          description={apiErrorMessage(error)}
        />
      )}
      {saveError && (
        <Alert
          type="error" showIcon style={{ marginBottom: 16 }}
          message="Không lưu được mẫu email"
          description={apiErrorMessage(saveError)}
        />
      )}

      <Row className="etp-editor" gutter={[20, 20]} align="top">
        <Col className="etp-editor__form" xs={24} xl={15}>
          <Card
            className="stitch-card etp-editor__form-card" variant="borderless" loading={isLoading}
            styles={{ body: { padding: 24 } }}
            title={<span className="stitch-label">THÔNG TIN MẪU</span>}
          >
            <Form<FormValues>
              form={form}
              layout="vertical"
              requiredMark={false}
              disabled={saving}
              initialValues={{ status: 'INACTIVE' }}
              onValuesChange={() => setDirty(true)}
            >
              <Form.Item name="name" label="Tên mẫu" rules={[{ required: true, message: 'Nhập tên mẫu' }, { max: 100, message: 'Tối đa 100 ký tự' }]}>
                <Input placeholder="VD: Thông báo nhận ký hợp đồng" maxLength={100} />
              </Form.Item>
              <Form.Item name="subject" label="Tiêu đề email" rules={[{ required: true, message: 'Nhập tiêu đề email' }, { max: 255, message: 'Tối đa 255 ký tự' }]}>
                <Input placeholder="VD: Cảm ơn quý khách đã quan tâm dự án" maxLength={255} />
              </Form.Item>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="category" label="Danh mục" rules={[{ required: true, message: 'Chọn danh mục' }]}>
                    <Select placeholder="Chọn danh mục" options={EMAIL_TEMPLATE_CATEGORY} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: 'Chọn trạng thái' }]}>
                    <Select options={EMAIL_TEMPLATE_STATUS} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="body"
                label="Nội dung email (HTML)"
                rules={[{ required: true, message: 'Nhập nội dung HTML cho email' }]}
                extra="Dùng biến dạng {{customer_name}} để chèn tên khách hàng. Nội dung hiển thị đúng như gửi thật."
              >
                <Input.TextArea rows={14} className="etp-code" showCount maxLength={BODY_MAX} />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col className="etp-editor__preview-col" xs={24} xl={9}>
          <Card
            className="stitch-card etp-editor__preview" variant="borderless"
            styles={{ body: { padding: 0 } }}
            title={<span className="stitch-label">XEM TRƯỚC</span>}
            extra={<EyeOutlined style={{ color: '#94a3b8' }} />}
          >
            <div className="etp-meta">
              <p className="etp-meta__line">
                <span className="etp-meta__k">Đến:</span>
                <code className="etp-meta__ph">{'{{customer_name}}'}</code>
              </p>
              <p className="etp-meta__line">
                <span className="etp-meta__k">Chủ đề:</span>
                <Typography.Text ellipsis style={{ maxWidth: 220 }}>{subjectLive || '—'}</Typography.Text>
              </p>
            </div>
            <div className="etp-canvas">
              <EmailPreviewFrame
                html={previewBody}
                autoHeight={false}
                height={420}
                title="Xem trước nội dung email đang soạn"
              />
            </div>
          </Card>
        </Col>
      </Row>
    </>
  )
}
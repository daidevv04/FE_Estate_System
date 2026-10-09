import { ClearOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Col, Empty, Input, Pagination, Row, Select, Space, Typography } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'
import { tokens as t } from '@/theme/tokens'
import {
  EMAIL_TEMPLATE_CATEGORY, EMAIL_TEMPLATE_STATUS, apiErrorMessage,
  useEmailTemplate, useEmailTemplateTotals, useEmailTemplates,
  type EmailTemplate, type EmailTemplateCategory, type EmailTemplateFilters, type EmailTemplateStatus,
} from '../api'
import { EmailTemplatePreviewModal } from '../components/EmailTemplatePreviewModal'
import { EmailTemplateSummary } from '../components/EmailTemplateSummary'
import { EmailTemplateTable } from '../components/EmailTemplateTable'

const PAGE_SIZE = [{ value: 10, label: '10' }, { value: 20, label: '20' }, { value: 50, label: '50' }]

/** 9.12: kho mẫu email chăm sóc khách hàng — KPI + lọc + bảng + modal xem trước, dữ liệu 100% từ API. */
export function EmailTemplatesPage() {
  const navigate = useNavigate()
  const canWrite = useAuthStore((s) => s.user?.role === 'ADMIN' || s.user?.role === 'MANAGER')
  const [filters, setFilters] = useState<EmailTemplateFilters>({ page: 0, size: 10 })
  const [previewId, setPreviewId] = useState<string | undefined>(undefined)

  const list = useEmailTemplates(filters)
  const totals = useEmailTemplateTotals()
  const detail = useEmailTemplate(previewId)

  const rows = list.data?.content ?? []
  const total = list.data?.totalElements ?? 0
  const size = filters.size ?? 10
  const from = total === 0 ? 0 : (filters.page ?? 0) * size + 1
  const set = (patch: Partial<EmailTemplateFilters>) => setFilters((f) => ({ ...f, ...patch, page: 0 }))
  const closePreview = () => setPreviewId(undefined)
  const filtered = Boolean(filters.keyword || filters.category || filters.status)

  return (
    <>
      <PageHeader
        title="Mẫu email chăm sóc khách hàng"
        breadcrumb={[{ title: 'Trang chủ', href: paths.dashboard }, { title: 'Mẫu email' }]}
        meta="Quản lý các mẫu email được sử dụng trong quá trình chăm sóc khách hàng."
        actions={
          canWrite && (
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => navigate(paths.emailTemplateNew)}>
              Tạo mẫu email
            </Button>
          )
        }
      />

      <div className="etp-kpis">
        <EmailTemplateSummary total={totals.all} active={totals.active} inactive={totals.inactive} loading={totals.isLoading} />
      </div>

      <Card className="stitch-card" variant="borderless" styles={{ body: { padding: 16 } }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} lg={10} xl={8}>
            <Input
              size="large"
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Tìm tên mẫu, subject, nội dung..."
              onChange={(e) => set({ keyword: e.target.value || undefined })}
            />
          </Col>
          <Col xs={12} md={8} lg={4}>
            <Select
              size="large"
              allowClear
              style={{ width: '100%' }}
              placeholder="Tất cả danh mục"
              onChange={(v) => set({ category: v as EmailTemplateCategory })}
              options={EMAIL_TEMPLATE_CATEGORY}
            />
          </Col>
          <Col xs={12} md={8} lg={4}>
            <Select
              size="large"
              allowClear
              style={{ width: '100%' }}
              placeholder="Tất cả trạng thái"
              onChange={(v) => set({ status: v as EmailTemplateStatus })}
              options={EMAIL_TEMPLATE_STATUS}
            />
          </Col>
          <Col xs={12} md={8} lg={2}>
            <Button size="large" block danger icon={<ClearOutlined />} aria-label="Xóa lọc" onClick={() => setFilters({ page: 0, size: 10 })} />
          </Col>
        </Row>
      </Card>

      <Card className="stitch-card" variant="borderless" style={{ marginTop: 16 }} styles={{ body: { padding: 20 } }}>
        <EmailTemplateTable
          rows={rows}
          loading={list.isLoading}
          onPreview={(row: EmailTemplate) => setPreviewId(row.id)}
          emptyText={
            list.isError ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={`Không thể tải danh sách mẫu email. ${apiErrorMessage(list.error)}`}
              >
                <Button type="primary" onClick={() => void list.refetch()}>Thử lại</Button>
              </Empty>
            ) : filtered ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không tìm thấy mẫu email phù hợp">
                <Button onClick={() => setFilters({ page: 0, size: 10 })}>Xóa bộ lọc</Button>
              </Empty>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có mẫu email">
                {canWrite && (
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(paths.emailTemplateNew)}>
                    Tạo mẫu email
                  </Button>
                )}
              </Empty>
            )
          }
        />

        <div className="products-pager">
          <Typography.Text style={{ fontSize: 13, color: t.colorTextSub }}>
            Đang xem {from} - {from + rows.length - 1} của {total} mẫu email
          </Typography.Text>
          <Space size={8}>
            <Typography.Text style={{ fontSize: 13, color: t.colorTextMuted }}>Xem</Typography.Text>
            <Select size="small" value={size} onChange={(v) => setFilters((f) => ({ ...f, size: v, page: 0 }))} options={PAGE_SIZE} />
            <Typography.Text style={{ fontSize: 13, color: t.colorTextMuted }}>/ trang</Typography.Text>
          </Space>
          <Pagination
            current={(filters.page ?? 0) + 1}
            pageSize={size}
            total={total}
            showSizeChanger={false}
            size="small"
            onChange={(p) => setFilters((f) => ({ ...f, page: p - 1 }))}
          />
        </div>
      </Card>

      <EmailTemplatePreviewModal
        open={previewId !== undefined}
        loading={detail.isLoading}
        error={detail.isError ? detail.error : null}
        template={detail.data}
        canEdit={canWrite}
        onRetry={() => void detail.refetch()}
        onClose={closePreview}
      />
    </>
  )
}
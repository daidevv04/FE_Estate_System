import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { App, Button, Card, Empty, Input, Pagination, Select, Space, Tooltip, Typography } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'
import { tokens as t } from '@/theme/tokens'
import {
  EMAIL_TEMPLATE_CATEGORY, EMAIL_TEMPLATE_STATUS, apiErrorMessage,
  useEmailTemplate, useEmailTemplateMutations, useEmailTemplateTotals, useEmailTemplates,
  type EmailTemplate, type EmailTemplateCategory, type EmailTemplateFilters, type EmailTemplateStatus,
} from '../api'
import { EmailTemplatePreviewModal } from '../components/EmailTemplatePreviewModal'
import { EmailTemplateSummary } from '../components/EmailTemplateSummary'
import { EmailTemplateTable } from '../components/EmailTemplateTable'

const PAGE_SIZE = [{ value: 10, label: '10' }, { value: 20, label: '20' }, { value: 50, label: '50' }]

export function EmailTemplatesPage() {
  const { message, modal } = App.useApp()
  const navigate = useNavigate()
  const canManage = useAuthStore((s) => s.user?.role === 'ADMIN')
  const [filters, setFilters] = useState<EmailTemplateFilters>({ page: 0, size: 10 })
  const [previewId, setPreviewId] = useState<string | undefined>(undefined)
  const [selected, setSelected] = useState<string[]>([])

  const list = useEmailTemplates(filters)
  const totals = useEmailTemplateTotals()
  const detail = useEmailTemplate(previewId)
  const { remove } = useEmailTemplateMutations()

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
          canManage && (
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => navigate(paths.emailTemplateNew)}>
              Tạo mẫu email
            </Button>
          )
        }
      />

      <div className="etp-kpis">
        <EmailTemplateSummary total={totals.all} active={totals.active} inactive={totals.inactive} loading={totals.isLoading} />
      </div>

      <Card className="stitch-card crm-filter-card" variant="borderless" styles={{ body: { padding: '12px 16px' } }}>
        <div className="crm-filter-bar">
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder="Tìm tên mẫu, tiêu đề, nội dung..."
            value={filters.keyword}
            onChange={(e) => set({ keyword: e.target.value || undefined })}
            style={{ flex: '2 1 240px', minWidth: 200 }}
          />
          <Select
            allowClear
            placeholder="Tất cả danh mục"
            value={filters.category}
            onChange={(v) => set({ category: v as EmailTemplateCategory })}
            options={EMAIL_TEMPLATE_CATEGORY}
            style={{ flex: '1 1 160px', minWidth: 130 }}
          />
          <Select
            allowClear
            placeholder="Tất cả trạng thái"
            value={filters.status}
            onChange={(v) => set({ status: v as EmailTemplateStatus })}
            options={EMAIL_TEMPLATE_STATUS}
            style={{ flex: '1 1 150px', minWidth: 130 }}
          />
          {(filters.keyword || filters.category || filters.status) && (
            <Button
              className="crm-filter-clear-btn"
              icon={<ReloadOutlined />}
              onClick={() => setFilters({ page: 0, size: 10 })}
            >
              Xoá lọc
            </Button>
          )}
        </div>
      </Card>

      <Card className="stitch-card" variant="borderless" style={{ marginTop: 16 }} styles={{ body: { padding: 20 } }}>
        {selected.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14,
            padding: '10px 14px', borderRadius: t.radiusMd, background: t.colorSurfaceAlt,
          }}>
            <span style={{ fontWeight: 600 }}>Đã chọn {selected.length} mẫu email</span>

            <Tooltip title={selected.length > 1 ? 'Chỉ xem trước khi chọn 1 mẫu' : undefined}>
              <span>
                <Button
                  icon={<EyeOutlined />}
                  disabled={selected.length !== 1}
                  style={{ opacity: selected.length !== 1 ? 0.45 : 1 }}
                  onClick={() => setPreviewId(selected[0])}
                >
                  Xem trước
                </Button>
              </span>
            </Tooltip>

            {canManage && (
              <Tooltip title={selected.length > 1 ? 'Chỉ chỉnh sửa khi chọn 1 mẫu' : undefined}>
                <span>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    disabled={selected.length !== 1}
                    style={{ opacity: selected.length !== 1 ? 0.45 : 1 }}
                    onClick={() => navigate(paths.emailTemplateEdit(selected[0]))}
                  >
                    Chỉnh sửa
                  </Button>
                </span>
              </Tooltip>
            )}

            {canManage && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  modal.confirm({
                    title: `Xác nhận xóa ${selected.length} mẫu email đã chọn?`,
                    content: 'Hành động này không thể hoàn tác.',
                    okText: 'Xóa',
                    okButtonProps: { danger: true },
                    cancelText: 'Hủy',
                    onOk: async () => {
                      for (const id of selected) {
                        await remove.mutateAsync(id)
                      }
                      setSelected([])
                      message.success(`Đã xóa ${selected.length} mẫu email`)
                    },
                  })
                }}
              >
                Xóa ({selected.length})
              </Button>
            )}

            <div style={{ flex: 1 }} />
            <Button type="text" onClick={() => setSelected([])}>Bỏ chọn</Button>
          </div>
        )}

        <EmailTemplateTable
          rows={rows}
          loading={list.isLoading}
          selectedRowKeys={selected}
          onSelect={setSelected}
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
                {canManage && (
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
            Đang xem {from} - {rows.length === 0 ? 0 : from + rows.length - 1} của {total} mẫu email
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
        canEdit={canManage}
        onRetry={() => void detail.refetch()}
        onClose={closePreview}
      />
    </>
  )
}

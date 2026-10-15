import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Input,
  Pagination,
  Row,
  Select,
  Segmented,
  Table,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDate } from '@/lib/format'
import { useAuthStore } from '@/store/authStore'
import {
  PROJECT_STATUS,
  apiErrorMessage,
  labelOf,
  useProjectMutations,
  useProjects,
  type Project,
  type ProjectStatus,
} from '../api'
import { StatusPill, type StatusTone } from '@/components/common/StatusPill'
import { ProjectFormModal } from '../components/ProjectFormModal'
import { ProjectDetailModal } from '../components/ProjectDetailModal'
import { ProjectCard } from '../components/ProjectCard'

const statusTone: Record<ProjectStatus, StatusTone> = {
  PLANNING: 'amber',
  SELLING: 'green',
  SOLD_OUT: 'blue',
  CLOSED: 'gray',
}

export function ProjectsPage() {
  const { message, modal } = App.useApp()
  const [view, setView] = useState<'card' | 'table'>('card')
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<ProjectStatus | undefined>()
  const [investor, setInvestor] = useState<string | undefined>()
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(9)
  const [form, setForm] = useState<Project | null | undefined>(undefined)
  const [detailProjectId, setDetailProjectId] = useState<string>()
  const canManage = useAuthStore((s) => s.user?.role === 'ADMIN')
  const list = useProjects({ keyword: keyword || undefined, status, investor: investor || undefined, page, size, sort: 'createdAt,desc' }); const mutations = useProjectMutations()
  const investors = useMemo(() => [...new Set((list.data?.content ?? []).map((p) => p.investor).filter((v): v is string => Boolean(v)))], [list.data])
  const remove = (p: Project) => modal.confirm({ title: `Xoá dự án ${p.name}?`, content: 'Chỉ xoá được dự án chưa có sản phẩm.', okText: 'Xoá', cancelText: 'Huỷ', okButtonProps: { danger: true }, onOk: () => mutations.remove.mutateAsync(p.id).then(() => message.success('Đã xoá dự án')).catch((e) => { message.error(apiErrorMessage(e)); throw e }) })
  const openEdit = (project: Project) => { setDetailProjectId(undefined); setForm(project) }
  const columns: ColumnsType<Project> = [
    { title: 'Dự án', dataIndex: 'name', render: (v, p) => <button type="button" className="project-table__name" onClick={() => setDetailProjectId(p.id)}>{v}</button> }, { title: 'Địa điểm', dataIndex: 'location', render: (v) => v || '—' }, { title: 'Chủ đầu tư', dataIndex: 'investor', render: (v) => v || '—' }, { title: 'Trạng thái', dataIndex: 'status', width: 140, render: (v: ProjectStatus) => <StatusPill tone={statusTone[v]} size="sm">{labelOf(PROJECT_STATUS, v)}</StatusPill> }, { title: 'Cập nhật', dataIndex: 'updatedAt', render: formatDate }, { title: '', width: 54, render: (_, p) => <Dropdown menu={{ items: [{ key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined /> }, ...(canManage ? [{ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined /> }, { key: 'delete', label: 'Xoá', danger: true, icon: <DeleteOutlined /> }] : [])], onClick: ({ key }) => key === 'view' ? setDetailProjectId(p.id) : key === 'edit' ? openEdit(p) : remove(p) }}><Button type="text" icon={<MoreOutlined />} /></Dropdown> },
  ]
  return <><PageHeader breadcrumb={[{ title: 'Danh mục' }, { title: 'Dự án' }]} title="Danh sách dự án" status={<span className="pipe-scope"><span className="pipe-scope__dot" />Phạm vi: {canManage ? 'Toàn hệ thống (Admin)' : 'Danh mục dự án'}</span>} meta="Quản lý toàn bộ dự án bất động sản và theo dõi tình trạng triển khai." actions={<><Segmented value={view} onChange={(v) => setView(v as typeof view)} options={[{ label: 'Lưới card', value: 'card' }, { label: 'Bảng', value: 'table' }]} /><Button icon={<DownloadOutlined />} onClick={() => message.info('Xuất báo cáo cần API báo cáo dự án')}>Xuất dữ liệu</Button>{canManage && <Button type="primary" icon={<PlusOutlined />} onClick={() => setForm(null)}>Thêm dự án</Button>}</>} />
    <Card className="stitch-card crm-filter-card" variant="borderless" styles={{ body: { padding: '12px 16px' } }}>
      <div className="crm-filter-bar">
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          placeholder="Tìm theo tên dự án, địa điểm, chủ đầu tư..."
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(0) }}
          style={{ flex: '2 1 240px', minWidth: 200 }}
        />
        <Select
          allowClear
          placeholder="Tất cả trạng thái"
          value={status}
          onChange={(v) => { setStatus(v); setPage(0) }}
          options={PROJECT_STATUS}
          style={{ flex: '1 1 150px', minWidth: 130 }}
        />
        <Select
          allowClear
          placeholder="Tất cả chủ đầu tư"
          value={investor}
          onChange={(v) => { setInvestor(v); setPage(0) }}
          options={investors.map((value) => ({ value, label: value }))}
          style={{ flex: '1.2 1 170px', minWidth: 140 }}
        />
        {(keyword || status || investor) && (
          <Button
            className="crm-filter-clear-btn"
            icon={<ReloadOutlined />}
            onClick={() => { setKeyword(''); setStatus(undefined); setInvestor(undefined); setPage(0) }}
          >
            Xoá lọc
          </Button>
        )}
      </div>
    </Card>
    {view === 'table' ? (
      <Card className="stitch-card" variant="borderless" style={{ marginTop: 16 }}>
        <Table
          rowKey="id"
          loading={list.isLoading}
          columns={columns}
          dataSource={list.data?.content}
          scroll={{ x: 'max-content' }}
          pagination={false}
          locale={{ emptyText: list.isError ? apiErrorMessage(list.error) : 'Chưa có dự án phù hợp' }}
        />
      </Card>
    ) : (
      <Row gutter={[20, 20]} style={{ marginTop: 16 }}>
        {(list.data?.content ?? []).length === 0 && !list.isLoading && (
          <Col span={24}>
            <Card className="stitch-card" variant="borderless" style={{ textAlign: 'center', padding: '40px 0' }}>
              <Empty description={list.isError ? apiErrorMessage(list.error) : 'Chưa có dự án phù hợp'} />
            </Card>
          </Col>
        )}
        {(list.data?.content ?? []).map((p) => (
          <Col key={p.id} xs={24} sm={12} lg={8}>
            <ProjectCard
              project={p}
              canManage={canManage}
              onSelect={setDetailProjectId}
              onEdit={openEdit}
              onDelete={remove}
            />
          </Col>
        ))}
      </Row>
    )}
    <div className="project-pagination">
      <Pagination
        current={page + 1}
        pageSize={size}
        total={list.data?.totalElements ?? 0}
        showSizeChanger
        pageSizeOptions={[9, 18, 27]}
        onChange={(p, s) => {
          setPage(p - 1)
          setSize(s)
        }}
        showTotal={(total, range) => `Hiển thị ${range[0]} - ${range[1]} trên tổng số ${total} dự án`}
      />
    </div>
    <ProjectFormModal open={form !== undefined} editing={form ?? null} submitting={mutations.create.isPending || mutations.update.isPending || mutations.uploadProjectImage.isPending} onCancel={() => setForm(undefined)} onSubmit={(body, image) => { void (async () => { try { const saved = form ? await mutations.update.mutateAsync({ id: form.id, body }) : await mutations.create.mutateAsync(body); if (image) await mutations.uploadProjectImage.mutateAsync({ id: saved.id, file: image }); message.success(form ? 'Đã cập nhật dự án' : 'Đã tạo dự án'); setForm(undefined) } catch (e) { message.error(apiErrorMessage(e)) } })() }} />
    <ProjectDetailModal projectId={detailProjectId} onClose={() => setDetailProjectId(undefined)} onEdit={openEdit} />
  </>
}
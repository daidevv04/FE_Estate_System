import { ArrowLeftOutlined, DeleteOutlined, DownOutlined, SwapOutlined, WarningOutlined } from '@ant-design/icons'
import { App, Button, Card, Descriptions, Dropdown, Empty, Result, Skeleton, Space, Timeline, Typography } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import { useNavigate, useParams } from 'react-router-dom'
import { useCustomers, useStaff } from '@/features/customers/api'
import { formatDateTime } from '@/lib/format'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'
import { tokens as t } from '@/theme/tokens'
import {
  LEAD_STAGES, STAGE_LABEL, apiErrorMessage, fullVnd, overdueDays, shortDate,
  useLeadCatalog, useLeadMutations, useLead, useStageHistory, type LeadStage,
} from '../api'

import { StatusPill, type StatusTone } from '@/components/common/StatusPill'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const STAGE_TONE: Record<LeadStage, StatusTone> = {
  NEW: 'purple', CONTACTED: 'blue', INTERESTED: 'teal', PROPOSAL_SENT: 'teal',
  NEGOTIATION: 'amber', INTERNAL_REVIEW: 'purple', WON: 'green', LOST: 'red',
}

const SC: Record<LeadStage, string> = {
  NEW: '#8B5CF6', CONTACTED: '#3B82F6', INTERESTED: '#06B6D4', PROPOSAL_SENT: '#0D9488',
  NEGOTIATION: '#F59E0B', INTERNAL_REVIEW: '#A855F7', WON: '#16A34A', LOST: '#EF4444',
}

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const user = useAuthStore((s) => s.user)

  const lead = useLead(id), history = useStageHistory(id)
  const catalog = useLeadCatalog(), customers = useCustomers(), staff = useStaff()
  const { update, remove } = useLeadMutations()
  const l = lead.data
  const customer = (customers.data?.content ?? []).find((c) => c.id === l?.customerId)
  const product = (catalog.products.data?.content ?? []).find((p) => p.id === l?.productId)
  const project = product ? (catalog.projects.data?.content ?? []).find((pj) => pj.id === product.projectId) : undefined
  const owner = (staff.data ?? []).find((s) => s.id === l?.assignedTo)
  const staffName = (uid: string) => (staff.data ?? []).find((s) => s.id === uid)?.fullName ?? uid.slice(0, 8)
  const doMove = (stage: LeadStage) => { if (!l || l.stage === stage) return; update.mutate({ id: l.id, body: { stage } }, { onSuccess: () => message.success(`Đã chuyển sang «${STAGE_LABEL[stage]}»`), onError: (e) => message.error(apiErrorMessage(e)) }) }
  const doDelete = () => { if (!l) return; modal.confirm({ title: 'Xóa lead này?', okText: 'Xóa', cancelText: 'Hủy', okButtonProps: { danger: true }, onOk: () => remove.mutateAsync(l.id).then(() => { message.success('Đã xóa lead'); navigate(paths.leads) }).catch((e) => { message.error(apiErrorMessage(e)); throw e }) }) }

  if (lead.isLoading) return <Card className="stitch-card" variant="borderless"><Skeleton active paragraph={{ rows: 10 }} /></Card>
  if (lead.isError || !l) return <Result status="warning" title="Không tìm thấy lead" subTitle="Lead không tồn tại hoặc bạn không có quyền." extra={<Button onClick={() => navigate(paths.leads)}>Về Pipeline</Button>} />
  const overdue = overdueDays(l)
  const stageItems = LEAD_STAGES.filter((s) => s !== l.stage).map((s) => ({ key: s, label: `${LEAD_STAGES.indexOf(s) + 1}. ${STAGE_LABEL[s]}` }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header">
        <Space align="center" className="page-header__row" wrap>
          <Space align="center" className="page-header__title" wrap>
            <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(paths.leads)} />
            <Typography.Title level={4} style={{ margin: 0 }}>Lead · {customer?.fullName ?? `Khách #${l.customerId.slice(0, 8)}`}</Typography.Title>
            <StatusPill tone={STAGE_TONE[l.stage]} size="sm">{STAGE_LABEL[l.stage]}</StatusPill>
            {overdue > 0 && <Typography.Text type="danger" style={{ fontSize: 12 }}><WarningOutlined /> Quá hạn {overdue} ngày</Typography.Text>}
          </Space>
          <Space wrap className="page-header__actions">
            <Dropdown menu={{ items: stageItems, onClick: ({ key }) => doMove(key as LeadStage) }} disabled={update.isPending}><Button icon={<SwapOutlined />} loading={update.isPending}>Chuyển bước <DownOutlined /></Button></Dropdown>
            {user?.role === 'ADMIN' && <Button danger icon={<DeleteOutlined />} onClick={doDelete}>Xóa lead</Button>}
          </Space>
        </Space>
        <Typography.Text type="secondary" className="page-header__meta">Giá trị kỳ vọng {fullVnd(l.expectedValue)} · Hạn chốt {shortDate(l.closeDate)}</Typography.Text>
      </div>
      <Card className="stitch-card" variant="borderless" title="Thông tin lead">
        <Descriptions column={{ xs: 1, sm: 2 }} size="small" colon={false}>
          <Descriptions.Item label="Khách hàng">{customer?.fullName ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="SĐT khách">{customer?.phone ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Sản phẩm">{product ? `${product.code} · ${product.type}` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Dự án">{project?.name ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Giá trị kỳ vọng">{fullVnd(l.expectedValue)}</Descriptions.Item>
          <Descriptions.Item label="Hạn chốt"><span style={{ color: overdue > 0 ? t.colorError : undefined }}>{shortDate(l.closeDate)}</span></Descriptions.Item>
          <Descriptions.Item label="Phụ trách">{owner?.fullName ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Nguồn khách">{customer?.source ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">{formatDateTime(l.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="Cập nhật">{formatDateTime(l.updatedAt)}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card className="stitch-card" variant="borderless" title="Lịch sử chuyển bước" loading={history.isLoading}>
        {!history.data?.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thay đổi bước nào." /> : (
          <Timeline mode="left" items={[...history.data].sort((a, b) => b.changedAt.localeCompare(a.changedAt)).map((h) => ({
            color: SC[h.toStage] ?? t.colorTextMuted,
            children: (<div>
              <div style={{ fontWeight: 600 }}>{h.fromStage ? <>Từ <StatusPill tone={STAGE_TONE[h.fromStage]} size="sm">{STAGE_LABEL[h.fromStage]}</StatusPill> → <StatusPill tone={STAGE_TONE[h.toStage]} size="sm">{STAGE_LABEL[h.toStage]}</StatusPill></> : <>Khởi tạo ở bước <StatusPill tone={STAGE_TONE[h.toStage]} size="sm">{STAGE_LABEL[h.toStage]}</StatusPill></>}</div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>{staffName(h.changedBy)} · {dayjs(h.changedAt).fromNow()} ({formatDateTime(h.changedAt)})</Typography.Text>
            </div>),
          }))} />
        )}
      </Card>
    </div>
  )
}

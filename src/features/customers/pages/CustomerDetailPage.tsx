import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, MailOutlined, MessageOutlined, PhoneOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons'
import { App, Button, Card, Descriptions, Empty, Form, Input, Modal, Popconfirm, Result, Select, Skeleton, Space, Timeline, Typography } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDateTime } from '@/lib/format'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'
import { StatusPill, type StatusTone } from '@/components/common/StatusPill'
import {
  CARE_TYPE_LABEL, apiErrorMessage, customerCode,
  demandLabel, statusLabel, useCareMutations, useCustomer, useCustomerCares,
  useCustomerMutations, useStaff, type CareType, type Customer,
} from '../api'
import { CustomerFormModal } from '../components/CustomerFormModal'
import { SendCustomerEmailModal } from '../components/SendCustomerEmailModal'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const CARE_ICON: Record<CareType, React.ReactNode> = {
  CALL: <PhoneOutlined />, MEETING: <UserOutlined />, EMAIL: <MailOutlined />, NOTE: <MessageOutlined />,
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const user = useAuthStore((s) => s.user)
  const detail = useCustomer(id)
  const staff = useStaff()
  const cares = useCustomerCares(id)
  const { create: createCare, remove: removeCare } = useCareMutations(id)
  const { update, remove } = useCustomerMutations()
  const [editing, setEditing] = useState<Customer | null>(null)
  const [careOpen, setCareOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [careForm] = Form.useForm()

  const c = detail.data
  const staffList = staff.data ?? []
  const owner = staffList.find((s) => s.id === c?.ownerId)
  const staffName = (uid: string) => staffList.find((s) => s.id === uid)?.fullName ?? uid.slice(0, 8)
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const isOwner = Boolean(user?.id && c?.ownerId && user.id === c.ownerId)
  const canSendEmail = user?.role === 'MANAGER' || user?.role === 'SALES'
  const canEdit = canManage || isOwner

  const doDelete = () => { if (!c) return; modal.confirm({ title: `Xóa khách hàng ${c.fullName}?`, okText: 'Xóa', cancelText: 'Hủy', okButtonProps: { danger: true }, onOk: () => remove.mutateAsync(c.id).then(() => { message.success('Đã xóa'); navigate(paths.customers) }).catch((e) => { message.error(apiErrorMessage(e)); throw e }) }) }

  const submitCare = async () => {
    const values = await careForm.validateFields()
    createCare.mutate(values, { onSuccess: () => { message.success('Đã ghi nhận'); setCareOpen(false); careForm.resetFields() }, onError: (e) => message.error(apiErrorMessage(e)) })
  }

  if (detail.isLoading) return <Card className="stitch-card" variant="borderless"><Skeleton active paragraph={{ rows: 10 }} /></Card>
  if (detail.isError || !c) return <Result status="warning" title="Không tìm thấy khách hàng" extra={<Button onClick={() => navigate(paths.customers)}>Về danh sách</Button>} />

  const statusTone: StatusTone = ({ NEW: 'blue', POTENTIAL: 'amber', CUSTOMER: 'green', INACTIVE: 'gray' } as const)[c.status] ?? 'gray'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header">
        <Space align="center" className="page-header__row" wrap>
          <Space align="center" className="page-header__title" wrap>
            <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(paths.customers)} />
            <Typography.Title level={4} style={{ margin: 0 }}>{c.fullName}</Typography.Title>
            <StatusPill tone={statusTone} size="sm">{statusLabel(c.status)}</StatusPill>
          </Space>
          <Space wrap className="page-header__actions">
            {canSendEmail && <Button type="primary" icon={<MailOutlined />} onClick={() => setEmailModalOpen(true)}>Gửi email</Button>}
            {canEdit && <Button icon={<EditOutlined />} onClick={() => setEditing(c)}>Sửa</Button>}
            {user?.role === 'ADMIN' && <Button danger icon={<DeleteOutlined />} onClick={doDelete}>Xóa</Button>}
          </Space>
        </Space>
        <Typography.Text type="secondary" className="page-header__meta">{customerCode(c)} · Phụ trách: {owner?.fullName ?? 'Chưa phân công'}</Typography.Text>
      </div>

      <Card className="stitch-card" variant="borderless" title="Thông tin khách hàng">
        <Descriptions column={{ xs: 1, sm: 2 }} size="small" colon={false}>
          <Descriptions.Item label="Họ và tên">{c.fullName}</Descriptions.Item>
          <Descriptions.Item label="Mã khách">{customerCode(c)}</Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">{c.phone ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Email">{c.email ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Nhu cầu">{demandLabel(c.demandType)}</Descriptions.Item>
          <Descriptions.Item label="Nguồn">{c.source ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái"><StatusPill tone={statusTone} size="sm">{statusLabel(c.status)}</StatusPill></Descriptions.Item>
          <Descriptions.Item label="Phụ trách">{owner?.fullName ?? 'Chưa phân công'}</Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">{formatDateTime(c.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="Cập nhật">{formatDateTime(c.updatedAt)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        className="stitch-card"
        variant="borderless"
        title="Nhật ký chăm sóc"
        loading={cares.isLoading}
        extra={
          <Space>
            {canSendEmail && (
              <Button size="small" icon={<MailOutlined />} onClick={() => setEmailModalOpen(true)}>
                Gửi email
              </Button>
            )}
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setCareOpen(true)}>
              Ghi nhận
            </Button>
          </Space>
        }
      >
        {!cares.data?.content?.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có nhật ký chăm sóc." /> : (
          <Timeline items={cares.data.content.map((care) => ({
            dot: CARE_ICON[care.type],
            children: (<div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div><StatusPill tone="blue" dot={false} size="sm">{CARE_TYPE_LABEL[care.type]}</StatusPill> <Typography.Text style={{ fontSize: 12 }} type="secondary">{staffName(care.createdBy)} · {dayjs(care.createdAt).fromNow()}</Typography.Text></div>
                <Popconfirm title="Xóa ghi nhận này?" onConfirm={() => removeCare.mutate(care.id, { onSuccess: () => message.success('Đã xóa ghi nhận'), onError: (e) => message.error(apiErrorMessage(e)) })}>
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </div>
              <div style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{care.content}</div>
            </div>),
          }))} />
        )}
      </Card>

      <Modal open={careOpen} title="Ghi nhận chăm sóc" okText="Lưu" cancelText="Hủy" confirmLoading={createCare.isPending} onOk={submitCare} onCancel={() => { setCareOpen(false); careForm.resetFields() }} centered destroyOnHidden>
        <Form form={careForm} layout="vertical" initialValues={{ type: 'CALL' }}>
          <Form.Item name="type" label="Loại" rules={[{ required: true }]}><Select options={Object.entries(CARE_TYPE_LABEL).map(([value, label]) => ({ value, label }))} /></Form.Item>
          <Form.Item name="content" label="Nội dung" rules={[{ required: true, message: 'Nhập nội dung' }]}><Input.TextArea rows={4} maxLength={5000} showCount /></Form.Item>
        </Form>
      </Modal>

      <SendCustomerEmailModal
        open={emailModalOpen}
        customer={c ?? null}
        onClose={() => setEmailModalOpen(false)}
        onSuccess={() => void cares.refetch()}
      />

      {editing && <CustomerFormModal open editing={editing} staff={staffList} existing={[]} submitting={update.isPending} onCancel={() => setEditing(null)} onSubmit={(body) => update.mutate({ id: c.id, body }, { onSuccess: () => { message.success('Đã cập nhật'); setEditing(null); void detail.refetch() }, onError: (e) => message.error(apiErrorMessage(e)) })} />}
    </div>
  )
}

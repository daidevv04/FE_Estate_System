import { ArrowLeftOutlined, CheckOutlined, DeleteOutlined, EditOutlined, StopOutlined } from '@ant-design/icons'
import { App, Button, Card, Empty, Space } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { useCustomers, useStaff } from '@/features/customers/api'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'
import {
  apiErrorMessage, useAppointment, useAppointmentMutations,
  type Appointment, type AppointmentInput, type UUID,
} from '../api'
import { AppointmentDetail } from '../components/AppointmentDetail'
import { AppointmentFormModal } from '../components/AppointmentFormModal'

/** Chi tiết lịch hẹn khi truy cập trực tiếp bằng URL /appointments/:id (mục 9.11) */
export function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const user = useAuthStore((s) => s.user)
  const canViewAll = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const { data: appointment, isLoading, isError, error } = useAppointment(id)
  const { data: customerPage } = useCustomers()
  const { data: staff = [] } = useStaff()
  const { update, remove } = useAppointmentMutations()
  const [editOpen, setEditOpen] = useState(false)

  const customers = useMemo(() => customerPage?.content ?? [], [customerPage])
  const activeStaff = useMemo(() => staff.filter((u) => u.status !== 'INACTIVE'), [staff])
  const customerName = (cid: UUID) => customers.find((c) => c.id === cid)?.fullName ?? `Khách #${cid.slice(0, 8)}`
  const salesName = (sid: UUID) =>
    sid === user?.id
      ? `${user?.fullName ?? user?.username ?? 'Bạn'} (bạn)`
      : (staff.find((u) => u.id === sid)?.fullName ?? `Nhân viên #${sid.slice(0, 8)}`)

  const onError = (e: unknown) => message.error(apiErrorMessage(e))
  const a: Appointment | undefined = appointment

  const submitForm = (body: AppointmentInput) =>
    a &&
    update.mutate({ id: a.id, body }, {
      onSuccess: () => { message.success('Đã cập nhật lịch hẹn'); setEditOpen(false) },
      onError,
    })

  return (
    <>
      <PageHeader
        title="Chi tiết lịch hẹn"
        breadcrumb={[{ title: 'Trang chủ', href: paths.dashboard }, { title: 'Lịch hẹn', href: paths.appointments }, { title: 'Chi tiết' }]}
        meta={a ? `Tạo cho khách ${customerName(a.customerId)} · ${dayjs(a.startTime).format('DD/MM/YYYY')}` : undefined}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(paths.appointments)}>Về danh sách</Button>
            {a && (
              <Button type="primary" icon={<EditOutlined />} onClick={() => setEditOpen(true)}>Sửa</Button>
            )}
          </Space>
        }
      />

      <Card className="stitch-card" variant="borderless" loading={isLoading} styles={{ body: { padding: 24 } }}>
        {isError && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={`Không tải được lịch hẹn: ${apiErrorMessage(error)}`}
          />
        )}
        {a && (
          <>
            <AppointmentDetail appointment={a} customerName={customerName(a.customerId)} salesName={salesName(a.salesId)} />
            <Space wrap style={{ marginTop: 20 }}>
              {a.status !== 'DONE' && (
                <Button
                  icon={<CheckOutlined />}
                  onClick={() => update.mutate({ id: a.id, body: { status: 'DONE' } }, {
                    onSuccess: () => message.success('Đã đánh dấu hoàn thành'), onError,
                  })}
                >
                  Đánh dấu đã xong
                </Button>
              )}
              {a.status !== 'CANCELLED' && (
                <Button
                  danger icon={<StopOutlined />}
                  onClick={() =>
                    modal.confirm({
                      title: `Hủy lịch hẹn «${a.title}»?`,
                      content: 'Lịch vẫn được giữ trong hệ thống với trạng thái Đã hủy.',
                      okText: 'Hủy lịch hẹn', okButtonProps: { danger: true }, cancelText: 'Đóng',
                      onOk: () => update.mutateAsync({ id: a.id, body: { status: 'CANCELLED' } }),
                    })
                  }
                >
                  Hủy lịch hẹn
                </Button>
              )}
              <Button
                danger type="text" icon={<DeleteOutlined />}
                onClick={() =>
                  modal.confirm({
                    title: `Xóa vĩnh viễn lịch hẹn «${a.title}»?`,
                    content: 'Hành động này không hoàn tác được.',
                    okText: 'Xóa', okButtonProps: { danger: true }, cancelText: 'Đóng',
                    onOk: () => remove.mutateAsync(a.id).then(() => navigate(paths.appointments)),
                  })
                }
              >
                Xóa lịch hẹn
              </Button>
            </Space>
          </>
        )}
      </Card>

      {a && (
        <AppointmentFormModal
          open={editOpen}
          editing={a}
          defaultStart={null}
          customers={customers}
          staff={activeStaff}
          canAssign={canViewAll}
          existing={[a]}
          submitting={update.isPending}
          onCancel={() => setEditOpen(false)}
          onSubmit={submitForm}
        />
      )}
    </>
  )
}

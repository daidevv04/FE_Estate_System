import {
  CalendarOutlined, CheckOutlined, DeleteOutlined, EditOutlined, LeftOutlined, MoreOutlined,
  PlusOutlined, RightOutlined, SearchOutlined, StopOutlined, UnorderedListOutlined,
} from '@ant-design/icons'
import {
  App, Button, Card, DatePicker, Dropdown, Empty, Input, Modal, Segmented, Select, Space, Table, Tooltip, Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { paths } from '@/routes/paths'

import { PageHeader } from '@/components/layout/PageHeader'
import { useCustomers, useStaff } from '@/features/customers/api'
import { useAuthStore } from '@/store/authStore'
import { tokens as t } from '@/theme/tokens'
import {
  APPOINTMENT_STATUS, apiErrorMessage, appointmentCode, reminderLabel, startOfWeek,
  useAppointmentMutations, useAppointments, weekDays, weekRange,
  type Appointment, type AppointmentInput, type AppointmentStatus, type UUID,
} from '../api'
import { AppointmentDetail } from '../components/AppointmentDetail'
import { StatusPill, isOverdue } from '../components/AppointmentStatusPill'
import { AppointmentFormModal } from '../components/AppointmentFormModal'
import { Legend } from '../components/Legend'
import { WeekCalendar } from '../components/WeekCalendar'
import './AppointmentDetailModal.css'

const DATE = 'DD/MM/YYYY'
const hhmm = (v: string) => dayjs(v).format('HH:mm')

/** Lịch hẹn (mục 9.10) — ADMIN/MANAGER thấy toàn công ty, SALES thấy lịch của mình (backend ép) */
export function AppointmentsPage() {
  const { message, modal } = App.useApp()
  const user = useAuthStore((s) => s.user)
  const canViewAll = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  // Chế độ xem lưu ở ?view= (mục 9.10) — mặc định Lịch tuần
  const [searchParams, setSearchParams] = useSearchParams()
  const view: 'calendar' | 'list' = searchParams.get('view') === 'list' ? 'list' : 'calendar'

  const [weekStart, setWeekStart] = useState(() => startOfWeek())
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<AppointmentStatus | undefined>()
  const [salesId, setSalesId] = useState<UUID | undefined>()
  const [customerId, setCustomerId] = useState<UUID | undefined>()

  const [detail, setDetail] = useState<Appointment | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [defaultStart, setDefaultStart] = useState<Dayjs | null>(null)

  const range = useMemo(() => weekRange(weekStart), [weekStart])
  const { data, isLoading, isFetching, isError, error } = useAppointments({ ...range, status, salesId, customerId })
  const { data: customerPage } = useCustomers()
  const { data: staff = [] } = useStaff()
  const { create, update, remove } = useAppointmentMutations()

  const customers = useMemo(() => customerPage?.content ?? [], [customerPage])
  const customerById = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers])
  /** Ẩn nhân viên đã ngừng hoạt động khỏi mọi lựa chọn, nhưng tên trên lịch cũ vẫn hiển thị được */
  const activeStaff = useMemo(() => staff.filter((u) => u.status !== 'INACTIVE'), [staff])
  const staffById = useMemo(() => new Map(staff.map((u) => [u.id, u])), [staff])

  const customerName = (id: UUID) => customerById.get(id)?.fullName ?? `Khách #${id.slice(0, 8)}`
  const customerPhone = (id: UUID) => customerById.get(id)?.phone ?? ''
  const salesName = (id: UUID) =>
    id === user?.id
      ? `${user?.fullName ?? user?.username ?? 'Bạn'} (bạn)`
      : (staffById.get(id)?.fullName ?? `Nhân viên #${id.slice(0, 8)}`)

  const rows = data?.content ?? []
  /** Backend không có tham số keyword → tìm theo tên khách / SĐT / tiêu đề trên tuần đang tải */
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return rows
    return rows.filter((a) =>
      [a.title, customerById.get(a.customerId)?.fullName ?? '', customerById.get(a.customerId)?.phone ?? '']
        .some((v) => v.toLowerCase().includes(kw)),
    )
  }, [rows, keyword, customerById])

  /** Số liệu chỉ tính trong khoảng đang xem + bộ lọc hiện tại (không bịa số toàn hệ thống) */
  const stats = useMemo(() => {
    const now = dayjs()
    const todayKey = now.format('YYYY-MM-DD')
    const active = filtered.filter((a) => a.status !== 'CANCELLED')
    return {
      today: filtered.filter((a) => dayjs(a.startTime).format('YYYY-MM-DD') === todayKey).length,
      upcoming: active.filter((a) => dayjs(a.startTime).isAfter(now)).length,
      pending: filtered.filter((a) => a.status === 'PENDING').length,
      done: filtered.filter((a) => a.status === 'DONE').length,
      overdue: filtered.filter((a) => isOverdue(a.status, a.endTime)).length,
      cancelled: filtered.filter((a) => a.status === 'CANCELLED').length,
    }
  }, [filtered])

  const hasFilters = Boolean(keyword || status || salesId || customerId)
  const resetFilters = () => {
    setKeyword('')
    setStatus(undefined)
    setSalesId(undefined)
    setCustomerId(undefined)
  }

  const days = useMemo(() => weekDays(weekStart), [weekStart])
  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
    setDefaultStart(null)
  }
  const onError = (e: unknown) => message.error(apiErrorMessage(e))

  const openCreate = (start?: Dayjs) => {
    setEditing(null)
    setDefaultStart(start ?? null)
    setFormOpen(true)
  }
  const openEdit = (a: Appointment) => {
    setDetail(null)
    setEditing(a)
    setDefaultStart(null)
    setFormOpen(true)
  }

  /**
   * Tạo/sửa lịch: chỉ đóng modal khi API báo thành công — lỗi 409 (trùng giờ) phải sửa
   * ngay trên form, không để người dùng tưởng đã đặt được.
   */
  const submitForm = (body: AppointmentInput) => {
    if (editing) {
      update.mutate(
        { id: editing.id, body },
        { onSuccess: () => { message.success('Đã cập nhật lịch hẹn'); closeForm() }, onError },
      )
      return
    }
    create.mutate(body, {
      onSuccess: () => {
        message.success('Đã tạo lịch hẹn mới')
        closeForm()
        // Lịch có thể được chọn ở tuần khác → nhảy tới đúng tuần đó để thấy ngay kết quả
        setWeekStart(startOfWeek(dayjs(body.startTime)))
      },
      onError,
    })
  }

  const setStatusQuick = (a: Appointment, next: AppointmentStatus, doneMsg: string) =>
    update.mutate({ id: a.id, body: { status: next } }, {
      onSuccess: () => { message.success(doneMsg); setDetail(null) },
      onError,
    })

  const cancelOne = (a: Appointment) =>
    modal.confirm({
      title: `Hủy lịch hẹn «${a.title}»?`,
      content: 'Lịch vẫn được giữ trong hệ thống với trạng thái Đã hủy.',
      okText: 'Hủy lịch hẹn', okButtonProps: { danger: true }, cancelText: 'Đóng',
      onOk: () => update.mutateAsync({ id: a.id, body: { status: 'CANCELLED' } }),
    })

  const deleteOne = (a: Appointment) =>
    modal.confirm({
      title: `Xóa vĩnh viễn lịch hẹn «${a.title}»?`,
      content: 'Hành động này không hoàn tác được. Nếu chỉ muốn dừng lịch, hãy dùng "Hủy lịch hẹn".',
      okText: 'Xóa', okButtonProps: { danger: true }, cancelText: 'Đóng',
      onOk: () => remove.mutateAsync(a.id).then(() => setDetail(null)),
    })


  const columns: ColumnsType<Appointment> = [
    {
      title: 'Ngày & giờ', dataIndex: 'startTime', width: 150,
      render: (_v, row) => (
        <div style={{ lineHeight: 1.3 }}>
          <div className="stitch-num" style={{ fontWeight: 600 }}>{dayjs(row.startTime).format(DATE)}</div>
          <div className="stitch-num" style={{ fontSize: 12.5, color: t.colorTextMuted }}>
            {hhmm(row.startTime)} – {hhmm(row.endTime)}
          </div>
        </div>
      ),
    },
    {
      title: 'Tiêu đề lịch hẹn', dataIndex: 'title', width: 216,
      render: (title: string, row) => (
        <div style={{ lineHeight: 1.3 }}>
          <div style={{ fontWeight: 600 }}>{title}</div>
          <div className="stitch-num" style={{ fontSize: 12, color: t.colorTextMuted }}>{appointmentCode(row)}</div>
        </div>
      ),
    },
    {
      title: 'Khách hàng', dataIndex: 'customerId', width: 170,
      render: (id: UUID) => (
        <div style={{ lineHeight: 1.3 }}>
          <div>{customerName(id)}</div>
          <div className="stitch-num" style={{ fontSize: 12, color: t.colorTextMuted }}>{customerPhone(id) || '—'}</div>
        </div>
      ),
    },
    { title: 'Nhân viên phụ trách', dataIndex: 'salesId', width: 150, render: (id: UUID) => salesName(id) },
    {
      title: 'Trạng thái', dataIndex: 'status', width: 130,
      render: (s: AppointmentStatus, row) => <StatusPill status={s} overdue={isOverdue(s, row.endTime)} />,
    },
    { title: 'Nhắc trước', dataIndex: 'reminderMinutes', width: 110, render: (m: number | null) => reminderLabel(m) },
    {
      title: 'Thao tác', key: 'action', width: 84, align: 'center',
      render: (_v, row) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'view', label: 'Xem chi tiết', onClick: () => setDetail(row) },
              { key: 'edit', icon: <EditOutlined />, label: 'Cập nhật', onClick: () => openEdit(row) },
              ...(row.status !== 'DONE'
                ? [{ key: 'done', icon: <CheckOutlined />, label: 'Đánh dấu đã xong', onClick: () => setStatusQuick(row, 'DONE', 'Đã đánh dấu hoàn thành') }]
                : []),
              ...(row.status !== 'CANCELLED'
                ? [{ key: 'cancel', icon: <StopOutlined />, label: 'Hủy lịch hẹn', onClick: () => void cancelOne(row) }]
                : []),
              { type: 'divider' as const },
              { key: 'del', icon: <DeleteOutlined />, label: 'Xóa lịch hẹn', danger: true, onClick: () => void deleteOne(row) },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} aria-label={`Thao tác với ${row.title}`} />
        </Dropdown>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Lịch hẹn"
        breadcrumb={[{ title: 'Trang chủ', href: paths.dashboard }, { title: 'Lịch hẹn' }]}
        meta={
          canViewAll
            ? `Quản lý lịch hẹn khách hàng trên toàn hệ thống · Tuần ${weekStart.format(DATE)} – ${weekStart.add(6, 'day').format(DATE)}`
            : `Lịch hẹn của bạn · Tuần ${weekStart.format(DATE)} – ${weekStart.add(6, 'day').format(DATE)}`
        }
        status={
          <Space size={8} wrap>
            <Tooltip title="Số lịch hẹn trong hôm nay (theo bộ lọc hiện tại)">
              <span className="stitch-pill" style={{ background: t.colorBrandBg, color: t.colorBrandActive }}>
                <span className="stitch-pill__dot" style={{ background: t.colorSuccess }} />
                Hôm nay: {stats.today}
              </span>
            </Tooltip>
            <Tooltip title="Lịch chưa tới giờ trong tuần đang xem">
              <span className="stitch-pill" style={{ background: t.colorInfoBg, color: t.colorInfoText }}>
                <span className="stitch-pill__dot" style={{ background: t.colorInfo }} />
                Sắp diễn ra: {stats.upcoming}
              </span>
            </Tooltip>
          </Space>
        }
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>
            Thêm lịch hẹn
          </Button>
        }
      />

      <Card className="stitch-card" variant="borderless" style={{ marginBottom: 16 }} styles={{ body: { padding: 16 } }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', minWidth: 0 }}>
            <Tooltip title="Tuần trước">
              <Button icon={<LeftOutlined />} aria-label="Tuần trước" onClick={() => setWeekStart((w) => w.subtract(7, 'day'))} />
            </Tooltip>
            <Button onClick={() => setWeekStart(startOfWeek())}>Hôm nay</Button>
            <Tooltip title="Tuần sau">
              <Button icon={<RightOutlined />} aria-label="Tuần sau" onClick={() => setWeekStart((w) => w.add(7, 'day'))} />
            </Tooltip>
            <DatePicker
              value={weekStart}
              allowClear={false}
              inputReadOnly
              format={DATE}
              onChange={(d) => d && setWeekStart(startOfWeek(d))}
              style={{ width: 140 }}
              aria-label="Chọn tuần cần xem"
            />
            <Typography.Text strong className="stitch-num" style={{ minWidth: 0 }}>
              {weekStart.format(DATE)} – {weekStart.add(6, 'day').format(DATE)}
            </Typography.Text>
          </div>

          <Segmented
            value={view}
            onChange={(v) => setSearchParams(v === 'list' ? { view: 'list' } : {}, { replace: true })}
            options={[
              { value: 'calendar', label: 'Lịch tuần', icon: <CalendarOutlined /> },
              { value: 'list', label: 'Danh sách', icon: <UnorderedListOutlined /> },
            ]}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm theo tên khách, số điện thoại hoặc tiêu đề lịch hẹn..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ flex: '1 1 220px', minWidth: 0, maxWidth: 340 }}
          />
          <Select
            allowClear placeholder="Tất cả trạng thái"
            value={status} onChange={setStatus} options={APPOINTMENT_STATUS}
            style={{ flex: '1 1 150px', minWidth: 0, maxWidth: 180 }}
          />
          {canViewAll && (
            <Select
              allowClear showSearch optionFilterProp="label" placeholder="Tất cả Sales"
              value={salesId} onChange={setSalesId}
              options={activeStaff.map((u) => ({ value: u.id, label: u.fullName }))}
              style={{ flex: '1 1 170px', minWidth: 0, maxWidth: 200 }}
            />
          )}
          <Select
            allowClear showSearch optionFilterProp="label" placeholder="Tất cả khách hàng"
            value={customerId} onChange={setCustomerId}
            options={customers.map((c) => ({ value: c.id, label: `${c.fullName}${c.phone ? ` · ${c.phone}` : ''}` }))}
            style={{ flex: '1 1 190px', minWidth: 0, maxWidth: 230 }}
          />
          <Button onClick={resetFilters} disabled={!hasFilters}>Xóa lọc</Button>
          {isFetching && !isLoading && (
            <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>Đang tải...</Typography.Text>
          )}
        </div>
      </Card>


      <Card className="stitch-card" variant="borderless" styles={{ body: { padding: view === 'calendar' ? 16 : 20 } }}>
        {isError && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: 32 }}
            description={`Không tải được lịch hẹn: ${apiErrorMessage(error)}`}
          />
        )}

        {!isError && view === 'calendar' && (
          <>
            <WeekCalendar
              days={days}
              appointments={filtered}
              customerName={customerName}
              salesName={salesName}
              onOpen={setDetail}
              onCreateAt={(start) => openCreate(start)}
            />
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.colorBorder}`, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
              <Legend color={t.colorSuccess} label="Đã hoàn thành" count={stats.done} />
              <Legend color={t.colorWarning} label="Chờ diễn ra" count={stats.pending} />
              <Legend color={t.colorError} label="Quá hạn" count={stats.overdue} />
              <Legend color={t.colorBorderStrong} label="Đã hủy" count={stats.cancelled} />
              <Typography.Text type="secondary" style={{ fontSize: 12, flex: '1 1 180px', minWidth: 0 }}>
                Số lượng tính trong tuần đang xem và bộ lọc hiện tại
              </Typography.Text>
            </div>
          </>
        )}

        {!isError && view === 'list' && (
          <Table<Appointment>
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            loading={isLoading}
            scroll={{ x: 'max-content' }}
            onRow={(row) => ({ onClick: () => setDetail(row), style: { cursor: 'pointer' } })}
            locale={{
              emptyText: hasFilters
                ? 'Không tìm thấy kết quả phù hợp — thử xóa bộ lọc'
                : 'Chưa có lịch hẹn nào trong tuần này',
            }}
            pagination={{
              defaultPageSize: 10,
              pageSizeOptions: [10, 20, 50],
              showSizeChanger: true,
              showTotal: (total, r) => `Hiển thị ${r[0]} - ${r[1]} trong tổng số ${total} lịch hẹn`,
            }}
          />
        )}
      </Card>


      <Modal
        open={Boolean(detail)}
        onCancel={() => setDetail(null)}
        width={880}
        className="appointment-detail-modal"
        destroyOnHidden
        title="Chi tiết lịch hẹn"
        footer={
          detail && (
            <div className="appointment-detail-modal__footer"><Typography.Text>Thông tin được tải mới từ hệ thống CRM.</Typography.Text><Space wrap>
              <Button onClick={() => setDetail(null)}>Đóng</Button>
              {detail.status !== 'DONE' && (
                <Button icon={<CheckOutlined />} onClick={() => setStatusQuick(detail, 'DONE', 'Đã đánh dấu hoàn thành')}>
                  Đánh dấu đã xong
                </Button>
              )}
              {detail.status !== 'CANCELLED' && (
                <Button danger icon={<StopOutlined />} onClick={() => void cancelOne(detail)}>Hủy lịch hẹn</Button>
              )}
              <Button type="primary" icon={<EditOutlined />} onClick={() => openEdit(detail)}>Sửa</Button>
            </Space></div>
          )
        }
      >
        {detail && (
          <AppointmentDetail
            appointment={detail}
            customerName={customerName(detail.customerId)}
            salesName={salesName(detail.salesId)}
          />
        )}
      </Modal>

      <AppointmentFormModal
        open={formOpen}
        editing={editing}
        defaultStart={defaultStart}
        customers={customers}
        staff={activeStaff}
        canAssign={canViewAll}
        existing={rows}
        submitting={create.isPending || update.isPending}
        onCancel={closeForm}
        onSubmit={submitForm}
      />
    </>
  )
}



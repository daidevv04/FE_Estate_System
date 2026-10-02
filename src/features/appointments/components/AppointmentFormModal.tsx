import { Alert, Col, ConfigProvider, DatePicker, Form, Input, Modal, Radio, Row, Select, Space } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useMemo } from 'react'
import { tokens as t } from '@/theme/tokens'
import type { Customer, StaffUser } from '@/features/customers/api'
import { customerCode } from '@/features/customers/api'
import {
  APPOINTMENT_STATUS, EVENT_COLORS, eventColor, wallClock,
  type Appointment, type AppointmentInput,
} from '../api'

interface Values {
  customerId: string
  salesId?: string
  title: string
  startTime: Dayjs
  endTime: Dayjs
  color: string
  reminderMinutes: number
  status?: Appointment['status']
}

interface Props {
  open: boolean
  editing: Appointment | null
  /** Giờ đã chọn khi bấm ô trống trên lịch tuần */
  defaultStart?: Dayjs | null
  customers: Customer[]
  staff: StaffUser[]
  /** ADMIN/MANAGER được chọn Sales phụ trách; SALES bị backend ép về chính mình */
  canAssign: boolean
  /** Lịch đang có trong tuần đang xem — chỉ để CẢNH BÁO trùng giờ trước khi gửi */
  existing: Appointment[]
  submitting: boolean
  onCancel: () => void
  onSubmit: (values: AppointmentInput) => void
}

const fmt = 'DD/MM/YYYY HH:mm'
/** Khung cuộn của modal: panel lịch/select gắn vào đây để antd đo được chỗ trống và tự lật lên */
const popInModal = (node?: HTMLElement) => (node?.closest('.ant-modal-body') as HTMLElement) ?? document.body

/**
 * Modal có thể cao hơn viewport (màn thấp) → panel chọn ngày/giờ bị cắt ở đáy.
 * Khi mở panel, kéo ô đang chọn lên sát đỉnh khung cuộn để panel còn chỗ hiển thị.
 */
const revealOpenField = () => {
  const input = document.activeElement as HTMLElement | null
  const scroller = input?.closest<HTMLElement>('.ant-modal-body')
  if (!input || !scroller || scroller.scrollHeight <= scroller.clientHeight) return
  const offset = input.getBoundingClientRect().top - scroller.getBoundingClientRect().top
  scroller.scrollTo({ top: Math.max(0, scroller.scrollTop + offset - 12), behavior: 'smooth' })
}

/** Form Thêm/Sửa lịch hẹn — chỉ field có thật trong CreateAppointmentRequest/UpdateAppointmentRequest */
export function AppointmentFormModal({
  open, editing, defaultStart, customers, staff, canAssign, existing, submitting, onCancel, onSubmit,
}: Props) {
  const [form] = Form.useForm<Values>()
  const startTime = Form.useWatch('startTime', form)
  const endTime = Form.useWatch('endTime', form)
  const salesId = Form.useWatch('salesId', form)
  const color = Form.useWatch('color', form)

  useEffect(() => {
    if (!open) return
    const start = defaultStart ?? dayjs().add(1, 'hour').startOf('hour')
    form.setFieldsValue(
      editing
        ? {
            customerId: editing.customerId,
            salesId: editing.salesId,
            title: editing.title,
            startTime: dayjs(editing.startTime),
            endTime: dayjs(editing.endTime),
            color: eventColor(editing.color),
            reminderMinutes: editing.reminderMinutes ?? 30,
            status: editing.status,
          }
        : {
            customerId: undefined as unknown as string,
            title: '',
            startTime: start,
            endTime: start.add(1, 'hour'),
            color: EVENT_COLORS[0].value,
            reminderMinutes: 30,
          },
    )
  }, [open, editing, defaultStart, canAssign, form])

  /** Trùng giờ với lịch đã có của cùng sales trong tuần đang xem (backend chặn bằng 409) */
  const clash = useMemo(() => {
    if (!startTime || !endTime || !endTime.isAfter(startTime)) return null
    const key = (salesId ?? editing?.salesId) as string | undefined
    return (
      existing.find(
        (a) =>
          a.id !== editing?.id &&
          a.status !== 'CANCELLED' &&
          (!key || a.salesId === key) &&
          dayjs(a.startTime).isBefore(endTime) &&
          dayjs(a.endTime).isAfter(startTime),
      ) ?? null
    )
  }, [existing, startTime, endTime, salesId, editing])

  const submit = (v: Values) => {
    const body: AppointmentInput = {
      title: v.title.trim(),
      startTime: wallClock(v.startTime),
      endTime: wallClock(v.endTime),
      color: v.color,
      reminderMinutes: v.reminderMinutes,
      salesId: canAssign ? v.salesId ?? null : undefined,
    }
    if (!editing) body.customerId = v.customerId
    if (editing) body.status = v.status ?? editing.status
    onSubmit(body)
  }


  return (
    <Modal
      open={open}
      title={editing ? `Cập nhật lịch hẹn ${editing.title}` : 'Thêm lịch hẹn mới'}
      width={720}
      okText={editing ? 'Lưu thay đổi' : 'Đặt lịch hẹn'}
      cancelText="Hủy"
      confirmLoading={submitting}
      maskClosable={false}
      onCancel={onCancel}
      onOk={() => form.submit()}
      styles={{ body: { maxHeight: 'calc(100vh - 230px)', overflowY: 'auto' } }}
    >
      <ConfigProvider getPopupContainer={popInModal}>
      <Form form={form} layout="vertical" onFinish={submit} requiredMark>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="customerId"
              label="Khách hàng"
              rules={[{ required: !editing, message: 'Vui lòng chọn khách hàng' }]}
            >
              {editing ? (
                // UpdateAppointmentRequest không có customerId → chỉ hiển thị, muốn đổi khách thì tạo lịch mới
                <Input disabled value={customers.find((c) => c.id === editing.customerId)?.fullName ?? editing.customerId} />
              ) : (
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Tìm theo tên hoặc số điện thoại"
                  options={customers.map((c) => ({
                    value: c.id,
                    label: `${c.fullName}${c.phone ? ` · ${c.phone}` : ''} (${customerCode(c)})`,
                  }))}
                />
              )}
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="salesId"
              label="Nhân viên phụ trách"
              extra={canAssign ? undefined : 'Tài khoản SALES: backend luôn xếp lịch cho chính bạn'}
            >
              <Select
                allowClear
                showSearch
                disabled={!canAssign}
                optionFilterProp="label"
                placeholder={canAssign ? 'Để trống = chính bạn' : 'Chính bạn'}
                options={staff.map((u) => ({ value: u.id, label: u.fullName }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="title"
          label="Tiêu đề lịch hẹn"
          rules={[
            { required: true, message: 'Vui lòng nhập tiêu đề lịch hẹn' },
            { max: 200, message: 'Tiêu đề tối đa 200 ký tự (giới hạn của backend)' },
          ]}
        >
          <Input maxLength={200} showCount placeholder="Gặp khách xem nhà mẫu" />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="startTime"
              label="Thời gian bắt đầu"
              rules={[
                { required: true, message: 'Vui lòng chọn thời gian bắt đầu' },
                {
                  validator: (_r, v: Dayjs) =>
                    !v || editing || v.isAfter(dayjs())
                      ? Promise.resolve()
                      : Promise.reject(new Error('Thời gian bắt đầu phải ở tương lai')),
                },
              ]}
            >
              <DatePicker
                showTime={{ format: 'HH:mm' }}
                format={fmt}
                style={{ width: '100%' }}
                placeholder="Chọn ngày và giờ"
                disabledDate={(d) => !editing && d.isBefore(dayjs().startOf('day'))}
                onOpenChange={(o) => { if (o) revealOpenField() }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="endTime"
              label="Thời gian kết thúc"
              dependencies={['startTime']}
              rules={[
                { required: true, message: 'Vui lòng chọn thời gian kết thúc' },
                ({ getFieldValue }) => ({
                  validator: (_r, v: Dayjs) =>
                    !v || !getFieldValue('startTime') || v.isAfter(getFieldValue('startTime'))
                      ? Promise.resolve()
                      : Promise.reject(new Error('Thời gian kết thúc phải sau thời gian bắt đầu')),
                }),
              ]}
            >
              <DatePicker
                showTime={{ format: 'HH:mm' }}
                format={fmt}
                style={{ width: '100%' }}
                placeholder="Chọn ngày và giờ"
                onOpenChange={(o) => { if (o) revealOpenField() }}
              />
            </Form.Item>
          </Col>
        </Row>

        {clash && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="Khung giờ này đã có lịch hẹn khác, vui lòng chọn giờ khác"
            description={`«${clash.title}» · ${dayjs(clash.startTime).format(fmt)} – ${dayjs(clash.endTime).format('HH:mm')}`}
          />
        )}

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="reminderMinutes" label="Nhắc trước">
              <Select
                options={[
                  { value: 0, label: 'Không nhắc' },
                  { value: 15, label: 'Trước 15 phút' },
                  { value: 30, label: 'Trước 30 phút' },
                  { value: 60, label: 'Trước 1 giờ' },
                  { value: 120, label: 'Trước 2 giờ' },
                  { value: 1440, label: 'Trước 1 ngày' },
                ]}
              />
            </Form.Item>
          </Col>
          {editing && (
            <Col xs={24} md={12}>
              <Form.Item name="status" label="Trạng thái">
                <Select options={APPOINTMENT_STATUS} />
              </Form.Item>
            </Col>
          )}
        </Row>

        <Form.Item name="color" label="Màu lịch hẹn">
          <Radio.Group>
            <Space wrap size={10}>
              {EVENT_COLORS.map((c) => (
                <Radio.Button key={c.value} value={c.value} aria-label={c.label}>
                  <span
                    style={{
                      display: 'inline-block', width: 14, height: 14, marginInlineEnd: 6,
                      borderRadius: 4, background: c.value, verticalAlign: -2,
                    }}
                  />
                  {c.label}
                </Radio.Button>
              ))}
            </Space>
          </Radio.Group>
        </Form.Item>

        <div style={{ fontSize: 12.5, color: t.colorTextMuted }}>
          Thẻ lịch dùng màu đang chọn {color ? `(${color})` : ''} — trạng thái vẫn hiện bằng nhãn chữ, không chỉ bằng màu.
        </div>
      </Form>
      </ConfigProvider>
    </Modal>
  )
}


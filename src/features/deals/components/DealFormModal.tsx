import { DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'
import {
  APPROVAL_STATUS_OPTIONS, DEAL_STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_OPTIONS,
  type Deal, type DealInput, type DealStatus, type PaymentStatus, type UUID,
} from '../api'

interface Ref {
  id: UUID
  label: string
}

interface FormValues {
  leadId?: UUID
  contractCode: string
  contractValue: number
  depositAmount?: number | null
  depositDate?: dayjs.Dayjs | null
  signedDate?: dayjs.Dayjs | null
  paymentStatus?: PaymentStatus
  paymentMethod?: string | null
  approvalStatus?: string
  status?: DealStatus
  fileUrl?: string | null
  note?: string | null
  salesId?: UUID | null
}

interface Props {
  open: boolean
  editing: Deal | null
  /** Lead đủ điều kiện tạo hợp đồng (stage WON và chưa có hợp đồng) — xem DealService.create */
  leadOptions: Ref[]
  staffOptions: Ref[]
  canAssign: boolean
  canApprove: boolean
  submitting: boolean
  onCancel: () => void
  onSubmit: (body: DealInput) => void
}

const money = {
  formatter: (v: number | string | undefined | null) =>
    (v == null || v === '' ? '' : new Intl.NumberFormat('vi-VN').format(Number(v))),
  parser: (v: string | undefined) => Number((v ?? '').replace(/[^\d]/g, '')) as unknown as number,
}

/** Modal tạo/sửa hợp đồng — chỉ dựng đúng field CreateDealRequest/UpdateDealRequest hỗ trợ */
export function DealFormModal({
  open, editing, leadOptions, staffOptions, canAssign, canApprove, submitting, onCancel, onSubmit,
}: Props) {
  const [form] = Form.useForm<FormValues>()
  const isEdit = Boolean(editing)

  useEffect(() => {
    if (!open) return
    form.resetFields()
    if (editing) {
      form.setFieldsValue({
        contractCode: editing.contractCode,
        contractValue: editing.contractValue ?? 0,
        depositAmount: editing.depositAmount,
        depositDate: editing.depositDate ? dayjs(editing.depositDate) : null,
        signedDate: editing.signedDate ? dayjs(editing.signedDate) : null,
        paymentStatus: editing.paymentStatus,
        paymentMethod: editing.paymentMethod ?? undefined,
        approvalStatus: editing.approvalStatus,
        status: editing.status,
        fileUrl: editing.fileUrl,
        note: editing.note,
        salesId: editing.salesId,
      })
    }
  }, [open, editing, form])

  const leadSelect = useMemo(
    () => leadOptions.map((l) => ({ value: l.id, label: l.label })),
    [leadOptions],
  )

  return (
    <Modal
      open={open}
      title={isEdit ? `Sửa hợp đồng ${editing?.contractCode ?? ''}` : 'Thêm hợp đồng mới'}
      width={720}
      destroyOnClose
      okText={isEdit ? 'Lưu thay đổi' : 'Tạo hợp đồng'}
      cancelText="Hủy"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={() => {
        void form.validateFields().then((v) => {
          const body: DealInput = {
            contractCode: v.contractCode.trim(),
            contractValue: v.contractValue,
            depositAmount: v.depositAmount ?? null,
            depositDate: v.depositDate ? v.depositDate.format('YYYY-MM-DD') : null,
            signedDate: v.signedDate ? v.signedDate.format('YYYY-MM-DD') : null,
            paymentStatus: v.paymentStatus,
            paymentMethod: (v.paymentMethod as DealInput['paymentMethod']) ?? null,
            status: v.status,
            fileUrl: v.fileUrl?.trim() || null,
            note: v.note ?? null,
          }
          // Trạng thái duyệt chỉ ADMIN/MANAGER gửi được (DealService.update chặn 403 cho SALES)
          if (!isEdit) body.leadId = v.leadId
          if (canApprove) body.approvalStatus = v.approvalStatus as DealInput['approvalStatus']
          if (canAssign && v.salesId) body.salesId = v.salesId
          onSubmit(body)
        })
      }}
    >
      <Form<FormValues>
        form={form}
        layout="vertical"
        initialValues={{ status: 'IN_PROGRESS' as DealStatus, paymentStatus: 'UNPAID' as PaymentStatus }}
        style={{ marginTop: 8 }}
      >
        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item
            name="leadId"
            label="Lead đã chốt (WON)"
            style={{ flex: 1 }}
            rules={isEdit ? [] : [{ required: true, message: 'Chọn lead đã chốt thắng' }]}
            extra={isEdit ? 'Không đổi được lead của hợp đồng' : 'Chỉ hiện lead stage WON chưa có hợp đồng'}
          >
            <Select
              id="leadId"
              disabled={isEdit}
              showSearch
              optionFilterProp="label"
              placeholder="Tìm theo tên khách / mã căn"
              options={leadSelect}
            />
          </Form.Item>
          <Form.Item
            name="contractCode"
            label="Mã hợp đồng"
            style={{ flex: 1 }}
            rules={[
              { required: true, message: 'Nhập mã hợp đồng' },
              { max: 50, message: 'Tối đa 50 ký tự' },
            ]}
            extra="Backend không tự sinh mã — nhập theo quy tắc công ty (VD HD-2026-0012)"
          >
            <Input id="contractCode" placeholder="HD-2026-0012" />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item
            name="contractValue"
            label="Giá trị hợp đồng (đ)"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Nhập giá trị hợp đồng' }]}
          >
            <InputNumber id="contractValue" style={{ width: '100%' }} min={0} step={100_000_000} {...money} />
          </Form.Item>
          <Form.Item
            name="depositAmount"
            label="Tiền đặt cọc (đ)"
            style={{ flex: 1 }}
            dependencies={['contractValue']}
            rules={[
              ({ getFieldValue }) => ({
                validator: (_, value) => {
                  const total = getFieldValue('contractValue') as number | undefined
                  if (value == null || total == null || Number(value) <= Number(total)) return Promise.resolve()
                  return Promise.reject(new Error('Tiền đặt cọc không được lớn hơn giá trị hợp đồng'))
                },
              }),
            ]}
            extra="Backend chặn deposit > giá trị hợp đồng"
          >
            <InputNumber id="depositAmount" style={{ width: '100%' }} min={0} step={50_000_000} {...money} />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="depositDate" label="Ngày đặt cọc" style={{ flex: 1 }}>
            <DatePicker id="depositDate" style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="dd/mm/yyyy" />
          </Form.Item>
          <Form.Item name="signedDate" label="Ngày ký" style={{ flex: 1 }}>
            <DatePicker id="signedDate" style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="dd/mm/yyyy" />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="status" label="Trạng thái hợp đồng" style={{ flex: 1 }}>
            <Select id="status" options={DEAL_STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="paymentStatus"
            label="Trạng thái thanh toán"
            style={{ flex: 1 }}
            extra="Ghi nhận đợt thanh toán sẽ tự cập nhật trạng thái này"
          >
            <Select id="paymentStatus" options={PAYMENT_STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item name="paymentMethod" label="Phương thức thanh toán" style={{ flex: 1 }}>
            <Select id="paymentMethod" allowClear options={PAYMENT_METHOD_OPTIONS} placeholder="Chọn phương thức" />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item
            name="approvalStatus"
            label="Trạng thái duyệt"
            style={{ flex: 1 }}
            extra={canApprove ? undefined : 'Chỉ ADMIN/MANAGER đổi được trạng thái duyệt'}
          >
            <Select id="approvalStatus" disabled={!canApprove} options={APPROVAL_STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="salesId"
            label="Nhân viên phụ trách"
            style={{ flex: 1 }}
            extra={canAssign ? undefined : 'SALES chỉ tạo hợp đồng cho chính mình'}
          >
            <Select
              id="salesId"
              allowClear
              disabled={!canAssign}
              showSearch
              optionFilterProp="label"
              placeholder="Chọn nhân viên"
              options={staffOptions}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="fileUrl"
          label="File hợp đồng (link)"
          rules={[{ type: 'url', message: 'Link chưa hợp lệ' }, { max: 500, message: 'Tối đa 500 ký tự' }]}
        >
          <Input id="fileUrl" placeholder="https://drive.google.com/…" />
        </Form.Item>

        <Form.Item name="note" label="Ghi chú">
          <Input.TextArea id="note" rows={2} placeholder="Điều kiện thanh toán, thoả thuận riêng…" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

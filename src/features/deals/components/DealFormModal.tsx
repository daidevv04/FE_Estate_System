import { CalculatorOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { DiscountCalculatorModal } from '@/features/policies/components/DiscountCalculatorModal'
import {
  APPROVAL_STATUS_OPTIONS, DEAL_STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_OPTIONS,
  generateContractCode, type Deal, type DealInput, type DealStatus, type PaymentStatus, type UUID,
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
  scheduleTemplate?: string
}

interface Props {
  open: boolean
  editing: Deal | null
  leadOptions: Ref[]
  staffOptions: Ref[]
  canAssign: boolean
  canApprove: boolean
  submitting: boolean
  onCancel: () => void
  onSubmit: (body: DealInput, scheduleTemplate?: string) => void
}

const money = {
  formatter: (v: number | string | undefined | null) =>
    (v == null || v === '' ? '' : new Intl.NumberFormat('vi-VN').format(Number(v))),
  parser: (v: string | undefined) => Number((v ?? '').replace(/[^\d]/g, '')) as unknown as number,
}

export function DealFormModal({
  open, editing, leadOptions, staffOptions, canAssign, canApprove, submitting, onCancel, onSubmit,
}: Props) {
  const [form] = Form.useForm<FormValues>()
  const isEdit = Boolean(editing)
  const [calcOpen, setCalcOpen] = useState(false)

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
    } else {
      const now = dayjs()
      form.setFieldsValue({
        contractCode: generateContractCode(now),
        signedDate: now,
        status: 'IN_PROGRESS',
        paymentStatus: 'UNPAID',
      })
    }
  }, [open, editing, form])

  const leadSelect = useMemo(
    () => leadOptions.map((l) => ({ value: l.id, label: l.label })),
    [leadOptions],
  )

  const staffSelect = useMemo(
    () => staffOptions.map((s) => ({ value: s.id, label: s.label })),
    [staffOptions],
  )

  return (
    <Modal
      open={open}
      title={isEdit ? `Sửa hợp đồng ${editing?.contractCode ?? ''}` : 'Thêm hợp đồng mới'}
      width={720}
      centered
      destroyOnHidden
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
          if (!isEdit) body.leadId = v.leadId
          if (canApprove) body.approvalStatus = v.approvalStatus as DealInput['approvalStatus']
          if (canAssign) body.salesId = v.salesId || undefined
          onSubmit(body, v.scheduleTemplate)
        })
      }}
    >
      <Form<FormValues>
        form={form}
        layout="vertical"
        initialValues={{
          status: 'IN_PROGRESS' as DealStatus,
          paymentStatus: 'UNPAID' as PaymentStatus,
          scheduleTemplate: 'TEMPLATE_CONSTRUCTION_7',
        }}
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
              { required: true, message: 'Vui lòng nhập hoặc tạo mã hợp đồng' },
              { max: 50, message: 'Tối đa 50 ký tự' },
              {
                pattern: /^HD-\d{8}-[A-Za-z0-9]+$/i,
                message: 'Mã hợp đồng chuẩn: HD-YYYYMMDD-XXXX (VD: HD-20261013-1024)',
              },
            ]}
            extra="Chuẩn quy tắc: HD-{NămThángNgày}-{MãSố} thuận tiện tra cứu và đối chiếu"
          >
            <Input
              id="contractCode"
              placeholder="HD-20261013-1024"
              suffix={
                !isEdit ? (
                  <Tooltip title="Tạo lại mã tự động">
                    <Button
                      type="text"
                      size="small"
                      icon={<ReloadOutlined style={{ color: '#006b2c' }} />}
                      onClick={() => {
                        const date = form.getFieldValue('signedDate') as dayjs.Dayjs | null | undefined
                        form.setFieldValue('contractCode', generateContractCode(date ?? dayjs()))
                      }}
                    />
                  </Tooltip>
                ) : undefined
              }
            />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item
            name="contractValue"
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>Giá trị hợp đồng (đ)</span>
                <Button
                  type="link"
                  size="small"
                  icon={<CalculatorOutlined style={{ color: '#059669' }} />}
                  style={{ padding: 0, height: 'auto', fontSize: 12, color: '#059669', fontWeight: 600 }}
                  onClick={() => setCalcOpen(true)}
                >
                  Tính chiết khấu chính sách
                </Button>
              </div>
            }
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
          >
            <InputNumber id="depositAmount" style={{ width: '100%' }} min={0} step={50_000_000} {...money} />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="depositDate" label="Ngày đặt cọc" style={{ flex: 1 }}>
            <DatePicker id="depositDate" style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="dd/mm/yyyy" />
          </Form.Item>
          <Form.Item name="signedDate" label="Ngày ký" style={{ flex: 1 }}>
            <DatePicker
              id="signedDate"
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder="dd/mm/yyyy"
              onChange={(date) => {
                if (!isEdit && date) {
                  const current = form.getFieldValue('contractCode') as string | undefined
                  if (!current || /^HD-\d{8}-/i.test(current)) {
                    form.setFieldValue('contractCode', generateContractCode(date))
                  }
                }
              }}
            />
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

        {!isEdit && (
          <Form.Item
            name="scheduleTemplate"
            label="Mẫu tiến độ thanh toán căn hộ"
            extra="Hệ thống sẽ tự động tạo bảng chia tiền và hạn thanh toán theo các đợt"
          >
            <Select
              id="scheduleTemplate"
              options={[
                { label: 'Mẫu 1: Tiến độ xây dựng chuẩn (7 đợt)', value: 'TEMPLATE_CONSTRUCTION_7' },
                { label: 'Mẫu 2: Thanh toán sớm 95% (Chiết khấu mở bán - 3 đợt)', value: 'TEMPLATE_FAST_DISCOUNT_3' },
                { label: 'Mẫu 3: Vay ngân hàng hỗ trợ lãi suất 0% (4 đợt)', value: 'TEMPLATE_BANK_LOAN_4' },
                { label: 'Tùy chỉnh sau (Không áp dụng mẫu)', value: 'NONE' },
              ]}
            />
          </Form.Item>
        )}

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
              options={staffSelect}
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

      {calcOpen && (
        <DiscountCalculatorModal
          open={calcOpen}
          initialPrice={form.getFieldValue('contractValue') || 3_500_000_000}
          onClose={() => setCalcOpen(false)}
          onApply={({ netValue, summaryNote }) => {
            form.setFieldsValue({
              contractValue: netValue,
              depositAmount: Math.round(netValue * 0.1),
            })
            const currentNote = form.getFieldValue('note') || ''
            form.setFieldValue('note', currentNote ? `${currentNote}\n${summaryNote}` : summaryNote)
          }}
        />
      )}
    </Modal>
  )
}

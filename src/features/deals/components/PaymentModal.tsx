import { Alert, DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { formatMoney } from '@/lib/format'
import { PAYMENT_METHOD_OPTIONS, type Deal, type DealPaymentInput, type PaymentMethod } from '../api'

interface FormValues {
  amount: number
  paidAt: dayjs.Dayjs
  method?: PaymentMethod
  receiptUrl?: string | null
  note?: string | null
}

interface Props {
  open: boolean
  deal: Deal | null
  /** Số còn lại = giá trị hợp đồng − tổng các đợt thanh toán đã ghi */
  remaining: number
  submitting: boolean
  onCancel: () => void
  onSubmit: (body: DealPaymentInput) => void
}

/**
 * Ghi nhận 1 đợt thanh toán — POST /deals/{id}/payments (append-only, backend tự đổi paymentStatus
 * và chặn tổng vượt contractValue). Tiền đặt cọc là field riêng của hợp đồng, KHÔNG cộng vào đây.
 */
export function PaymentModal({ open, deal, remaining, submitting, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<FormValues>()
  const amount = Form.useWatch('amount', form) as number | undefined

  useEffect(() => {
    if (!open) return
    form.resetFields()
    form.setFieldsValue({
      amount: remaining > 0 ? remaining : undefined,
      paidAt: dayjs(),
      method: 'BANK_TRANSFER',
    })
  }, [open, remaining, form])

  return (
    <Modal
      open={open}
      title={`Ghi nhận thanh toán · ${deal?.contractCode ?? ''}`}
      width={560}
      destroyOnClose
      okText="Ghi nhận"
      cancelText="Hủy"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={() => {
        void form.validateFields().then((v) => {
          onSubmit({
            amount: v.amount,
            // Backend nhận LocalDateTime không kèm offset (docs mục 20) → gửi chuỗi giờ local
            paidAt: v.paidAt.format('YYYY-MM-DDTHH:mm:ss'),
            method: v.method,
            receiptUrl: v.receiptUrl?.trim() || undefined,
            note: v.note?.trim() || undefined,
          })
        })
      }}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message={`Còn phải thu: ${formatMoney(remaining)}`}
        description="Không ghi vượt quá số còn lại — backend chặn tổng thanh toán lớn hơn giá trị hợp đồng."
      />
      <Form<FormValues> form={form} layout="vertical">
        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item
            name="amount"
            label="Số tiền (đ)"
            style={{ flex: 1 }}
            rules={[
              { required: true, message: 'Nhập số tiền' },
              {
                validator: (_, value) => (value == null || Number(value) <= 0
                  ? Promise.reject(new Error('Số tiền phải lớn hơn 0'))
                  : Promise.resolve()),
              },
            ]}
          >
            <InputNumber
              id="paymentAmount"
              style={{ width: '100%' }}
              min={1}
              step={50_000_000}
              formatter={(v) => (v == null ? '' : new Intl.NumberFormat('vi-VN').format(Number(v)))}
              parser={(v) => Number((v ?? '').replace(/[^\d]/g, '')) as unknown as 1}
            />
          </Form.Item>
          <Form.Item
            name="paidAt"
            label="Ngày thanh toán"
            style={{ flex: 1 }}
            rules={[
              { required: true, message: 'Chọn thời điểm thanh toán' },
              {
                validator: (_, value: dayjs.Dayjs | undefined) => (value && value.isAfter(dayjs())
                  ? Promise.reject(new Error('Không chọn thời điểm trong tương lai'))
                  : Promise.resolve()),
              },
            ]}
          >
            <DatePicker
              id="paidAt"
              showTime={{ format: 'HH:mm' }}
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%' }}
              disabledDate={(d) => d.isAfter(dayjs(), 'day')}
            />
          </Form.Item>
        </div>

        <Form.Item name="method" label="Phương thức">
          <Select id="paymentMethod" allowClear options={PAYMENT_METHOD_OPTIONS} />
        </Form.Item>

        {amount != null && amount > remaining && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message={`Vượt ${formatMoney(amount - remaining)} so với số còn lại — backend sẽ từ chối.`}
          />
        )}

        <Form.Item name="receiptUrl" label="Link biên lai" rules={[{ type: 'url', message: 'Link chưa hợp lệ' }]}>
          <Input id="receiptUrl" placeholder="https://…" />
        </Form.Item>

        <Form.Item name="note" label="Ghi chú">
          <Input.TextArea id="paymentNote" rows={2} placeholder="Đợt 2 theo phụ lục…" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

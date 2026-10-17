import { Alert, DatePicker, Form, Input, InputNumber, Modal, Radio, Select, Space } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useCustomers } from '@/features/customers/api'
import { formatMoney } from '@/lib/format'
import type { Product } from '@/features/projects/api'

interface Props {
  open: boolean
  product?: Product
  submitting?: boolean
  onCancel: () => void
  onSubmit: (values: {
    customerId: string
    days?: number
    expiryDate?: string
    depositAmount?: number
    notes?: string
  }) => void
}

export function ProductLockModal({ open, product, submitting, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm()
  const customers = useCustomers()
  const [lockMode, setLockMode] = useState<number | 'custom'>(2)

  useEffect(() => {
    if (open) {
      form.resetFields()
      setLockMode(2)
      form.setFieldsValue({
        lockDays: 2,
        depositAmount: 50000000,
      })
    }
  }, [open, form])

  const handleFinish = (values: any) => {
    let expiryDate: string | undefined
    let days: number | undefined

    if (lockMode === 'custom' && values.customExpiryDate) {
      expiryDate = dayjs(values.customExpiryDate).format('YYYY-MM-DD')
    } else if (typeof lockMode === 'number') {
      days = lockMode
      expiryDate = dayjs().add(lockMode, 'day').format('YYYY-MM-DD')
    }

    onSubmit({
      customerId: values.customerId,
      days,
      expiryDate,
      depositAmount: values.depositAmount || 0,
      notes: values.notes,
    })
  }

  const customerOptions = (customers.data?.content ?? []).map((c) => ({
    value: c.id,
    label: `${c.fullName}${c.phone ? ` - ${c.phone}` : ''}`,
  }))

  const targetExpiry = typeof lockMode === 'number'
    ? dayjs().add(lockMode, 'day').format('DD/MM/YYYY')
    : form.getFieldValue('customExpiryDate')
      ? dayjs(form.getFieldValue('customExpiryDate')).format('DD/MM/YYYY')
      : null

  return (
    <Modal
      open={open}
      title={
        <Space>
          <span style={{ color: '#d97706', fontSize: 18 }}><LockOutlined /></span>
          <span>Giữ chỗ / Khóa căn: <strong>{product?.code}</strong></span>
        </Space>
      }
      okText="Xác nhận giữ chỗ"
      cancelText="Hủy"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
      centered
      width={560}
    >
      <div style={{ marginTop: 12, marginBottom: 16 }}>
        <Alert
          type="warning"
          showIcon
          message="Khóa căn theo ngày"
          description={
            <div style={{ fontSize: 13 }}>
              Căn <strong>{product?.code}</strong> sẽ được giữ độc quyền cho khách hàng này.
              {product?.price && <div>Giá niêm yết: <strong>{formatMoney(product.price)}</strong></div>}
              {targetExpiry && (
                <div style={{ marginTop: 4, color: '#b45309', fontWeight: 600 }}>
                  Hạn chót giữ chỗ dự kiến: {targetExpiry}
                </div>
              )}
            </div>
          }
        />
      </div>

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="customerId"
          label={<span><UserOutlined style={{ marginRight: 4 }} /> Khách hàng giữ chỗ</span>}
          rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
        >
          <Select
            placeholder="Tìm và chọn khách hàng..."
            showSearch
            filterOption={(input, option) =>
              (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={customerOptions}
            loading={customers.isLoading}
          />
        </Form.Item>

        <Form.Item label="Thời hạn giữ chỗ (Tính theo ngày)">
          <Radio.Group
            value={lockMode}
            onChange={(e) => setLockMode(e.target.value)}
            style={{ marginBottom: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}
          >
            <Radio.Button value={1}>1 ngày</Radio.Button>
            <Radio.Button value={2}>2 ngày</Radio.Button>
            <Radio.Button value={3}>3 ngày</Radio.Button>
            <Radio.Button value={7}>7 ngày (Cọc VIP)</Radio.Button>
            <Radio.Button value="custom">Chọn ngày</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {lockMode === 'custom' && (
          <Form.Item
            name="customExpiryDate"
            label="Ngày hết hạn giữ chỗ"
            rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().endOf('day')}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày hết hạn"
            />
          </Form.Item>
        )}

        <Form.Item
          name="depositAmount"
          label="Tiền cọc giữ chỗ / booking (VNĐ)"
          tooltip="Số tiền khách hàng đã thanh toán hoặc cam kết giữ chỗ"
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            step={10000000}
            formatter={(val) => (val ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
            parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0) as any}
            placeholder="0"
          />
        </Form.Item>

        <Form.Item name="notes" label="Ghi chú điều kiện giữ chỗ">
          <Input.TextArea
            rows={2}
            placeholder="Ví dụ: Khách hẹn chiều mai ký cọc hợp đồng, đã chuyển khoản giữ chỗ..."
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

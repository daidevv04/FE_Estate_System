import { DatePicker, Form, InputNumber, Modal, Select } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'
import type { Customer, StaffUser } from '@/features/customers/api'
import {
  LEAD_STAGES, PRODUCT_TYPE_LABEL, STAGE_LABEL, shortName,
  type LeadInput, type LeadStage, type Product, type Project,
} from '../api'

interface FormValues {
  customerId: string
  productId: string
  stage?: LeadStage
  expectedValue?: number | null
  closeDate?: dayjs.Dayjs | null
  assignedTo?: string | null
}

interface Props {
  open: boolean
  customers: Customer[]
  products: Product[]
  projects: Project[]
  staff: StaffUser[]
  canAssign: boolean
  submitting: boolean
  onCancel: () => void
  onSubmit: (body: LeadInput) => void
}

/** "+ Thêm lead" → POST /leads (CreateLeadRequest): khách + căn là bắt buộc, phần còn lại tùy chọn */
export function LeadFormModal({
  open, customers, products, projects, staff, canAssign, submitting, onCancel, onSubmit,
}: Props) {
  const [form] = Form.useForm<FormValues>()

  useEffect(() => {
    if (open) form.resetFields()
  }, [open, form])

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])
  const customerOptions = useMemo(
    () => customers.map((c) => ({
      value: c.id,
      label: c.phone ? `${c.fullName} · ${c.phone}` : c.fullName,
    })),
    [customers],
  )
  const productOptions = useMemo(
    () => products.map((p) => ({
      value: p.id,
      label: `${PRODUCT_TYPE_LABEL[p.type] ?? 'Căn'} ${p.code} · ${projectById.get(p.projectId)?.name ?? '—'}`,
    })),
    [products, projectById],
  )
  const staffOptions = useMemo(
    () => staff.filter((u) => u.status !== 'INACTIVE').map((u) => ({ value: u.id, label: `${u.fullName} (${u.role})` })),
    [staff],
  )

  return (
    <Modal
      open={open}
      title="Thêm lead mới"
      width={620}
      destroyOnClose
      okText="Tạo lead"
      cancelText="Hủy"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={() => {
        void form.validateFields().then((v) => {
          onSubmit({
            customerId: v.customerId,
            productId: v.productId,
            stage: v.stage,
            expectedValue: v.expectedValue ?? null,
            closeDate: v.closeDate ? v.closeDate.format('YYYY-MM-DD') : null,
            ...(canAssign && v.assignedTo ? { assignedTo: v.assignedTo } : {}),
          })
        })
      }}
    >
      <Form<FormValues>
        form={form}
        layout="vertical"
        initialValues={{ stage: 'NEW' as LeadStage }}
        style={{ marginTop: 8 }}
      >
        <Form.Item name="customerId" label="Khách hàng" rules={[{ required: true, message: 'Chọn khách hàng' }]}>
          <Select
            id="customerId"
            showSearch
            optionFilterProp="label"
            placeholder="Tìm theo tên khách hàng hoặc SĐT"
            options={customerOptions}
          />
        </Form.Item>

        <Form.Item name="productId" label="Căn / sản phẩm" rules={[{ required: true, message: 'Chọn căn/sản phẩm' }]}>
          <Select
            id="productId"
            showSearch
            optionFilterProp="label"
            placeholder="Tìm theo mã căn hoặc dự án"
            options={productOptions}
          />
        </Form.Item>

        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="stage" label="Giai đoạn" style={{ flex: 1 }}>
            <Select
              id="stage"
              options={LEAD_STAGES.map((s) => ({ value: s, label: STAGE_LABEL[s] }))}
            />
          </Form.Item>
          <Form.Item name="expectedValue" label="Giá trị kỳ vọng (đ)" style={{ flex: 1 }}>
            <InputNumber
              id="expectedValue"
              style={{ width: '100%' }}
              min={0}
              step={100_000_000}
              placeholder="5.200.000.000"
              formatter={(v) => (v == null ? '' : new Intl.NumberFormat('vi-VN').format(v as number))}
              parser={(v) => Number((v ?? '').replace(/[^\d]/g, '')) as 0}
            />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="closeDate" label="Hạn chốt" style={{ flex: 1 }}>
            <DatePicker id="closeDate" style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="dd/mm/yyyy" />
          </Form.Item>
          <Form.Item
            name="assignedTo"
            label={canAssign ? 'Nhân viên phụ trách' : 'Phụ trách'}
            style={{ flex: 1 }}
            extra={canAssign ? undefined : 'SALES tạo lead thì hệ thống gán cho chính mình'}
          >
            <Select
              id="assignedTo"
              allowClear
              disabled={!canAssign}
              placeholder={canAssign ? 'Toàn công ty — chọn nhân viên' : `${shortName(staff[0]?.fullName)} (bạn)`}
              options={staffOptions}
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}

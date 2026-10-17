import { DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'
import type { Customer, StaffUser } from '@/features/customers/api'
import {
  LEAD_STAGES, PRODUCT_TYPE_LABEL, STAGE_LABEL, shortName,
  type LeadInput, type LeadStage, type Product, type Project,
} from '../api'

interface FormValues {
  customerId: string
  projectId: string
  productId?: string | null
  demandNotes?: string | null
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

export function LeadFormModal({
  open, customers, products, projects, staff, canAssign, submitting, onCancel, onSubmit,
}: Props) {
  const [form] = Form.useForm<FormValues>()
  const selectedProjectId = Form.useWatch('projectId', form)

  useEffect(() => {
    if (open) form.resetFields()
  }, [open, form])

  const customerOptions = useMemo(
    () => customers.map((c) => ({
      value: c.id,
      label: c.phone ? `${c.fullName} · ${c.phone}` : c.fullName,
    })),
    [customers],
  )

  const projectOptions = useMemo(
    () => projects.map((p) => ({
      value: p.id,
      label: p.name,
    })),
    [projects],
  )

  const filteredProducts = useMemo(() => {
    if (!selectedProjectId) return []
    return products.filter((p) => p.projectId === selectedProjectId && p.status !== 'SOLD')
  }, [products, selectedProjectId])

  const productOptions = useMemo(
    () => filteredProducts.map((p) => ({
      value: p.id,
      label: `${PRODUCT_TYPE_LABEL[p.type] ?? 'Căn'} ${p.code}${p.price ? ` · ${new Intl.NumberFormat('vi-VN').format(p.price)} đ` : ''}`,
    })),
    [filteredProducts],
  )

  const staffOptions = useMemo(
    () => staff.filter((u) => u.status !== 'INACTIVE').map((u) => ({ value: u.id, label: `${u.fullName} (${u.role})` })),
    [staff],
  )

  const handleProductChange = (productId: string | undefined) => {
    if (!productId) return
    const p = products.find((item) => item.id === productId)
    if (p?.price && !form.getFieldValue('expectedValue')) {
      form.setFieldValue('expectedValue', p.price)
    }
  }

  return (
    <Modal
      open={open}
      title="Thêm lead mới"
      width={640}
      centered
      destroyOnHidden
      okText="Tạo lead"
      cancelText="Hủy"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={() => {
        void form.validateFields().then((v) => {
          onSubmit({
            customerId: v.customerId,
            projectId: v.projectId,
            productId: v.productId || null,
            demandNotes: v.demandNotes?.trim() || null,
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

        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item
            name="projectId"
            label="Dự án quan tâm"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Vui lòng chọn dự án quan tâm' }]}
          >
            <Select
              id="projectId"
              showSearch
              optionFilterProp="label"
              placeholder="Chọn dự án"
              options={projectOptions}
              onChange={() => form.setFieldValue('productId', undefined)}
            />
          </Form.Item>

          <Form.Item
            name="productId"
            label="Mã căn cụ thể (tùy chọn)"
            style={{ flex: 1 }}
            extra={!selectedProjectId ? 'Chọn dự án trước để hiển thị danh sách căn' : undefined}
          >
            <Select
              id="productId"
              allowClear
              showSearch
              disabled={!selectedProjectId}
              optionFilterProp="label"
              placeholder={selectedProjectId ? 'Chưa chốt căn cụ thể (chọn sau)' : 'Chọn dự án trước'}
              options={productOptions}
              onChange={handleProductChange}
            />
          </Form.Item>
        </div>

        <Form.Item name="demandNotes" label="Ghi chú nhu cầu khách hàng">
          <Input.TextArea
            id="demandNotes"
            rows={2}
            placeholder="Ví dụ: Căn 2PN tầng trung hướng Đông Nam, view sông, ngân sách 3.5 - 4 tỷ..."
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

import { Form, Input, InputNumber, Modal, Select } from 'antd'
import { useEffect, useState } from 'react'
import { DIRECTION, PRODUCT_STATUS, PRODUCT_TYPE, type Product, type ProductInput, type UUID } from '../api'

interface Props { open: boolean; projectId: UUID; editing: Product | null; submitting: boolean; onCancel: () => void; onSubmit: (body: ProductInput, image?: File) => void }
const money = { formatter: (v: number | string | undefined) => v == null ? '' : new Intl.NumberFormat('vi-VN').format(Number(v)), parser: (v: string | undefined) => Number((v ?? '').replace(/[^\d]/g, '')) as unknown as number }
/** Form đúng CreateProductRequest/UpdateProductRequest, gắn projectId từ route — không cho sửa chéo dự án. */
export function ProductFormModal({ open, projectId, editing, submitting, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<ProductInput>()
  const [image, setImage] = useState<File>()
  useEffect(() => { if (open) { setImage(undefined); editing ? form.setFieldsValue(editing) : form.resetFields() } }, [open, editing, form])
  return (
    <Modal open={open} title={editing ? `Sửa sản phẩm ${editing.code}` : 'Thêm sản phẩm'} width={720} destroyOnClose confirmLoading={submitting} okText={editing ? 'Lưu thay đổi' : 'Tạo sản phẩm'} cancelText="Huỷ" onCancel={onCancel} onOk={() => void form.validateFields().then((v) => onSubmit({ ...v, projectId }, image))}>
      <Form form={form} layout="vertical" initialValues={{ type: 'APARTMENT', status: 'AVAILABLE' }} style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="code" label="Mã sản phẩm" style={{ flex: 1 }} rules={[{ required: true, message: 'Nhập mã sản phẩm' }, { max: 50 }]}><Input id="productCode" placeholder="SH-01" /></Form.Item>
          <Form.Item name="block" label="Block / phân khu" style={{ flex: 1 }} rules={[{ max: 20 }]}><Input id="productBlock" placeholder="A-01" /></Form.Item>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="type" label="Loại sản phẩm" style={{ flex: 1 }} rules={[{ required: true }]}><Select id="productType" options={PRODUCT_TYPE} /></Form.Item>
          <Form.Item name="status" label="Trạng thái" style={{ flex: 1 }}><Select id="productStatus" options={PRODUCT_STATUS} /></Form.Item>
          <Form.Item name="direction" label="Hướng" style={{ flex: 1 }}><Select id="productDirection" allowClear options={DIRECTION} /></Form.Item>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="area" label="Diện tích (m²)" style={{ flex: 1 }} rules={[{ required: true, message: 'Nhập diện tích' }]}><InputNumber id="productArea" min={0.01} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="price" label="Giá niêm yết (đ)" style={{ flex: 1 }}><InputNumber id="productPrice" min={0} style={{ width: '100%' }} {...money} /></Form.Item>
          <Form.Item name="bedroom" label="Số phòng ngủ" style={{ flex: 1 }}><InputNumber id="productBedroom" min={0} precision={0} style={{ width: '100%' }} /></Form.Item>
        </div>
        <Form.Item name="imageUrl" label="Link ảnh"><Input id="productImageUrl" type="url" placeholder="https://..." /></Form.Item>
        <Form.Item label="Hoặc chọn ảnh từ máy" extra="JPEG, PNG, WebP. Tối đa 5 MB. File máy sẽ thay link ảnh."><input id="productImageFile" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0])} /></Form.Item>
      </Form>
    </Modal>
  )
}
import { Form, Input, Modal, Select } from 'antd'
import { useEffect, useState } from 'react'
import { PROJECT_STATUS, type Project, type ProjectInput } from '../api'

interface Props { open: boolean; editing: Project | null; submitting: boolean; onCancel: () => void; onSubmit: (body: ProjectInput, image?: File) => void }

export function ProjectFormModal({ open, editing, submitting, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<ProjectInput>()
  const [image, setImage] = useState<File>()
  useEffect(() => { if (open) { setImage(undefined); editing ? form.setFieldsValue(editing) : form.resetFields() } }, [open, editing, form])
  return (
    <Modal open={open} title={editing ? `Sửa dự án ${editing.name}` : 'Thêm dự án'} width={650} destroyOnClose confirmLoading={submitting} okText={editing ? 'Lưu thay đổi' : 'Tạo dự án'} cancelText="Huỷ" onCancel={onCancel} onOk={() => void form.validateFields().then((body) => onSubmit(body, image))}>
      <Form form={form} layout="vertical" initialValues={{ status: 'PLANNING' }} style={{ marginTop: 12 }}>
        <Form.Item name="name" label="Tên dự án" rules={[{ required: true, message: 'Nhập tên dự án' }, { max: 200 }]}><Input id="projectName" placeholder="Ví dụ: Khu đô thị sinh thái…" /></Form.Item>
        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="location" label="Địa điểm" style={{ flex: 1 }} rules={[{ max: 255 }]}><Input id="projectLocation" placeholder="Đà Nẵng, Quảng Nam…" /></Form.Item>
          <Form.Item name="investor" label="Chủ đầu tư" style={{ flex: 1 }} rules={[{ max: 150 }]}><Input id="projectInvestor" placeholder="Tên chủ đầu tư" /></Form.Item>
        </div>
        <Form.Item name="status" label="Trạng thái"><Select id="projectStatus" options={PROJECT_STATUS} /></Form.Item>
        <Form.Item name="description" label="Mô tả"><Input.TextArea id="projectDescription" rows={4} placeholder="Mô tả tổng quan dự án…" /></Form.Item>
        <Form.Item name="imageUrl" label="Link ảnh"><Input id="projectImageUrl" type="url" placeholder="https://..." /></Form.Item>
        <Form.Item label="Hoặc chọn ảnh từ máy" extra="JPEG, PNG, WebP. Tối đa 5 MB. File máy sẽ thay link ảnh."><input id="projectImageFile" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0])} /></Form.Item>
      </Form>
    </Modal>
  )
}
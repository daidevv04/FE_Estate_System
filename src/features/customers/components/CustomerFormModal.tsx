import {
  CheckOutlined, IdcardOutlined, MailOutlined, PhoneOutlined, ThunderboltOutlined,
  UserAddOutlined, UserOutlined,
} from '@ant-design/icons'
import { AutoComplete, Avatar, Button, Form, Grid, Input, Modal, Radio, Select, Tag } from 'antd'
import { useEffect, useMemo, type ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'
import { tokens as t } from '@/theme/tokens'
import {
  CUSTOMER_STATUS, DEMAND_TYPE, customerCode,
  type Customer, type CustomerInput, type StaffUser,
} from '../api'

/** Nguồn khách hàng là chuỗi tự do ở DB → gợi ý theo giá trị đang có thật + nhãn màn 9.8 */
const SOURCE_SUGGEST = ['Website', 'Facebook', 'Zalo OA', 'Referral', 'Direct / Trực tiếp']

/** Tạo mới chỉ 2 trạng thái chuẩn CRM (đúng ghi chú design); khi sửa mở đủ 4 */
const CREATE_STATUS = CUSTOMER_STATUS.filter((s) => s.value === 'NEW' || s.value === 'POTENTIAL')

const AVATAR_COLORS = ['#16A34A', '#0D9488', '#7C3AED', '#0EA5E9', '#F59E0B', '#EF4444']
const avatarColor = (seed: string) =>
  AVATAR_COLORS[[...seed].reduce((a, ch) => a + ch.charCodeAt(0), 0) % AVATAR_COLORS.length]
const initials = (name: string) => {
  const w = name.trim().split(/\s+/)
  return ((w[0]?.[0] ?? '') + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase()
}

/** Tiêu đề nhóm trong modal: THÔNG TIN LIÊN HỆ / ĐỊNH HƯỚNG & NHU CẦU */
function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '2px 0 14px' }}>
      <span style={{
        width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center',
        background: t.colorBrandBg, color: t.colorBrand, fontSize: 14,
      }}>
        {icon}
      </span>
      <span className="stitch-label" style={{ color: t.colorTextSub }}>{children}</span>
    </div>
  )
}

interface Props {
  open: boolean
  editing: Customer | null
  staff: StaffUser[]
  /** Toàn bộ khách đang có — để báo trùng số điện thoại/email ngay trên form */
  existing: Customer[]
  submitting: boolean
  onCancel: () => void
  onSubmit: (values: CustomerInput, careNote: string) => void
}

/** Form Thêm/Sửa khách hàng — layout 2 cột theo màn Stitch 9.8, validate khớp CreateCustomerRequest.java */
export function CustomerFormModal({ open, editing, staff, existing, submitting, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<CustomerInput & { careNote?: string }>()
  const screens = Grid.useBreakpoint()
  // Dưới lg xếp 1 cột cho khỏi bóp form
  const twoCol = screens.lg !== false
  const role = useAuthStore((s) => s.user?.role)
  // ownerId chỉ có tác dụng với ADMIN/MANAGER (CustomerService.update bỏ qua nếu không privileged)
  const canAssign = role === 'ADMIN' || role === 'MANAGER'
  const isEdit = !!editing

  const sourceOptions = useMemo(() => {
    const seen = new Set([...SOURCE_SUGGEST, ...existing.map((c) => c.source).filter((s): s is string => !!s)])
    return [...seen].map((s) => ({ value: s }))
  }, [existing])

  useEffect(() => {
    if (!open) return
    if (editing) form.setFieldsValue({ ...editing, careNote: '' } as CustomerInput & { careNote: string })
    else form.resetFields()
  }, [open, editing, form])

  /** Trùng số điện thoại / email so với danh sách đang có (bỏ qua chính khách đang sửa) */
  const duplicateRule = (field: 'phone' | 'email') => ({
    validator: (_: unknown, value?: string) => {
      const v = value?.trim()
      if (!v) return Promise.resolve()
      const probe = field === 'email' ? v.toLowerCase() : v
      const hit = existing.find((c) => {
        if (c.id === editing?.id) return false
        const mine = field === 'email' ? (c.email ?? '').toLowerCase() : c.phone
        return mine === probe
      })
      if (!hit) return Promise.resolve()
      const what = field === 'email' ? 'Email' : 'Số điện thoại'
      return Promise.reject(
        new Error(`${what} này đã tồn tại trong hệ thống (${customerCode(hit)} - ${hit.fullName}). Vui lòng kiểm tra lại.`),
      )
    },
  })

  const submit = () => {
    const v = form.getFieldsValue()
    const { careNote, ...values } = v
    onSubmit(values as CustomerInput, (careNote ?? '').toString().trim())
  }

  /** Option nhân viên: avatar + tên + vai trò + badge ACTIVE (giống dropdown trong design) */
  const renderStaff = (data: { label?: string; role?: string; status?: string }) => {
    const name = data.label ?? ''
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar size={30} style={{ background: avatarColor(name), fontSize: 12 }}>{initials(name)}</Avatar>
        <div style={{ lineHeight: 1.25, flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 12, color: t.colorTextMuted }}>{data.role ?? 'SALES'}</div>
        </div>
        {(data.status ?? 'ACTIVE') === 'ACTIVE' && <Tag color="green" style={{ marginInlineEnd: 0 }}>ACTIVE</Tag>}
      </div>
    )
  }

  return (
    <Modal
      open={open}
      width={twoCol ? 920 : 560}
      centered
      maskClosable={false}
      onCancel={onCancel}
      title={
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{
            width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center',
            background: t.colorBrandBg, color: t.colorBrand, fontSize: 17,
          }}>
            <UserAddOutlined />
          </span>
          <div>
            <div className="stitch-heading" style={{ fontSize: 18, fontWeight: 600 }}>
              {isEdit ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới'}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 400, color: t.colorTextMuted }}>
              {isEdit
                ? `Chỉnh sửa hồ sơ ${editing ? customerCode(editing) : ''} trong hệ thống Đất Xanh Miền Trung`
                : 'Khởi tạo và phân bổ khách hàng mới vào hệ thống Đất Xanh Miền Trung'}
            </div>
          </div>
        </div>
      }
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: t.colorTextMuted }}>
            <span style={{ color: t.colorError }}>*</span> Các trường thông tin bắt buộc
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button onClick={onCancel}>Hủy bỏ</Button>
            <Button type="primary" icon={<CheckOutlined />} loading={submitting} onClick={() => form.submit()}>
              {isEdit ? 'Lưu thay đổi' : 'Thêm khách hàng'}
            </Button>
          </div>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={submit} style={{ marginTop: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: twoCol ? '1fr 1fr' : '1fr', gap: twoCol ? 28 : 0 }}>
          <div>
            <SectionTitle icon={<IdcardOutlined />}>Thông tin liên hệ</SectionTitle>

            <Form.Item
              name="fullName"
              label="Họ và tên khách hàng"
              required
              rules={[{ required: true, message: 'Nhập họ tên khách hàng' }, { max: 100 }]}
            >
              <Input placeholder="Nhập họ tên khách, ví dụ: Nguyễn Văn An" prefix={<UserOutlined style={{ color: t.colorTextMuted }} />} />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Số điện thoại"
              required
              extra="Tối đa 15 chữ số (VD: 0901 234 567 hoặc +84901234567)"
              rules={[
                { required: true, message: 'Nhập số điện thoại' },
                { pattern: /^\+?[0-9]{8,15}$/, message: 'Số điện thoại 8–15 chữ số, có thể bắt đầu bằng +' },
                duplicateRule('phone'),
              ]}
            >
              <Input placeholder="0901 234 567" prefix={<PhoneOutlined style={{ color: t.colorTextMuted }} />} />
            </Form.Item>

            <Form.Item
              name="email"
              label={<span>Địa chỉ email <Tag style={{ marginInlineStart: 6 }}>Không bắt buộc</Tag></span>}
              rules={[{ type: 'email', message: 'Email không hợp lệ' }, { max: 100 }, duplicateRule('email')]}
            >
              <Input placeholder="khachhang@congty.vn" prefix={<MailOutlined style={{ color: t.colorTextMuted }} />} />
            </Form.Item>

            <Form.Item
              name="source"
              label="Nguồn khách hàng"
              extra="Chọn từ danh sách hoặc nhập nguồn mới"
              rules={[{ max: 50 }]}
            >
              <AutoComplete
                options={sourceOptions}
                placeholder="Chọn hoặc nhập nguồn"
                filterOption={(input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
              >
                <Input prefix={<ThunderboltOutlined style={{ color: t.colorTextMuted }} />} />
              </AutoComplete>
            </Form.Item>

            {canAssign && (
              <Form.Item
                name="ownerId"
                label="Nhân viên phụ trách"
                extra="Bỏ trống thì hệ thống phân bổ tự động cho bạn"
              >
                <Select
                  showSearch
                  allowClear
                  placeholder="Tìm kiếm theo tên, mã nhân viên..."
                  optionFilterProp="label"
                  options={staff.map((u) => ({ value: u.id, label: u.fullName, role: u.role, status: u.status }))}
                  optionRender={(option) => renderStaff(option.data as { label?: string; role?: string; status?: string })}
                />
              </Form.Item>
            )}
          </div>
          <div>
            <SectionTitle icon={<ThunderboltOutlined />}>Định hướng &amp; nhu cầu</SectionTitle>

            <Form.Item name="demandType" label="Nhu cầu bất động sản" initialValue="BUY">
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Mua ở / Đầu tư / Thuê / Chuyển nhượng"
                options={DEMAND_TYPE}
              />
            </Form.Item>

            <Form.Item
              name="status"
              label="Trạng thái khách hàng"
              initialValue="NEW"
              extra={isEdit ? 'Trạng thái chuẩn CRM' : '2 trạng thái chuẩn CRM'}
            >
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                options={isEdit ? CUSTOMER_STATUS : CREATE_STATUS}
              />
            </Form.Item>

            {!isEdit && (
              <Form.Item
                name="careNote"
                label={<span>Ghi chú chăm sóc <Tag style={{ marginInlineStart: 6 }}>Nội bộ CRM</Tag></span>}
                extra="Tự động lưu vào Nhật ký hoạt động & chăm sóc (Activity Log / NOTE) của khách hàng ngay sau khi khởi tạo."
              >
                <Input.TextArea
                  rows={5}
                  maxLength={5000}
                  placeholder="Khách quan tâm phân khu nào, ngân sách, thời điểm dự kiến xuống tiền..."
                />
              </Form.Item>
            )}
          </div>
        </div>
      </Form>
    </Modal>
  )
}
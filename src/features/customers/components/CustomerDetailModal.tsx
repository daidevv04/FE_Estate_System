import { CalendarOutlined, DeleteOutlined, EditOutlined, EnvironmentOutlined, IdcardOutlined, MailOutlined, PhoneOutlined, TeamOutlined, ThunderboltOutlined, UserOutlined } from '@ant-design/icons'
import { App, Avatar, Button, Card, Empty, Modal, Skeleton, Space, Typography } from 'antd'
import dayjs from 'dayjs'
import { tokens as t } from '@/theme/tokens'
import { apiErrorMessage, customerCode, demandLabel, statusLabel, useCustomer, useCustomerMutations, type Customer, type StaffUser } from '../api'
import './CustomerDetailModal.css'

interface Props { customerId?: string; staff: StaffUser[]; canWrite: boolean; onClose: () => void; onEdit: (customer: Customer) => void }

const AVATAR_COLORS = ['#16A34A', '#0D9488', '#7C3AED', '#0EA5E9', '#F59E0B', '#EF4444']
const colorOf = (seed: string) => AVATAR_COLORS[[...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_COLORS.length]
const initials = (name: string) => { const words = name.trim().split(/\s+/); return ((words[0]?.[0] ?? '') + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase() }
const date = (value: string) => dayjs(value).format('DD/MM/YYYY · HH:mm')
const statusTone = (status: Customer['status']) => ({ NEW: { bg: t.colorInfoBg, fg: t.colorInfoText, dot: t.colorInfo }, POTENTIAL: { bg: t.colorWarningBg, fg: t.colorWarningText, dot: t.colorWarning }, CUSTOMER: { bg: t.colorSuccessBg, fg: t.colorSuccessText, dot: t.colorSuccess }, INACTIVE: { bg: t.colorSurfaceSunken, fg: t.colorTextMuted, dot: t.colorBorderStrong } })[status]

/** Popup chi tiết customer chỉ hiện dữ liệu CustomerResponse thật; không dựng lịch sử CRM chưa có endpoint đọc. */
export function CustomerDetailModal({ customerId, staff, canWrite, onClose, onEdit }: Props) {
  const { message, modal } = App.useApp()
  const detail = useCustomer(customerId)
  const { remove } = useCustomerMutations()
  const customer = detail.data
  const owner = staff.find((user) => user.id === customer?.ownerId)
  const removeCustomer = () => {
    if (!customer) return
    modal.confirm({ title: `Xóa khách hàng ${customer.fullName}?`, content: 'Hành động này không hoàn tác được. Khách hàng còn nhật ký chăm sóc hoặc lịch hẹn sẽ không xóa được.', okText: 'Xóa khách hàng', cancelText: 'Hủy', okButtonProps: { danger: true }, onOk: () => remove.mutateAsync(customer.id).then(() => { message.success('Đã xóa khách hàng'); onClose() }).catch((error) => { message.error(apiErrorMessage(error)); throw error }) })
  }
  const tone = customer ? statusTone(customer.status) : null

  return <Modal open={Boolean(customerId)} onCancel={onClose} width="92vw" style={{ top: '5vh' }} className="customer-detail-modal" destroyOnHidden title="Thông tin khách hàng" footer={customer && <div className="customer-detail-modal__footer"><Typography.Text>Thông tin được tải mới từ hệ thống CRM.</Typography.Text><Space><Button onClick={onClose}>Đóng</Button>{canWrite && <Button type="primary" icon={<EditOutlined />} onClick={() => onEdit(customer)}>Chỉnh sửa</Button>}</Space></div>}>
    {detail.isLoading ? <Skeleton active avatar paragraph={{ rows: 14 }} /> : !customer ? <Empty description={detail.isError ? 'Không thể tải thông tin khách hàng.' : 'Không tìm thấy khách hàng.'}><Button hidden={!detail.isError} onClick={() => void detail.refetch()}>Thử lại</Button></Empty> : <div className="customer-detail-modal__content">
      <div className="customer-detail-modal__hero"><Avatar size={64} style={{ background: colorOf(customer.fullName) }}>{initials(customer.fullName)}</Avatar><div className="customer-detail-modal__identity"><Typography.Title level={3}>{customer.fullName}</Typography.Title><Typography.Text type="secondary">{customerCode(customer)}</Typography.Text><span className="customer-detail-modal__pill" style={{ background: tone!.bg, color: tone!.fg }}><i style={{ background: tone!.dot }} />{statusLabel(customer.status)}</span></div><div className="customer-detail-modal__audit"><span>Ngày tạo</span><strong>{date(customer.createdAt)}</strong><span>Cập nhật</span><strong>{date(customer.updatedAt)}</strong></div></div>
      <div className="customer-detail-modal__grid">
        <Card className="customer-detail-modal__card" size="small" title={<Space size={7}><IdcardOutlined />Hồ sơ khách hàng</Space>} extra="Thông tin liên hệ"><div className="customer-detail-modal__facts"><div><span>Họ và tên</span><strong>{customer.fullName}</strong></div><div><span>Mã khách hàng</span><strong>{customerCode(customer)}</strong></div><div><span><PhoneOutlined /> Số điện thoại</span><strong>{customer.phone || 'Chưa cập nhật'}</strong></div><div><span><MailOutlined /> Email</span><strong>{customer.email || 'Chưa cập nhật'}</strong></div><div><span><CalendarOutlined /> Tạo hồ sơ</span><strong>{date(customer.createdAt)}</strong></div><div><span>Cập nhật gần nhất</span><strong>{date(customer.updatedAt)}</strong></div></div></Card>
        <Card className="customer-detail-modal__card" size="small" title={<Space size={7}><ThunderboltOutlined />Định hướng & nhu cầu</Space>} extra="Dữ liệu CRM"><div className="customer-detail-modal__facts customer-detail-modal__facts--one"><div><span>Nhu cầu bất động sản</span><strong>{demandLabel(customer.demandType)}</strong></div><div><span><EnvironmentOutlined /> Nguồn khách hàng</span><strong>{customer.source || 'Chưa cập nhật'}</strong></div><div><span>Trạng thái chăm sóc</span><span className="customer-detail-modal__pill" style={{ background: tone!.bg, color: tone!.fg }}><i style={{ background: tone!.dot }} />{statusLabel(customer.status)}</span></div></div></Card>
      </div>
      <Card className="customer-detail-modal__card" size="small" title={<Space size={7}><TeamOutlined />Phân công & phạm vi phụ trách</Space>}><div className="customer-detail-modal__owner"><Avatar size={42} icon={<UserOutlined />} style={{ background: owner ? colorOf(owner.fullName) : t.colorTextMuted }}>{owner ? initials(owner.fullName) : '?'}</Avatar><div><strong>{owner?.fullName ?? 'Chưa phân công nhân viên phụ trách'}</strong><span>{owner ? `${owner.role}${owner.status ? ` · ${owner.status}` : ''}` : 'Gán nhân viên phụ trách trong phần chỉnh sửa để theo dõi và chăm sóc.'}</span></div></div></Card>
      <Card className="customer-detail-modal__card customer-detail-modal__note" size="small" title="Dữ liệu hoạt động CRM"><Typography.Paragraph>Nhật ký chăm sóc, lịch hẹn, lead và hợp đồng chưa có endpoint tổng hợp trong `CustomerResponse`. Popup chỉ hiển thị dữ liệu đã được API trả về để tránh số liệu sai.</Typography.Paragraph></Card>
      {canWrite && <Card className="customer-detail-modal__card customer-detail-modal__danger" size="small" title={<Space size={7}><DeleteOutlined />Thao tác khách hàng (vùng nguy hiểm)</Space>}><div><strong>Xóa khách hàng vĩnh viễn</strong><span>Chỉ xóa khi không còn nhật ký chăm sóc hoặc lịch hẹn liên quan. Hành động không thể hoàn tác.</span><Button danger type="primary" icon={<DeleteOutlined />} loading={remove.isPending} onClick={removeCustomer}>Xóa khách hàng</Button></div></Card>}
    </div>}
  </Modal>
}
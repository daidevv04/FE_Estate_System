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

  return (
    <Modal
      open={Boolean(customerId)}
      onCancel={onClose}
      width={880}
      className="customer-detail-modal"
      destroyOnHidden
      title="Thông tin chi tiết khách hàng"
      footer={
        customer && (
          <div className="customer-detail-modal__footer">
            <Typography.Text>Dữ liệu được cập nhật tự động từ hệ thống CRM.</Typography.Text>
            <Space>
              <Button onClick={onClose}>Đóng</Button>
              {canWrite && (
                <Button type="primary" icon={<EditOutlined />} onClick={() => onEdit(customer)}>
                  Chỉnh sửa
                </Button>
              )}
            </Space>
          </div>
        )
      }
    >
      {detail.isLoading ? (
        <Skeleton active avatar paragraph={{ rows: 12 }} />
      ) : !customer ? (
        <Empty description={detail.isError ? 'Không thể tải thông tin khách hàng.' : 'Không tìm thấy khách hàng.'}>
          <Button hidden={!detail.isError} onClick={() => void detail.refetch()}>Thử lại</Button>
        </Empty>
      ) : (
        <div className="customer-detail-modal__content">
          <div className="customer-detail-modal__hero">
            <Avatar size={68} style={{ background: colorOf(customer.fullName) }}>
              {initials(customer.fullName)}
            </Avatar>
            <div className="customer-detail-modal__identity">
              <div className="customer-detail-modal__identity-top">
                <Typography.Title level={3}>{customer.fullName}</Typography.Title>
                <span className="customer-detail-modal__code-badge">{customerCode(customer)}</span>
                <span className="customer-detail-modal__pill" style={{ background: tone!.bg, color: tone!.fg }}>
                  <i style={{ background: tone!.dot }} />
                  {statusLabel(customer.status)}
                </span>
              </div>
            </div>
            <div className="customer-detail-modal__audit">
              <div>Ngày tạo: <strong>{date(customer.createdAt)}</strong></div>
              <div>Cập nhật: <strong>{date(customer.updatedAt)}</strong></div>
            </div>
          </div>
          <div className="customer-detail-modal__grid">
            <Card
              className="customer-detail-modal__card"
              size="small"
              title={<Space size={7}><IdcardOutlined />Hồ sơ khách hàng</Space>}
              extra="Thông tin liên hệ"
            >
              <div className="customer-kv-list">
                <div className="customer-kv-item"><span className="customer-kv-label"><UserOutlined /> Họ và tên</span><span className="customer-kv-value">{customer.fullName}</span></div>
                <div className="customer-kv-item"><span className="customer-kv-label">Mã khách hàng</span><span className="customer-kv-value">{customerCode(customer)}</span></div>
                <div className="customer-kv-item"><span className="customer-kv-label"><PhoneOutlined /> Số điện thoại</span><span className="customer-kv-value">{customer.phone || 'Chưa cập nhật'}</span></div>
                <div className="customer-kv-item"><span className="customer-kv-label"><MailOutlined /> Email</span><span className="customer-kv-value">{customer.email || 'Chưa cập nhật'}</span></div>
                <div className="customer-kv-item"><span className="customer-kv-label"><CalendarOutlined /> Tạo hồ sơ</span><span className="customer-kv-value">{date(customer.createdAt)}</span></div>
              </div>
            </Card>
            <Card
              className="customer-detail-modal__card"
              size="small"
              title={<Space size={7}><ThunderboltOutlined />Định hướng & nhu cầu</Space>}
              extra="Dữ liệu bán hàng"
            >
              <div className="customer-kv-list">
                <div className="customer-kv-item"><span className="customer-kv-label">Nhu cầu bất động sản</span><span className="customer-kv-value">{demandLabel(customer.demandType)}</span></div>
                <div className="customer-kv-item"><span className="customer-kv-label"><EnvironmentOutlined /> Nguồn khách hàng</span><span className="customer-kv-value">{customer.source || 'Chưa cập nhật'}</span></div>
                <div className="customer-kv-item"><span className="customer-kv-label">Trạng thái chăm sóc</span><span className="customer-detail-modal__pill" style={{ background: tone!.bg, color: tone!.fg }}><i style={{ background: tone!.dot }} />{statusLabel(customer.status)}</span></div>
                <div className="customer-kv-item"><span className="customer-kv-label">Phụ trách bởi</span><span className="customer-kv-value">{owner?.fullName ?? 'Chưa phân công'}</span></div>
                <div className="customer-kv-item"><span className="customer-kv-label">Cập nhật gần nhất</span><span className="customer-kv-value">{date(customer.updatedAt)}</span></div>
              </div>
            </Card>
          </div>
          <Card
            className="customer-detail-modal__card"
            size="small"
            title={<Space size={7}><TeamOutlined />Phân công & phạm vi phụ trách</Space>}
          >
            <div className="customer-detail-modal__owner">
              <Avatar
                size={44}
                icon={<UserOutlined />}
                style={{ background: owner ? colorOf(owner.fullName) : t.colorTextMuted }}
              >
                {owner ? initials(owner.fullName) : '?'}
              </Avatar>
              <div>
                <strong>{owner?.fullName ?? 'Chưa phân công nhân viên phụ trách'}</strong>
                <span>
                  {owner
                    ? `${owner.role}${owner.status ? ` · ${owner.status}` : ''}`
                    : 'Gán nhân viên phụ trách trong phần chỉnh sửa để theo dõi và chăm sóc.'}
                </span>
              </div>
            </div>
          </Card>

          <Card
            className="customer-detail-modal__card customer-detail-modal__crm-activity"
            size="small"
            title={<Space size={7}><CalendarOutlined />Hoạt động CRM gần đây</Space>}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chưa có dữ liệu hoạt động CRM ghi nhận cho khách hàng này."
              style={{ margin: '14px 0' }}
            />
          </Card>

          {canWrite && (
            <Card
              className="customer-detail-modal__card customer-detail-modal__danger"
              size="small"
              title={<Space size={7}><DeleteOutlined />Thao tác khách hàng (vùng nguy hiểm)</Space>}
            >
              <div className="customer-detail-modal__danger-content">
                <div className="customer-detail-modal__danger-text">
                  <strong>Xóa khách hàng vĩnh viễn</strong>
                  <span>Chỉ xóa khi không còn nhật ký chăm sóc hoặc hợp đồng liên quan. Hành động này không thể hoàn tác.</span>
                </div>
                <Button
                  danger
                  type="primary"
                  icon={<DeleteOutlined />}
                  loading={remove.isPending}
                  onClick={removeCustomer}
                >
                  Xóa khách hàng
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </Modal>
  )
}
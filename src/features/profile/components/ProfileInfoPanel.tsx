import { CheckCircleFilled, CheckOutlined, ExclamationCircleOutlined, UserOutlined } from '@ant-design/icons'
import { formatDate } from '@/lib/format'

interface ProfileInfoPanelProps {
  displayName: string
  username: string
  email: string | null
  phone: string | null
  roleTitle: string
  address: string | null
  status: string
  emailVerified: boolean
  createdAt: string | null
  updatedAt: string | null
  onVerifyEmail?: () => void
}

export function ProfileInfoPanel({
  displayName,
  username,
  email,
  phone,
  roleTitle,
  address,
  status,
  emailVerified,
  createdAt,
  updatedAt,
  onVerifyEmail,
}: ProfileInfoPanelProps) {
  return (
    <div className="profile-panel-card">
      <div className="profile-panel-card__header">
        <div className="profile-panel-card__header-left">
          <div className="profile-panel-icon is-blue">
            <UserOutlined />
          </div>
          <div>
            <h3 className="profile-panel-title">Thông tin cá nhân</h3>
            <p className="profile-panel-subtitle">Chi tiết thông tin nhân viên và định danh nội bộ</p>
          </div>
        </div>
        <div className={`profile-kyc-tag ${status === 'ACTIVE' ? 'is-green' : 'is-red'}`}>
          <CheckCircleFilled /> {status === 'ACTIVE' ? 'Tài khoản hoạt động' : 'Tài khoản tạm ngưng'}
        </div>
      </div>

      <div className="profile-info-grid">
        <div className="profile-info-item">
          <span className="profile-info-item__label">Họ và tên</span>
          <span className="profile-info-item__value">{displayName}</span>
        </div>
        <div className="profile-info-item">
          <span className="profile-info-item__label">Tên đăng nhập (Username)</span>
          <span className="profile-info-item__value">@{username}</span>
        </div>
        <div className="profile-info-item">
          <div className="profile-info-item__label-row">
            <span className="profile-info-item__label">Email làm việc</span>
            {!email ? (
              <span className="profile-info-item__unverified">
                <ExclamationCircleOutlined style={{ fontSize: 11 }} /> Chưa có email
              </span>
            ) : emailVerified ? (
              <span className="profile-info-item__verified">
                <CheckOutlined style={{ fontSize: 11 }} /> Đã xác thực
              </span>
            ) : (
              <button
                type="button"
                className="profile-verify-email-btn"
                onClick={onVerifyEmail}
              >
                <ExclamationCircleOutlined style={{ fontSize: 11 }} /> Xác thực ngay
              </button>
            )}
          </div>
          <span className="profile-info-item__value">
            {email || 'Chưa cập nhật'}
          </span>
        </div>
        <div className="profile-info-item">
          <span className="profile-info-item__label">Số điện thoại</span>
          <span className="profile-info-item__value">{phone || 'Chưa cập nhật'}</span>
        </div>
        <div className="profile-info-item">
          <span className="profile-info-item__label">Chức danh / Vị trí</span>
          <span className="profile-info-item__value">{roleTitle}</span>
        </div>
        <div className="profile-info-item">
          <span className="profile-info-item__label">Địa chỉ liên hệ</span>
          <span className="profile-info-item__value">
            {address || 'Chưa cập nhật'}
          </span>
        </div>
        <div className="profile-info-item">
          <span className="profile-info-item__label">Ngày tạo tài khoản</span>
          <span className="profile-info-item__value">
            {createdAt ? formatDate(createdAt) : 'Chưa cập nhật'}
          </span>
        </div>
        <div className="profile-info-item">
          <span className="profile-info-item__label">Lần cập nhật gần nhất</span>
          <span className="profile-info-item__value">
            {updatedAt ? formatDate(updatedAt) : 'Chưa cập nhật'}
          </span>
        </div>
      </div>
    </div>
  )
}

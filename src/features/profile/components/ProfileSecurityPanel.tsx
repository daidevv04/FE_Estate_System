import {
  CheckCircleFilled,
  LaptopOutlined,
  LockFilled,
  LockOutlined,
  MobileOutlined,
  RightOutlined,
} from '@ant-design/icons'

export interface SessionDevice {
  name: string
  browser: string
  ip: string
  location: string
  isCurrent: boolean
  type: 'desktop' | 'mobile'
}

interface ProfileSecurityPanelProps {
  is2faEnabled?: boolean
  emailVerified?: boolean
  hasEmail?: boolean
  passwordChangedText: string
  session: SessionDevice
  onChangePassword: () => void
  onRevokeSession: () => void
  onVerifyEmail?: () => void
  onToggle2fa?: () => void
}

export function ProfileSecurityPanel({
  is2faEnabled = false,
  emailVerified = false,
  hasEmail = false,
  passwordChangedText,
  session,
  onChangePassword,
  onRevokeSession,
  onVerifyEmail,
  onToggle2fa,
}: ProfileSecurityPanelProps) {
  const emailStatus = !hasEmail
    ? 'Chưa có email'
    : emailVerified
    ? 'Đã hoàn tất'
    : 'Chờ xác minh'
  const emailClass = emailVerified ? 'is-green' : 'is-muted'
  return (
    <div className="profile-panel-card">
      <div className="profile-panel-card__header">
        <div className="profile-panel-card__header-left">
          <div className="profile-panel-icon is-blue">
            <LockOutlined />
          </div>
          <div>
            <h3 className="profile-panel-title">Bảo mật tài khoản</h3>
            <p className="profile-panel-subtitle">
              Quản lý xác thực đăng nhập và phiên làm việc hiện tại
            </p>
          </div>
        </div>
        <button
          type="button"
          className="profile-link-btn"
          onClick={onChangePassword}
        >
          Đổi mật khẩu <RightOutlined style={{ fontSize: 11 }} />
        </button>
      </div>

      {/* 3 Khối trạng thái bảo mật */}
      <div className="profile-security-grid">
        <div className="profile-sec-box">
          <CheckCircleFilled className={`profile-sec-box__icon ${is2faEnabled ? 'is-green' : 'is-muted'}`} />
          <div className="profile-sec-box__content">
            <span className="profile-sec-box__title">Xác thực 2FA</span>
            <span className={`profile-sec-box__status ${is2faEnabled ? 'is-green' : 'is-muted'}`}>
              {is2faEnabled ? 'Đang bật' : 'Chưa bật'}
            </span>
          </div>
          {onToggle2fa && (
            <button
              type="button"
              className={`profile-verify-email-btn profile-verify-email-btn--sm${is2faEnabled ? ' is-danger' : ''}`}
              onClick={onToggle2fa}
            >
              {is2faEnabled ? 'Tắt' : 'Bật'}
            </button>
          )}
        </div>

        <div className="profile-sec-box">
          <CheckCircleFilled className={`profile-sec-box__icon ${emailClass}`} />
          <div className="profile-sec-box__content">
            <span className="profile-sec-box__title">Email xác minh</span>
            <span className={`profile-sec-box__status ${emailClass}`}>
              {emailStatus}
            </span>
          </div>
          {hasEmail && !emailVerified && onVerifyEmail && (
            <button
              type="button"
              className="profile-verify-email-btn profile-verify-email-btn--sm"
              onClick={onVerifyEmail}
            >
              Xác thực
            </button>
          )}
        </div>

        <div className="profile-sec-box">
          <LockFilled className="profile-sec-box__icon is-blue" />
          <div className="profile-sec-box__content">
            <span className="profile-sec-box__title">Mật khẩu bảo vệ</span>
            <span className="profile-sec-box__status is-muted">{passwordChangedText}</span>
          </div>
        </div>
      </div>

      {/* Phiên đăng nhập thực tế của thiết bị */}
      <div className="profile-sessions-section">
        <div className="profile-sessions-header">
          <span className="profile-sessions-label">PHIÊN ĐĂNG NHẬP HIỆN TẠI</span>
        </div>

        <div className="profile-sessions-list">
          <div className="profile-session-item">
            <div className="profile-session-item__left">
              <div className="profile-session-item__device-icon">
                {session.type === 'desktop' ? <LaptopOutlined /> : <MobileOutlined />}
              </div>
              <div className="profile-session-item__info">
                <div className="profile-session-item__title">
                  <span className="profile-session-item__name">
                    {session.name} • {session.browser}
                  </span>
                  {session.isCurrent && (
                    <span className="profile-current-badge">Hiện tại</span>
                  )}
                </div>
                <div className="profile-session-item__meta">
                  Host: {session.ip} • {session.location}
                </div>
              </div>
            </div>
            <div className="profile-session-item__right">
              <button
                type="button"
                className="profile-revoke-single-btn"
                onClick={onRevokeSession}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
        <p className="profile-session-footer-hint">
          Phiên làm việc gắn liền với token xác thực của trình duyệt hiện tại.
        </p>
      </div>
    </div>
  )
}

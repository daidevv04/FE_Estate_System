import { SafetyCertificateOutlined } from '@ant-design/icons'
import { Avatar } from 'antd'
import { formatDate } from '@/lib/format'

interface ProfileHeroProps {
  displayName: string
  username: string
  roleTitle: string
  userId: string
  status: string
  address: string | null
  createdAt: string | null
  emailVerified: boolean
}

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

export function ProfileHero({
  displayName,
  username,
  roleTitle,
  userId,
  status,
  address,
  createdAt,
  emailVerified,
}: ProfileHeroProps) {
  const statusLabel =
    status === 'ACTIVE' ? '● Hoạt động' : status === 'LOCKED' ? '● Đã khóa' : '● Tạm ngưng'
  const statusClass =
    status === 'ACTIVE' ? 'is-green' : status === 'LOCKED' ? 'is-red' : 'is-amber'

  const certText = emailVerified ? 'Email đã xác minh' : 'Tài khoản hệ thống'

  return (
    <div className="profile-hero-card">
      <div className="profile-hero-card__left">
        <div className="profile-hero__avatar-wrap">
          <Avatar size={76} className="profile-hero__avatar">
            {initials(displayName || username)}
          </Avatar>
          <span className="profile-hero__online-badge" title="Đang trực tuyến" />
        </div>
        <div className="profile-hero__details">
          <div className="profile-hero__title-line">
            <span className="profile-hero__name">{displayName.toUpperCase()}</span>
            <span className="profile-hero__badge is-blue">ID: #{userId.slice(0, 8).toUpperCase()}</span>
            <span className={`profile-hero__badge ${statusClass}`}>{statusLabel}</span>
          </div>
          <div className="profile-hero__sub-line">
            <span className="profile-hero__role">{roleTitle}</span>
            {address && (
              <>
                <span className="profile-hero__dot">•</span>
                <span className="profile-hero__branch">{address}</span>
              </>
            )}
            {createdAt && (
              <>
                <span className="profile-hero__dot">•</span>
                <span className="profile-hero__dept">Tham gia: {formatDate(createdAt)}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="profile-hero-card__right">
        <div className="profile-cert-pill">
          <SafetyCertificateOutlined className="profile-cert-pill__icon" />
          <span>{certText}</span>
        </div>
      </div>
    </div>
  )
}

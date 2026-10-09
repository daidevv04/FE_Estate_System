import {
  ApartmentOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ContactsOutlined,
  CustomerServiceOutlined,
  EnvironmentFilled,
  FileTextOutlined,
  LockOutlined,
  SafetyCertificateFilled,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Checkbox, Form, Input } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, API_BASE_URL } from '@/api/client'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { paths } from '@/routes/paths'
import { useAuthStore, type TokenResponse } from '@/store/authStore'
import './LoginPage.css'

interface LoginForm {
  usernameOrEmail: string
  password: string
  remember?: boolean
}

/** Banner trạng thái dưới tiêu đề card: kết nối cổng / lỗi đăng nhập / xác thực thành công */
type BannerTone = 'secured' | 'error' | 'success'
interface BannerState {
  tone: BannerTone
  text: string
}

const SECURED_BANNER: BannerState = { tone: 'secured', text: 'Kết nối cổng CRM nội bộ' }

const bannerIcon = (tone: BannerTone) =>
  tone === 'error' ? <CloseCircleFilled /> : tone === 'success' ? <CheckCircleFilled /> : <SafetyCertificateFilled />

/** 3 nhóm nghiệp vụ chính — nội dung giới thiệu panel thương hiệu (Stitch 9.1 Enterprise Standard) */
const highlights = [
  { icon: <ContactsOutlined />, title: 'Quản lý khách hàng', desc: 'Theo dõi thông tin và lịch sử tương tác.' },
  { icon: <ApartmentOutlined />, title: 'Quản lý giỏ hàng', desc: 'Theo dõi sản phẩm và tình trạng căn.' },
  { icon: <FileTextOutlined />, title: 'Quản lý giao dịch', desc: 'Theo dõi cơ hội, đặt cọc và hợp đồng.' },
]

/** Hoạ tiết SVG: đồi núi miền Trung + shophouse/Regal Towers + vòm Cầu Rồng + sóng biển — opacity .14 mix-blend-overlay */
export function BrandArt() {
  return (
    <div className="login-brand-art" aria-hidden>
      <svg viewBox="0 0 700 900" fill="none" preserveAspectRatio="xMidYMax slice">
        <path d="M-100 640 Q 140 430 340 560 T 780 500 L 780 920 L -100 920 Z" fill="#ffffff" />
        <path d="M40 700 Q 290 510 500 620 T 860 580 L 860 920 L 40 920 Z" fill="#ffffff" opacity="0.6" />
        <rect x="70" y="560" width="68" height="260" rx="6" stroke="#ffffff" strokeWidth="2.5" />
        <line x1="85" x2="123" y1="585" y2="585" stroke="#ffffff" strokeWidth="1.5" />
        <line x1="85" x2="123" y1="620" y2="620" stroke="#ffffff" strokeWidth="1.5" />
        <line x1="85" x2="123" y1="655" y2="655" stroke="#ffffff" strokeWidth="1.5" />
        <line x1="85" x2="123" y1="690" y2="690" stroke="#ffffff" strokeWidth="1.5" />
        <rect x="160" y="460" width="96" height="360" rx="8" stroke="#ffffff" strokeWidth="3" />
        <line x1="182" x2="234" y1="495" y2="495" stroke="#ffffff" strokeWidth="2" />
        <line x1="182" x2="234" y1="535" y2="535" stroke="#ffffff" strokeWidth="2" />
        <line x1="182" x2="234" y1="575" y2="575" stroke="#ffffff" strokeWidth="2" />
        <line x1="182" x2="234" y1="615" y2="615" stroke="#ffffff" strokeWidth="2" />
        <line x1="182" x2="234" y1="655" y2="655" stroke="#ffffff" strokeWidth="2" />
        <path d="M210 740 C 320 610, 450 610, 560 740" stroke="#ffffff" strokeLinecap="round" strokeWidth="3.5" />
        <path d="M250 740 C 340 645, 430 645, 520 740" stroke="#ffffff" strokeLinecap="round" strokeWidth="2" />
        <rect x="480" y="510" width="80" height="310" rx="6" stroke="#ffffff" strokeWidth="2.5" />
        <rect x="580" y="420" width="120" height="400" rx="10" stroke="#ffffff" strokeWidth="3" />
        <circle cx="640" cy="475" r="22" stroke="#ffffff" strokeWidth="2.5" />
        <path d="M-60 830 C 140 800, 240 860, 440 830 C 590 800, 690 840, 800 820 L 800 920 L -60 920 Z" fill="#ffffff" opacity="0.3" />
      </svg>
    </div>
  )
}

/** 9.1 — B2B nội bộ. Không đăng ký, social login, chọn công ty, hoặc portal khách hàng. */
export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState<BannerState>(SECURED_BANNER)
  const [twoFaMode, setTwoFaMode] = useState(false)
  const [savedCredentials, setSavedCredentials] = useState<{
    usernameOrEmail: string
    password?: string
    remember: boolean
  } | null>(null)
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)

  /**
   * Layout login desktop là cố định: body mặc định margin 8px + quầng sáng tràn viền gây scrollbar
   * dọc/ngang. Khoá cuộn khi ở breakpoint 2 cột; màn nhỏ (<1024) vẫn cuộn dọc bình thường.
   */
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const { margin, overflow } = document.body.style
    const apply = () => {
      document.body.style.margin = '0'
      document.body.style.overflow = desktop.matches ? 'hidden' : ''
      document.body.style.overscrollBehavior = 'none'
    }
    apply()
    desktop.addEventListener('change', apply)
    return () => {
      desktop.removeEventListener('change', apply)
      document.body.style.margin = margin
      document.body.style.overflow = overflow
      document.body.style.overscrollBehavior = ''
    }
  }, [])

  const onFinish = async (values: LoginForm) => {
    setLoading(true)
    setBanner(SECURED_BANNER)
    const identifier = values.usernameOrEmail.trim()
    try {
      const { data } = await api.post<TokenResponse>('/auth/login', {
        usernameOrEmail: identifier,
        password: values.password,
      })
      setTokens(data, values.remember ?? false)
      const me = await api.get('/users/me')
      setUser(me.data)
      setBanner({ tone: 'success', text: 'Xác thực thành công! Đang chuyển hướng tới Dashboard...' })
      const next = params.get('next')
      navigate(next ? decodeURIComponent(next) : paths.dashboard, { replace: true })
    } catch (e: unknown) {
      const response = (e as {
        response?: {
          data?: { detail?: string; message?: string; title?: string; error?: string }
          status?: number
        }
      }).response
      const status = response?.status
      const detail = response?.data?.detail ?? response?.data?.message ?? response?.data?.error ?? ''
      const lower = detail.toLowerCase()

      // Backend ném 401 "Invalid TOTP code" khi tài khoản đã bật 2FA nhưng chưa gửi TOTP
      const isTotpChallenge =
        status === 401 &&
        (detail === 'Invalid TOTP code' ||
          lower.includes('totp') ||
          lower.includes('2fa') ||
          lower.includes('two-factor') ||
          lower.includes('two factor') ||
          lower.includes('second factor'))

      if (isTotpChallenge) {
        setSavedCredentials({
          usernameOrEmail: identifier,
          password: values.password,
          remember: values.remember ?? false,
        })
        setTwoFaMode(true)
        setBanner({
          tone: 'secured',
          text: 'Tài khoản đã kích hoạt 2FA. Vui lòng nhập mã xác thực từ ứng dụng Authenticator.',
        })
        return
      }

      setBanner({
        tone: 'error',
        text:
          status === 429
            ? 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ít phút.'
            : status === 502 || status === 503
              ? 'Máy chủ đang khởi động lại (Render). Vui lòng chờ 1–2 phút rồi thử lại.'
              : status === undefined
                ? `Không kết nối được API ${API_BASE_URL}. Kiểm tra máy chủ đã lên chưa và CORS đã mở cho ${window.location.origin}.`
                : status === 401 && (detail === 'Invalid credentials' || !detail)
                  ? 'Tên đăng nhập hoặc mật khẩu không đúng'
                  : (detail || 'Tên đăng nhập hoặc mật khẩu không đúng'),
      })
    } finally {
      setLoading(false)
    }
  }

  const onVerify2fa = async (code: string) => {
    if (!savedCredentials) return
    setLoading(true)
    setBanner(SECURED_BANNER)
    const trimmedCode = code.trim()
    try {
      let tokenData: TokenResponse
      try {
        const { data } = await api.post<TokenResponse>('/auth/2fa/verify', {
          usernameOrEmail: savedCredentials.usernameOrEmail,
          code: trimmedCode,
        })
        tokenData = data
      } catch (err: unknown) {
        const resp = (err as { response?: { status?: number } })?.response
        // Fallback gọi /auth/login kèm totpCode nếu backend route /auth/2fa/verify bị 404
        if (resp?.status === 404 && savedCredentials.password) {
          const { data } = await api.post<TokenResponse>('/auth/login', {
            usernameOrEmail: savedCredentials.usernameOrEmail,
            password: savedCredentials.password,
            totpCode: trimmedCode,
          })
          tokenData = data
        } else {
          throw err
        }
      }

      setTokens(tokenData, savedCredentials.remember)
      const me = await api.get('/users/me')
      setUser(me.data)
      setBanner({ tone: 'success', text: 'Xác thực thành công! Đang chuyển hướng tới Dashboard...' })
      const next = params.get('next')
      navigate(next ? decodeURIComponent(next) : paths.dashboard, { replace: true })
    } catch (e: unknown) {
      const response = (e as {
        response?: { data?: { detail?: string; message?: string }; status?: number }
      }).response
      const status = response?.status
      const detail = response?.data?.detail ?? response?.data?.message
      setBanner({
        tone: 'error',
        text:
          status === 401
            ? 'Mã xác thực 2FA không chính xác hoặc đã hết hạn.'
            : (detail || 'Xác thực hai lớp thất bại'),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel2fa = () => {
    setTwoFaMode(false)
    setBanner(SECURED_BANNER)
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel" aria-label="Giới thiệu Đất Xanh Miền Trung">
        <BrandArt />

        <header className="login-brand-header">
          <span className="login-emblem login-emblem--panel">
            <BrandLogo collapsed inverse />
          </span>
          <div className="login-brand-id">
            <strong>ĐẤT XANH MIỀN TRUNG</strong>
            <span>REGAL GROUP · B2B REAL ESTATE PLATFORM</span>
          </div>
          <span className="login-brand-badge" aria-hidden>
            <i />
          </span>
        </header>

        <div className="login-brand-content">
          <h1 className="login-brand-title">
            QUẢN LÝ KINH DOANH
            <br />
            BẤT ĐỘNG SẢN
          </h1>
          <p className="login-brand-copy">Quản lý khách hàng, cơ hội bán hàng và hợp đồng trên cùng một hệ thống.</p>
          <ul className="login-feature-list">
            {highlights.map((item) => (
              <li className="login-feature" key={item.title}>
                <span className="login-feature-icon">{item.icon}</span>
                <span className="login-feature-text">
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <footer className="login-brand-footer">
          <span className="login-footer-item">
            <LockOutlined /> Bảo mật hạ tầng nội bộ 256-bit SSL
          </span>
          <span className="login-footer-item">
            <EnvironmentFilled /> Đà Nẵng · Quảng Ngãi · Gia Lai
          </span>
        </footer>
      </section>

      <section className="login-form-panel">
        <div className="login-form-card">
          <div className="login-card-brand">
            <span className="login-emblem login-emblem--card">
              <BrandLogo collapsed />
            </span>
            <div className="login-card-brand-id">
              <strong>ĐẤT XANH MIỀN TRUNG</strong>
              <span>REGAL GROUP CRM PORTAL</span>
            </div>
          </div>

          <h2 className="login-card-title">{twoFaMode ? 'Xác thực hai lớp (2FA)' : 'Đăng nhập hệ thống'}</h2>
          <p className="login-card-sub">
            {twoFaMode
              ? `Nhập mã xác thực gồm 6 chữ số từ ứng dụng Authenticator cho tài khoản ${savedCredentials?.usernameOrEmail ?? ''}.`
              : 'Sử dụng tài khoản nội bộ để truy cập hệ thống CRM.'}
          </p>

          <div className={`login-banner login-banner--${banner.tone}`} role="status" aria-live="polite">
            {bannerIcon(banner.tone)}
            <span>{banner.text}</span>
          </div>

          {twoFaMode ? (
            <Form<{ code: string }>
              layout="vertical"
              onFinish={({ code }) => onVerify2fa(code)}
              disabled={loading}
              requiredMark={false}
            >
              <Form.Item
                name="code"
                label={
                  <span>
                    Mã xác thực 2FA <i className="login-required">*</i>
                  </span>
                }
                getValueFromEvent={(e) => (typeof e?.target?.value === 'string' ? e.target.value.replace(/\D/g, '').slice(0, 6) : '')}
                rules={[
                  { required: true, message: 'Vui lòng nhập mã xác thực.' },
                  { pattern: /^\d{6}$/, message: 'Mã xác thực gồm 6 chữ số.' },
                ]}
              >
                <Input
                  prefix={<SafetyCertificateFilled />}
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  style={{ textAlign: 'center', letterSpacing: 8, fontSize: 20, fontWeight: 700 }}
                />
              </Form.Item>

              <Button
                className="login-submit"
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                icon={<ArrowRightOutlined />}
                iconPosition="end"
              >
                {loading ? 'Đang xác thực...' : 'Xác thực & Đăng nhập'}
              </Button>

              <Button
                className="login-back-btn"
                type="link"
                disabled={loading}
                onClick={handleCancel2fa}
              >
                <ArrowLeftOutlined /> Quay lại đăng nhập
              </Button>
            </Form>
          ) : (
            <Form<LoginForm>
              layout="vertical"
              initialValues={{
                usernameOrEmail: savedCredentials?.usernameOrEmail ?? '',
                remember: savedCredentials?.remember ?? false,
              }}
              onFinish={onFinish}
              disabled={loading}
              requiredMark={false}
            >
              <Form.Item
                name="usernameOrEmail"
                label={
                  <span>
                    Tên đăng nhập hoặc email <i className="login-required">*</i>
                  </span>
                }
                rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập hoặc email.' }]}
              >
                <Input prefix={<UserOutlined />} autoFocus autoComplete="username" placeholder="Nhập tên đăng nhập hoặc email" />
              </Form.Item>
              <Form.Item
                name="password"
                label={
                  <span>
                    Mật khẩu <i className="login-required">*</i>
                  </span>
                }
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu.' }]}
              >
                <Input.Password prefix={<LockOutlined />} autoComplete="current-password" placeholder="Nhập mật khẩu" />
              </Form.Item>

              <div className="login-options">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                </Form.Item>
                <Button className="login-forgot" type="link" onClick={() => navigate(paths.forgotPassword)}>
                  Quên mật khẩu?
                </Button>
              </div>

              <Button
                className="login-submit"
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                icon={<ArrowRightOutlined />}
                iconPosition="end"
              >
                {loading ? 'Đang xác thực...' : 'Đăng nhập'}
              </Button>
            </Form>
          )}

          <p className="login-internal-note">Hệ thống nội bộ — Tài khoản do quản trị viên cấp</p>
        </div>

        <p className="login-support">
          <CustomerServiceOutlined /> Hỗ trợ kỹ thuật IT nội bộ: <a href="mailto:its@dxmt.com">its@dxmt.com</a>
        </p>
      </section>
    </main>
  )
}

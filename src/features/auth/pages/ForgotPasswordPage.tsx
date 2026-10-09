import { ArrowLeftOutlined, CheckCircleFilled, CustomerServiceOutlined, LockOutlined, SafetyCertificateFilled, SendOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Checkbox, Form, Input } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { paths } from '@/routes/paths'
import type { UserRole } from '@/store/authStore'
import { LoginBrandPanel } from './LoginBrandPanel'
import './LoginPage.css'
import './ForgotPasswordPage.css'

type Step = 'account' | 'otp' | 'password'
interface ResetAccount { resetToken: string; fullName: string | null; username: string; email: string; role: UserRole }
interface AccountForm { usernameOrEmail: string }
interface OtpForm { code: string }
interface PasswordForm { newPassword: string; confirmPassword: string }

const roleLabel: Record<UserRole, string> = { ADMIN: 'Quản trị viên', MANAGER: 'Quản lý', SALES: 'Nhân viên kinh doanh' }
const errorMessage = (error: unknown, step: Step) => {
  const value = error as { response?: { status?: number; data?: { detail?: string; message?: string } } }
  const status = value.response?.status
  const detail = value.response?.data?.detail ?? value.response?.data?.message ?? ''
  if (status === 429) return 'Bạn đã thử quá nhiều lần. Vui lòng chờ rồi thử lại.'
  if (step === 'otp' && status === 401) return 'Mã xác thực không đúng hoặc đã hết hạn.'
  if (step === 'account' && (status === 400 || status === 403) && /email/i.test(detail))
    return 'Email chưa được xác thực. Vui lòng xác thực email trong trang Hồ sơ cá nhân trước khi sử dụng chức năng này.'
  if (status === 401 || status === 404) return 'Dịch vụ khôi phục mật khẩu chưa sẵn sàng. Vui lòng thử lại sau ít phút.'
  return detail || 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
}
const steps: Step[] = ['account', 'otp', 'password']
const initials = (value: string) => value.trim().split(/\s+/).map((word) => word[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('account')
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [account, setAccount] = useState<ResetAccount | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const index = steps.indexOf(step)
  const requestOtp = async ({ usernameOrEmail: value }: AccountForm) => {
    setBusy(true); setNotice(null)
    try { const identifier = value.trim(); await api.post('/auth/password-reset/request', { usernameOrEmail: identifier }); setUsernameOrEmail(identifier); setStep('otp') }
    catch (error) { setNotice(errorMessage(error, 'account')) } finally { setBusy(false) }
  }
  const verifyOtp = async ({ code }: OtpForm) => {
    setBusy(true); setNotice(null)
    try { const { data } = await api.post<ResetAccount>('/auth/password-reset/verify', { usernameOrEmail, code }); setAccount(data); setStep('password') }
    catch (error) { setNotice(errorMessage(error, 'otp')) } finally { setBusy(false) }
  }
  const confirmPassword = async ({ newPassword }: PasswordForm) => {
    if (!account) return
    setBusy(true); setNotice(null)
    try { await api.post('/auth/password-reset/confirm', { resetToken: account.resetToken, newPassword }); navigate(`${paths.login}?password-reset=success`, { replace: true }) }
    catch (error) { setNotice(errorMessage(error, 'password')) } finally { setBusy(false) }
  }
  const passwordRules = [{ required: true, message: 'Vui lòng nhập mật khẩu mới.' }, { min: 8, max: 72, message: 'Mật khẩu dài 8–72 ký tự.' }, { pattern: /[a-z]/, message: 'Mật khẩu cần có chữ thường.' }, { pattern: /[A-Z]/, message: 'Mật khẩu cần có chữ hoa.' }, { pattern: /\d/, message: 'Mật khẩu cần có chữ số.' }, { pattern: /[^A-Za-z0-9]/, message: 'Mật khẩu cần có ký tự đặc biệt.' }]

  return <main className="login-page forgot-page">
    <LoginBrandPanel />
    <section className="login-form-panel"><div className="login-form-card forgot-form-card">
      <div className="login-card-brand"><span className="login-emblem login-emblem--card"><BrandLogo collapsed /></span><div className="login-card-brand-id"><strong>ĐẤT XANH MIỀN TRUNG</strong><span>ACCOUNT RECOVERY</span></div></div>
      <div className="forgot-steps" aria-label="Các bước khôi phục">{steps.map((item, position) => <span key={item} className={position === index ? 'is-current' : position < index ? 'is-done' : ''}>{position + 1}</span>)}</div>
      {notice && <div className="login-banner login-banner--error" role="alert"><SafetyCertificateFilled /><span>{notice}</span></div>}
      {step === 'account' && <><h2 className="login-card-title">Khôi phục mật khẩu</h2><p className="login-card-sub">Nhập username được cấp hoặc email công việc. Mã OTP chỉ gửi tới email <strong>đã xác thực</strong> gắn với tài khoản.</p><Form<AccountForm> layout="vertical" onFinish={requestOtp} disabled={busy} requiredMark={false}><Form.Item name="usernameOrEmail" label="Username hoặc email công việc" rules={[{ required: true, message: 'Vui lòng nhập username hoặc email.' }]}><Input prefix={<UserOutlined />} autoFocus autoComplete="username" placeholder="Ví dụ: sales01 hoặc tenban@dxmt.com" /></Form.Item><p className="forgot-note"><SafetyCertificateFilled /> Email phải đã được xác thực tại trang Hồ sơ cá nhân mới nhận được OTP.</p><Button className="login-submit" type="primary" htmlType="submit" block loading={busy} icon={<SendOutlined />} iconPosition="end">Gửi mã xác thực</Button></Form></>}
      {step === 'otp' && <><h2 className="login-card-title">Xác thực OTP</h2><p className="login-card-sub">Nhập mã 6 số đã gửi tới email gắn với <b>{usernameOrEmail}</b>. Mã hiệu lực 5 phút.</p><Form<OtpForm> layout="vertical" onFinish={verifyOtp} disabled={busy} requiredMark={false}><Form.Item name="code" label="Mã xác thực" rules={[{ required: true, message: 'Vui lòng nhập mã OTP.' }, { pattern: /^\d{6}$/, message: 'Mã OTP gồm đúng 6 chữ số.' }]}><Input prefix={<SafetyCertificateFilled />} inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus placeholder="000000" /></Form.Item><Button className="login-submit" type="primary" htmlType="submit" block loading={busy}>Xác thực mã</Button><Button className="forgot-back" type="link" disabled={busy} onClick={() => { setStep('account'); setNotice(null) }}><ArrowLeftOutlined /> Đổi tài khoản</Button></Form></>}
      {step === 'password' && account && <><h2 className="login-card-title">Thiết lập mật khẩu mới</h2><div className="forgot-account"><div className="forgot-account__avatar"><Avatar size={46}>{initials(account.fullName || account.username)}</Avatar><CheckCircleFilled aria-label="Tài khoản đã xác thực" /></div><div className="forgot-account__details"><b>{account.fullName || account.username}</b><div className="forgot-account__meta"><span>@{account.username}</span><span className="forgot-account__role">{roleLabel[account.role]}</span></div><small title={account.email}>{account.email}</small></div></div><Form<PasswordForm> layout="vertical" onFinish={confirmPassword} disabled={busy} requiredMark={false}><Form.Item name="newPassword" label="Mật khẩu mới" rules={passwordRules}><Input.Password prefix={<LockOutlined />} autoComplete="new-password" placeholder="Nhập mật khẩu mới" /></Form.Item><Form.Item name="confirmPassword" label="Xác nhận mật khẩu mới" dependencies={['newPassword']} rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu.' }, ({ getFieldValue }) => ({ validator: (_, value) => !value || getFieldValue('newPassword') === value ? Promise.resolve() : Promise.reject(new Error('Mật khẩu xác nhận chưa khớp.')) })]}><Input.Password prefix={<LockOutlined />} autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" /></Form.Item><p className="forgot-note">Ít nhất 8 ký tự gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p><Checkbox checked disabled>Đăng xuất khỏi tất cả thiết bị sau khi đổi mật khẩu</Checkbox><Button className="login-submit" type="primary" htmlType="submit" block loading={busy} icon={<LockOutlined />}>Cập nhật mật khẩu</Button></Form></>}
      <Button className="forgot-back" type="link" onClick={() => navigate(paths.login)}><ArrowLeftOutlined /> Quay lại trang đăng nhập</Button>
    </div><p className="login-support"><CustomerServiceOutlined /> Hỗ trợ kỹ thuật IT nội bộ: <a href="mailto:its@dxmt.com">its@dxmt.com</a></p></section>
  </main>
}
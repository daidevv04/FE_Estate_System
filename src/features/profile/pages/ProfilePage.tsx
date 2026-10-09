import {
  EditOutlined,
  KeyOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Skeleton,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { paths } from '@/routes/paths'
import { isPersistentSession, readRefreshToken, useAuthStore, type TokenResponse } from '@/store/authStore'
import { apiErrorMessage, type ManagedUser } from '@/features/users/api'
import { useDeals, useDealCatalog } from '@/features/deals/api'
import { useLeads } from '@/features/leads/api'
import { formatDate } from '@/lib/format'
import { ProfileHero } from '../components/ProfileHero'
import { ProfileInfoPanel } from '../components/ProfileInfoPanel'
import { ProfileSecurityPanel, type SessionDevice } from '../components/ProfileSecurityPanel'
import { ProfilePerformancePanel } from '../components/ProfilePerformancePanel'
import { ProfileDealsPanel } from '../components/ProfileDealsPanel'
import { ProfileNotifPanel } from '../components/ProfileNotifPanel'
import './ProfilePage.css'

interface ProfileInput {
  fullName: string
  email: string | null
  phone: string | null
  address: string | null
}

interface PasswordInput {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const authUser = (user: ManagedUser) => ({
  id: user.id,
  username: user.username,
  fullName: user.fullName,
  email: user.email ?? undefined,
  role: user.role,
})

const requiredLabel = (text: string) => (
  <span>
    {text} <i className="profile-required" aria-label="bắt buộc">*</i>
  </span>
)

function detectCurrentSession(): SessionDevice {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  let os = 'Máy tính cá nhân'
  let type: 'desktop' | 'mobile' = 'desktop'

  if (/Windows NT 10.0|Windows NT 11.0/i.test(ua)) os = 'Windows 10/11'
  else if (/Windows/i.test(ua)) os = 'Windows PC'
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'Apple macOS'
  else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = 'Apple iOS'
    type = 'mobile'
  } else if (/Android/i.test(ua)) {
    os = 'Thiết bị Android'
    type = 'mobile'
  } else if (/Linux/i.test(ua)) os = 'Hệ điều hành Linux'

  let browser = 'Trình duyệt Web'
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge'
  else if (/Chrome\//i.test(ua)) browser = 'Google Chrome'
  else if (/Safari\//i.test(ua)) browser = 'Apple Safari'
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox'

  const isPersistent = isPersistentSession()
  const sessionKind = isPersistent ? 'Ghi nhớ đăng nhập (30 ngày)' : 'Phiên làm việc tạm thời'
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1'

  return {
    name: os,
    browser,
    ip: hostname === 'localhost' ? '127.0.0.1' : hostname,
    location: sessionKind,
    isCurrent: true,
    type,
  }
}

export function ProfilePage() {
  const { message, modal } = App.useApp()
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const setTokens = useAuthStore((state) => state.setTokens)

  const [profile, setProfile] = useState<ManagedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [verifyEmailOpen, setVerifyEmailOpen] = useState(false)
  const [verifyStep, setVerifyStep] = useState<'idle' | 'sent'>('idle')
  const [verifySending, setVerifySending] = useState(false)
  const [twoFaOpen, setTwoFaOpen] = useState(false)
  const [twoFaStep, setTwoFaStep] = useState<'password' | 'setup' | 'disable'>('password')
  const [twoFaSecret, setTwoFaSecret] = useState<{ secret: string; otpauthUri: string } | null>(null)
  const [twoFaSaving, setTwoFaSaving] = useState(false)
  const [twoFaPassword, setTwoFaPassword] = useState('')
  const [twoFaConfirmCode, setTwoFaConfirmCode] = useState('')
  const [twoFaDisablePassword, setTwoFaDisablePassword] = useState('')
  const [twoFaDisableCode, setTwoFaDisableCode] = useState('')

  // Notification switches persisted in localStorage per user
  const notifStorageKey = profile ? `profile_notif_${profile.id}` : null
  const [notifDeals, setNotifDeals] = useState(true)
  const [notifAppointments, setNotifAppointments] = useState(true)
  const [notifReports, setNotifReports] = useState(true)

  useEffect(() => {
    if (!notifStorageKey) return
    const raw = localStorage.getItem(notifStorageKey)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (typeof parsed.deals === 'boolean') setNotifDeals(parsed.deals)
        if (typeof parsed.appointments === 'boolean') setNotifAppointments(parsed.appointments)
        if (typeof parsed.reports === 'boolean') setNotifReports(parsed.reports)
      } catch {
        // ignore
      }
    }
  }, [notifStorageKey])

  const persistNotifs = (dealsVal: boolean, apptVal: boolean, reportsVal: boolean) => {
    if (notifStorageKey) {
      localStorage.setItem(
        notifStorageKey,
        JSON.stringify({ deals: dealsVal, appointments: apptVal, reports: reportsVal }),
      )
    }
  }

  const handleToggleDeals = (val: boolean) => {
    setNotifDeals(val)
    persistNotifs(val, notifAppointments, notifReports)
    message.success(`Đã ${val ? 'bật' : 'tắt'} thông báo giao dịch`)
  }

  const handleToggleAppointments = (val: boolean) => {
    setNotifAppointments(val)
    persistNotifs(notifDeals, val, notifReports)
    message.success(`Đã ${val ? 'bật' : 'tắt'} nhắc lịch hẹn`)
  }

  const handleToggleReports = (val: boolean) => {
    setNotifReports(val)
    persistNotifs(notifDeals, notifAppointments, val)
    message.success(`Đã ${val ? 'bật' : 'tắt'} báo cáo tuần`)
  }

  // Real backend queries for deals, leads, catalog
  const dealsQuery = useDeals({})
  const leadsQuery = useLeads()
  const dealCatalog = useDealCatalog()

  const allDeals = dealsQuery.data?.content ?? []
  const allLeads = leadsQuery.data?.content ?? []

  const userDeals = useMemo(() => {
    if (!profile) return []
    return allDeals.filter((d) => d.salesId === profile.id)
  }, [allDeals, profile])

  const userLeads = useMemo(() => {
    if (!profile) return []
    return allLeads.filter((l) => l.assignedTo === profile.id)
  }, [allLeads, profile])

  const kpi = useMemo(() => {
    const revenue = userDeals.reduce((sum, d) => sum + (d.contractValue ?? 0), 0)
    const wonLeads = userLeads.filter((l) => l.stage === 'WON').length
    const lostLeads = userLeads.filter((l) => l.stage === 'LOST').length
    const closedCount = wonLeads + lostLeads
    const winRate =
      closedCount > 0
        ? (wonLeads / closedCount) * 100
        : userLeads.length > 0
        ? (wonLeads / userLeads.length) * 100
        : null
    const activeLeads = userLeads.filter((l) => l.stage !== 'WON' && l.stage !== 'LOST').length
    const completedDeals = userDeals.filter(
      (d) => d.status === 'COMPLETED' || d.status === 'ACTIVE',
    ).length
    return { revenue, winRate, activeLeads, completedDeals }
  }, [userDeals, userLeads])

  const displayDeals = useMemo(() => {
    const leadMap = new Map((dealCatalog.leads.data?.content ?? []).map((l) => [l.id, l]))
    const customerMap = new Map(
      (dealCatalog.customers.data?.content ?? []).map((c) => [c.id, c.fullName]),
    )
    const productMap = new Map((dealCatalog.products.data?.content ?? []).map((p) => [p.id, p]))
    const projectMap = new Map((dealCatalog.projects.data?.content ?? []).map((p) => [p.id, p.name]))

    return userDeals.slice(0, 5).map((deal) => {
      const lead = leadMap.get(deal.leadId)
      const product = lead ? productMap.get(lead.productId) : undefined
      const project = product ? projectMap.get(product.projectId) : undefined
      const customer = lead ? customerMap.get(lead.customerId) : undefined

      return {
        id: deal.id,
        contractCode: deal.contractCode,
        contractValue: deal.contractValue,
        status: deal.status,
        projectName: project ?? 'Dự án',
        productCode: product?.code ?? '',
        customerName: customer ?? '—',
        date: deal.signedDate ? formatDate(deal.signedDate) : formatDate(deal.createdAt),
      }
    })
  }, [userDeals, dealCatalog])

  // Current real device session
  const session = useMemo<SessionDevice>(() => detectCurrentSession(), [])

  const [form] = Form.useForm<ProfileInput>()
  const [passwordForm] = Form.useForm<PasswordInput>()

  useEffect(() => {
    let active = true
    api
      .get<ManagedUser>('/users/me')
      .then(({ data }) => {
        if (!active) return
        setProfile(data)
        setUser(authUser(data))
        form.setFieldsValue({
          fullName: data.fullName || '',
          email: data.email,
          phone: data.phone,
          address: data.address,
        })
      })
      .catch((error: unknown) => {
        if (active) message.error(apiErrorMessage(error))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [form, message, setUser])

  const handleOpenEdit = () => {
    if (profile) {
      form.setFieldsValue({
        fullName: profile.fullName || '',
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
      })
    }
    setEditOpen(true)
  }

  const saveProfile = async (values: ProfileInput) => {
    setSaving(true)
    try {
      let data: ManagedUser
      const payload = {
        fullName: values.fullName.trim(),
        email: values.email?.trim() || null,
        phone: values.phone?.trim() || null,
        address: values.address?.trim() || null,
      }
      try {
        const res = await api.patch<ManagedUser>('/users/me/profile', payload)
        data = res.data
      } catch (err) {
        if (profile?.id) {
          const res = await api.patch<ManagedUser>(`/users/${profile.id}/profile`, payload)
          data = res.data
        } else {
          throw err
        }
      }
      setProfile(data)
      setUser(authUser(data))
      setEditOpen(false)
      message.success('Đã cập nhật hồ sơ cá nhân thành công')
    } catch (error) {
      message.error(apiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const passwordChangedText = useMemo(() => {
    if (!profile) return 'Đang tải...'
    const localSaved = localStorage.getItem(`pwd_changed_${profile.id}`)
    if (localSaved) {
      const diffDays = dayjs().diff(dayjs(localSaved), 'day')
      if (diffDays === 0) return 'Đổi hôm nay'
      if (diffDays === 1) return 'Đổi hôm qua'
      return `Đổi ${diffDays} ngày trước (${formatDate(localSaved)})`
    }
    if (
      profile.updatedAt &&
      profile.createdAt &&
      dayjs(profile.updatedAt).diff(dayjs(profile.createdAt), 'minute') > 5
    ) {
      const diffDays = dayjs().diff(dayjs(profile.updatedAt), 'day')
      if (diffDays === 0) return 'Cập nhật hôm nay'
      return `Cập nhật ${diffDays} ngày trước`
    }
    return `Tạo ngày ${formatDate(profile.createdAt)}`
  }, [profile])

  const changePassword = async (values: PasswordInput) => {
    setPasswordSaving(true)
    try {
      await api.post('/users/me/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      if (profile) {
        localStorage.setItem(`pwd_changed_${profile.id}`, new Date().toISOString())
      }
      useAuthStore.getState().clear()
      message.success('Đã đổi mật khẩu. Vui lòng đăng nhập lại.')
      navigate(paths.login, { replace: true })
    } catch (error) {
      message.error(apiErrorMessage(error))
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleRevokeSession = () => {
    modal.confirm({
      title: 'Đăng xuất phiên làm việc',
      content: 'Bạn có chắc chắn muốn đăng xuất tài khoản và kết thúc phiên làm việc trên thiết bị này?',
      okText: 'Đăng xuất',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const stored = readRefreshToken()
          if (stored) {
            await api.post('/auth/logout', { refreshToken: stored })
          }
        } catch {
          // Token expired or revoked
        } finally {
          useAuthStore.getState().clear()
          message.success('Đã đăng xuất phiên làm việc thành công')
          navigate(paths.login, { replace: true })
        }
      },
    })
  }

  const handleOpenVerifyEmail = () => {
    if (!profile?.email) {
      message.warning('Vui lòng cập nhật email trước khi xác thực.')
      return
    }
    if (profile.emailVerifiedAt) {
      message.info('Email đã được xác thực.')
      return
    }
    setVerifyStep('idle')
    setVerifyEmailOpen(true)
  }

  const sendVerifyOtp = async () => {
    setVerifySending(true)
    try {
      await api.post('/auth/otp/send', {
        usernameOrEmail: profile!.username,
        purpose: 'VERIFY_EMAIL',
      })
      setVerifyStep('sent')
      message.success(`Mã xác thực đã gửi tới ${profile!.email}`)
    } catch (error) {
      message.error(apiErrorMessage(error))
    } finally {
      setVerifySending(false)
    }
  }

  const confirmVerifyOtp = async (code: string) => {
    setVerifySending(true)
    try {
      await api.post('/auth/otp/verify', {
        usernameOrEmail: profile!.username,
        purpose: 'VERIFY_EMAIL',
        code,
      })
      // Reload profile to get updated emailVerifiedAt
      const { data } = await api.get<ManagedUser>('/users/me')
      setProfile(data)
      setUser(authUser(data))
      setVerifyEmailOpen(false)
      message.success('Email đã được xác thực thành công!')
    } catch (error) {
      message.error(apiErrorMessage(error))
    } finally {
      setVerifySending(false)
    }
  }

  const handleToggle2fa = () => {
    setTwoFaPassword('')
    setTwoFaConfirmCode('')
    setTwoFaDisablePassword('')
    setTwoFaDisableCode('')
    setTwoFaSecret(null)
    if (profile?.is2faEnabled) {
      setTwoFaStep('disable')
    } else {
      setTwoFaStep('password')
    }
    setTwoFaOpen(true)
  }

  const enable2fa = async (password: string) => {
    setTwoFaSaving(true)
    try {
      const { data } = await api.post<{ secret: string; otpauthUri: string }>('/auth/2fa/enable', { password })
      setTwoFaSecret(data)
      setTwoFaStep('setup')
      setTwoFaPassword('')
      setTwoFaConfirmCode('')
    } catch (error) {
      message.error(apiErrorMessage(error))
    } finally {
      setTwoFaSaving(false)
    }
  }

  const confirm2fa = async (code: string) => {
    const trimmed = code.trim()
    if (!trimmed || !/^\d{6}$/.test(trimmed)) {
      message.warning('Vui lòng nhập đúng mã xác thực gồm 6 chữ số.')
      return
    }
    const identifier = profile?.email || profile?.username
    if (!identifier) {
      message.error('Không tìm thấy thông tin định danh tài khoản.')
      return
    }
    setTwoFaSaving(true)
    try {
      const { data } = await api.post<TokenResponse>('/auth/2fa/verify', {
        usernameOrEmail: identifier,
        code: trimmed,
      })
      setTokens(data, isPersistentSession())
      const me = await api.get<ManagedUser>('/users/me')
      setProfile(me.data)
      setUser(authUser(me.data))
      setTwoFaOpen(false)
      setTwoFaSecret(null)
      setTwoFaConfirmCode('')
      message.success('Bật xác thực hai lớp (2FA) thành công!')
    } catch {
      message.error('Mã xác thực 2FA không chính xác hoặc đã hết hạn. Vui lòng kiểm tra lại mã từ ứng dụng Authenticator.')
    } finally {
      setTwoFaSaving(false)
    }
  }

  const disable2fa = async (password: string, code: string) => {
    setTwoFaSaving(true)
    try {
      await api.post('/auth/2fa/disable', { password, code })
      const { data } = await api.get<ManagedUser>('/users/me')
      setProfile(data)
      setUser(authUser(data))
      setTwoFaOpen(false)
      setTwoFaDisablePassword('')
      setTwoFaDisableCode('')
      message.success('Đã tắt xác thực hai lớp (2FA)')
    } catch (error) {
      message.error(apiErrorMessage(error))
    } finally {
      setTwoFaSaving(false)
    }
  }

  const handleClose2faModal = () => {
    if (twoFaSaving) return
    if (twoFaStep === 'setup') {
      modal.confirm({
        title: 'Chưa hoàn tất xác thực 2FA',
        content: 'Bạn chưa xác nhận mã 6 số từ ứng dụng Authenticator. Nếu đóng bây giờ, tài khoản có thể không đăng nhập được nếu chưa lưu mã vào ứng dụng. Bạn có chắc chắn muốn đóng?',
        okText: 'Đóng',
        cancelText: 'Tiếp tục thiết lập',
        onOk: () => {
          setTwoFaOpen(false)
          setTwoFaSecret(null)
          setTwoFaConfirmCode('')
          void api.get<ManagedUser>('/users/me').then((res) => {
            setProfile(res.data)
            setUser(authUser(res.data))
          })
        },
      })
    } else {
      setTwoFaOpen(false)
      setTwoFaSecret(null)
      setTwoFaConfirmCode('')
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <Card className="stitch-card" variant="borderless">
          <Skeleton active avatar paragraph={{ rows: 12 }} />
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <Card className="stitch-card profile-empty-card" variant="borderless">
          <Typography.Text>Không thể tải dữ liệu hồ sơ cá nhân.</Typography.Text>
          <Button onClick={() => window.location.reload()}>Thử lại</Button>
        </Card>
      </div>
    )
  }

  const displayName = profile.fullName?.trim() || profile.username
  const roleTitle =
    profile.role === 'ADMIN'
      ? 'Quản trị viên hệ thống'
      : profile.role === 'MANAGER'
      ? 'Quản lý kinh doanh'
      : 'Chuyên viên tư vấn'

  return (
    <div className="profile-page">
      {/* ── Top Header Bar ── */}
      <div className="profile-top-bar">
        <div className="profile-header-row">
          <div className="profile-header-left">
            <h1 className="profile-page-title">Hồ sơ cá nhân & Cài đặt tài khoản</h1>
            <span className="profile-status-pill">
              <span className="profile-status-pill__dot" />
              {profile.status === 'ACTIVE'
                ? 'TRẠNG THÁI: HOẠT ĐỘNG'
                : profile.status === 'LOCKED'
                ? 'TRẠNG THÁI: ĐÃ KHÓA'
                : 'TRẠNG THÁI: CHƯA KÍCH HOẠT'}
            </span>
          </div>
          <div className="profile-header-actions">
            <Button
              icon={<KeyOutlined />}
              className="profile-btn-secondary"
              onClick={() => setPasswordOpen(true)}
            >
              Đổi mật khẩu
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              className="profile-btn-primary"
              onClick={handleOpenEdit}
            >
              Chỉnh sửa hồ sơ
            </Button>
          </div>
        </div>
      </div>

      {/* ── Hero: Thẻ Định Danh Nhân Viên ── */}
      <ProfileHero
        displayName={displayName}
        username={profile.username}
        roleTitle={roleTitle}
        userId={profile.id}
        status={profile.status}
        address={profile.address}
        createdAt={profile.createdAt}
        emailVerified={Boolean(profile.emailVerifiedAt)}
      />

      {/* ── Main Bento Grid ── */}
      <Row gutter={[20, 20]} className="profile-grid-row">
        <Col xs={24} lg={14} className="profile-grid-col">
          <ProfileInfoPanel
            displayName={displayName}
            username={profile.username}
            email={profile.email}
            phone={profile.phone}
            roleTitle={roleTitle}
            address={profile.address}
            status={profile.status}
            emailVerified={Boolean(profile.emailVerifiedAt)}
            createdAt={profile.createdAt}
            updatedAt={profile.updatedAt}
            onVerifyEmail={handleOpenVerifyEmail}
          />
          <ProfileSecurityPanel
            is2faEnabled={Boolean(profile.is2faEnabled)}
            emailVerified={Boolean(profile.emailVerifiedAt)}
            hasEmail={Boolean(profile.email)}
            passwordChangedText={passwordChangedText}
            session={session}
            onChangePassword={() => setPasswordOpen(true)}
            onRevokeSession={handleRevokeSession}
            onVerifyEmail={handleOpenVerifyEmail}
            onToggle2fa={handleToggle2fa}
          />
        </Col>
        <Col xs={24} lg={10} className="profile-grid-col">
          <ProfilePerformancePanel
            revenue={kpi.revenue}
            winRate={kpi.winRate}
            activeLeads={kpi.activeLeads}
            completedDeals={kpi.completedDeals}
            loading={dealsQuery.isLoading || leadsQuery.isLoading}
            onViewReport={() => navigate(paths.reports.salesPerformance)}
          />
          <ProfileDealsPanel
            deals={displayDeals}
            loading={dealsQuery.isLoading || dealCatalog.leads.isLoading}
            onViewAllDeals={() => navigate(paths.deals)}
          />
          <ProfileNotifPanel
            notifDeals={notifDeals}
            notifAppointments={notifAppointments}
            notifReports={notifReports}
            onChangeDeals={handleToggleDeals}
            onChangeAppointments={handleToggleAppointments}
            onChangeReports={handleToggleReports}
          />
        </Col>
      </Row>

      {/* ── Modal: Chỉnh sửa thông tin hồ sơ ── */}
      <Modal
        open={editOpen}
        title="Chỉnh sửa thông tin cá nhân"
        okText="Lưu thay đổi"
        cancelText="Hủy"
        confirmLoading={saving}
        destroyOnHidden
        onCancel={() => {
          if (!saving) setEditOpen(false)
        }}
        onOk={() => void form.validateFields().then(saveProfile)}
        width={600}
      >
        <Form form={form} layout="vertical" requiredMark={false} className="profile-modal-form">
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="fullName"
                label={requiredLabel('Họ và tên')}
                rules={[
                  { required: true, message: 'Vui lòng nhập họ và tên.' },
                  { max: 100, message: 'Tối đa 100 ký tự.' },
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Tên đăng nhập (Username)">
                <Input prefix={<UserOutlined />} value={`@${profile.username}`} disabled />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email làm việc"
                rules={[
                  { type: 'email', message: 'Email không đúng định dạng.' },
                  { max: 100, message: 'Tối đa 100 ký tự.' },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="example@domain.com" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  {
                    validator: (_, value) =>
                      !value?.trim() ||
                      /^(\+84|0)[3|5|7|8|9][0-9]{8}$/.test(value.trim()) ||
                      /^\+[1-9]\d{7,14}$/.test(value.trim())
                        ? Promise.resolve()
                        : Promise.reject(new Error('Số điện thoại không hợp lệ (VD: 0912839456)')),
                  },
                ]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="0912345678" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="address"
                label="Địa chỉ liên hệ"
                rules={[{ max: 255, message: 'Tối đa 255 ký tự.' }]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Nhập địa chỉ liên hệ"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ── Modal: Đổi mật khẩu ── */}
      <Modal
        open={passwordOpen}
        title="Đổi mật khẩu tài khoản"
        okText="Cập nhật mật khẩu"
        cancelText="Hủy"
        confirmLoading={passwordSaving}
        destroyOnHidden
        maskClosable={!passwordSaving}
        onCancel={() => {
          if (!passwordSaving) {
            setPasswordOpen(false)
            passwordForm.resetFields()
          }
        }}
        onOk={() => void passwordForm.validateFields().then(changePassword)}
      >
        <p className="profile-password-note">
          Lưu ý: Sau khi đổi mật khẩu thành công, bạn sẽ cần đăng nhập lại trên tất cả thiết bị.
        </p>
        <Form
          form={passwordForm}
          layout="vertical"
          requiredMark={false}
          className="profile-modal-form"
        >
          <Form.Item
            name="currentPassword"
            label={requiredLabel('Mật khẩu hiện tại')}
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại.' }]}
          >
            <Input.Password autoComplete="current-password" placeholder="Nhập mật khẩu hiện tại" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label={requiredLabel('Mật khẩu mới')}
            dependencies={['currentPassword']}
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới.' },
              { min: 8, max: 72, message: 'Mật khẩu phải từ 8 đến 72 ký tự.' },
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  !value || getFieldValue('currentPassword') !== value
                    ? Promise.resolve()
                    : Promise.reject(new Error('Mật khẩu mới phải khác mật khẩu hiện tại.')),
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label={requiredLabel('Xác nhận mật khẩu mới')}
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới.' },
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  !value || getFieldValue('newPassword') === value
                    ? Promise.resolve()
                    : Promise.reject(new Error('Mật khẩu xác nhận chưa khớp.')),
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Modal: Xác thực Email ── */}
      <Modal
        open={verifyEmailOpen}
        title={
          <span>
            <SafetyCertificateOutlined style={{ marginRight: 8, color: '#0284c7' }} />
            Xác thực địa chỉ email
          </span>
        }
        footer={null}
        destroyOnHidden
        maskClosable={!verifySending}
        onCancel={() => {
          if (!verifySending) setVerifyEmailOpen(false)
        }}
        width={440}
      >
        {verifyStep === 'idle' ? (
          <div className="profile-verify-modal">
            <p className="profile-verify-modal__desc">
              Mã OTP gồm 6 chữ số sẽ được gửi tới email:{' '}
              <strong>{profile?.email}</strong>
            </p>
            <p className="profile-verify-modal__hint">
              Email cần được xác thực để sử dụng chức năng khôi phục mật khẩu.
            </p>
            <Button
              type="primary"
              block
              loading={verifySending}
              onClick={sendVerifyOtp}
              className="profile-verify-modal__btn"
            >
              Gửi mã xác thực
            </Button>
          </div>
        ) : (
          <div className="profile-verify-modal">
            <p className="profile-verify-modal__desc">
              Nhập mã 6 chữ số đã gửi tới <strong>{profile?.email}</strong>. Mã hiệu lực 5 phút.
            </p>
            <Input
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              autoFocus
              className="profile-verify-modal__otp"
              onPressEnter={(e) => {
                const val = (e.target as HTMLInputElement).value.trim()
                if (/^\d{6}$/.test(val)) void confirmVerifyOtp(val)
              }}
            />
            <div className="profile-verify-modal__actions">
              <Button
                block
                type="primary"
                loading={verifySending}
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>('.profile-verify-modal__otp input, .profile-verify-modal__otp')
                  const val = input?.value?.trim() ?? ''
                  if (!/^\d{6}$/.test(val)) {
                    message.warning('Vui lòng nhập đúng 6 chữ số.')
                    return
                  }
                  void confirmVerifyOtp(val)
                }}
                className="profile-verify-modal__btn"
              >
                Xác thực
              </Button>
              <Button
                type="link"
                disabled={verifySending}
                onClick={sendVerifyOtp}
                className="profile-verify-modal__resend"
              >
                Gửi lại mã
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal: Xác thực hai lớp (2FA) ── */}
      <Modal
        open={twoFaOpen}
        title={
          <span>
            <SafetyCertificateOutlined style={{ marginRight: 8, color: '#0284c7' }} />
            {twoFaStep === 'disable' ? 'Tắt xác thực hai lớp (2FA)' : 'Thiết lập xác thực hai lớp (2FA)'}
          </span>
        }
        footer={null}
        destroyOnHidden
        maskClosable={false}
        onCancel={handleClose2faModal}
        width={480}
      >
        {twoFaStep === 'password' && (
          <div className="profile-verify-modal">
            <p className="profile-verify-modal__desc">
              Bước 1/2: Nhập mật khẩu hiện tại để bắt đầu thiết lập xác thực hai lớp.
            </p>
            <Input.Password
              autoFocus
              placeholder="Nhập mật khẩu hiện tại"
              value={twoFaPassword}
              onChange={(e) => setTwoFaPassword(e.target.value)}
              className="profile-verify-modal__otp"
              style={{ letterSpacing: 0, fontSize: 14 }}
              onPressEnter={() => {
                const val = twoFaPassword.trim()
                if (val) void enable2fa(val)
              }}
            />
            <Button
              block
              type="primary"
              loading={twoFaSaving}
              className="profile-verify-modal__btn"
              onClick={() => {
                const val = twoFaPassword.trim()
                if (!val) {
                  message.warning('Vui lòng nhập mật khẩu.')
                  return
                }
                void enable2fa(val)
              }}
            >
              Tiếp tục
            </Button>
          </div>
        )}

        {twoFaStep === 'setup' && twoFaSecret && (
          <div className="profile-verify-modal">
            <p className="profile-verify-modal__desc">
              Bước 2/2: Quét mã QR bên dưới bằng ứng dụng Authenticator (Google Authenticator, Microsoft Authenticator...) hoặc nhập mã thủ công, sau đó nhập mã 6 số từ ứng dụng để hoàn tất bật 2FA.
            </p>
            <p className="profile-verify-modal__hint">
              ⚠ Quét mã và lưu vào ứng dụng Authenticator. Bạn sẽ <strong>không thể xem lại</strong> mã bí mật sau khi đóng.
            </p>
            <div className="profile-2fa-qr">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFaSecret.otpauthUri)}`}
                alt="QR Code 2FA"
                width={200}
                height={200}
              />
            </div>
            <div className="profile-2fa-secret">
              <span className="profile-2fa-secret__label">Mã thủ công:</span>
              <code className="profile-2fa-secret__code">{twoFaSecret.secret}</code>
              <button
                type="button"
                className="profile-2fa-secret__copy"
                onClick={() => {
                  void navigator.clipboard.writeText(twoFaSecret.secret)
                  message.success('Đã sao chép mã bí mật')
                }}
              >
                Sao chép
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
                Nhập mã xác thực 6 số từ ứng dụng để xác nhận: <i style={{ color: '#dc2626' }}>*</i>
              </label>
              <Input
                autoFocus
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={twoFaConfirmCode}
                onChange={(e) => setTwoFaConfirmCode(e.target.value.replace(/\D/g, ''))}
                className="profile-2fa-verify-input"
                onPressEnter={() => {
                  if (/^\d{6}$/.test(twoFaConfirmCode)) void confirm2fa(twoFaConfirmCode)
                }}
              />
            </div>

            <Button
              block
              type="primary"
              loading={twoFaSaving}
              disabled={twoFaConfirmCode.length !== 6}
              className="profile-verify-modal__btn"
              onClick={() => void confirm2fa(twoFaConfirmCode)}
            >
              Xác nhận mã & Hoàn tất bật 2FA
            </Button>
          </div>
        )}

        {twoFaStep === 'disable' && (
          <div className="profile-verify-modal">
            <p className="profile-verify-modal__desc">
              Để tắt xác thực hai lớp, nhập mật khẩu hiện tại và mã 6 số từ ứng dụng Authenticator.
            </p>
            <Input.Password
              autoFocus
              placeholder="Mật khẩu hiện tại"
              value={twoFaDisablePassword}
              onChange={(e) => setTwoFaDisablePassword(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <Input
              maxLength={6}
              inputMode="numeric"
              placeholder="Mã 6 số từ Authenticator"
              value={twoFaDisableCode}
              onChange={(e) => setTwoFaDisableCode(e.target.value.replace(/\D/g, ''))}
              style={{ marginBottom: 16 }}
              onPressEnter={() => {
                const pw = twoFaDisablePassword.trim()
                if (pw && /^\d{6}$/.test(twoFaDisableCode)) void disable2fa(pw, twoFaDisableCode)
              }}
            />
            <Button
              block
              danger
              type="primary"
              loading={twoFaSaving}
              className="profile-verify-modal__btn"
              onClick={() => {
                const pw = twoFaDisablePassword.trim()
                if (!pw) {
                  message.warning('Vui lòng nhập mật khẩu.')
                  return
                }
                if (!/^\d{6}$/.test(twoFaDisableCode)) {
                  message.warning('Vui lòng nhập đúng 6 chữ số.')
                  return
                }
                void disable2fa(pw, twoFaDisableCode)
              }}
            >
              Tắt xác thực hai lớp
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
import { Layout, Spin, theme } from 'antd'
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { api, refreshSession } from '@/api/client'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'

const { Sider, Content } = Layout

/** Khung chung mọi trang sau đăng nhập: Sider 264/80 + Header 64 + Content (mục 5.1) */
export function AppShell() {
  const { token } = theme.useToken()
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useUiStore((s) => s.setSidebarCollapsed)
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  /**
   * F5: access token trong RAM mất, chỉ còn refresh token ở storage. Đổi token
   * TRƯỚC khi render trang con — nếu để trang con tự gọi API rồi nhận 401 thì
   * vừa tốn 1 vòng request, vừa đầy lỗi 401 trong console.
   */
  const [sessionReady, setSessionReady] = useState(() => Boolean(accessToken))
  useEffect(() => {
    if (accessToken || !refreshToken) {
      setSessionReady(true)
      return
    }
    let alive = true
    refreshSession()
      .catch(() => {
        /* hết phiên: interceptor đã đẩy về /login */
      })
      .finally(() => {
        if (alive) setSessionReady(true)
      })
    return () => {
      alive = false
    }
  }, [accessToken, refreshToken])

  /** Hồ sơ cũng nằm trong RAM nên mất sau F5; Sidebar và nút theo quyền đọc user.role. */
  useEffect(() => {
    if (!sessionReady || user || !refreshToken) return
    api
      .get('/users/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        /* 401 đã được interceptor xử lý (refresh hoặc đẩy về /login) */
      })
  }, [sessionReady, user, refreshToken, setUser])

  /**
   * Màn hẹp (mobile): tự thu gọn sidebar để nội dung không bị bóp về ~110px.
   * Chỉ tự thu gọn, KHÔNG tự mở lại — tôn trọng lựa chọn bấm tay của người dùng.
   */
  useEffect(() => {
    const apply = () => {
      if (window.innerWidth < 768) setSidebarCollapsed(true)
    }
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [setSidebarCollapsed])

  if (!sessionReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Layout className={`app-shell app-shell--${collapsed ? 'collapsed' : 'expanded'}`} style={{ minHeight: '100vh' }}>
      <Sider
        theme="light"
        width={264}
        collapsedWidth={80}
        collapsed={collapsed}
        className="app-shell__sider"
        style={{ borderInlineEnd: `1px solid ${token.colorBorder}`, position: 'sticky', top: 12, height: 'calc(100vh - 24px)' }}
      >
        <div className="app-shell__brand">
          <BrandLogo collapsed={collapsed} />
        </div>
        <div className="sidebar-scroll">
          <Sidebar />
        </div>
      </Sider>
      <Layout className="app-shell__main">
        <Header />
        <Content className="app-shell__content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

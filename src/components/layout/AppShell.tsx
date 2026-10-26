import { Drawer, Grid, Layout, Spin, theme } from 'antd'
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { api, refreshSession } from '@/api/client'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { NotificationToastContainer } from '@/components/notification/NotificationToastContainer'

import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { useNotificationSse } from '@/hooks/useNotificationSse'

const { Sider, Content } = Layout

export function AppShell() {
  const { token } = theme.useToken()
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const isMobile = Grid.useBreakpoint().md === false
  const [navigationOpen, setNavigationOpen] = useState(false)
  const { pathname } = useLocation()
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  useNotificationSse()

  const [sessionReady, setSessionReady] = useState(() => Boolean(accessToken))
  useEffect(() => {
    if (accessToken || !refreshToken) {
      setSessionReady(true)
      return
    }
    let alive = true
    refreshSession()
      .catch(() => {})
      .finally(() => {
        if (alive) setSessionReady(true)
      })
    return () => {
      alive = false
    }
  }, [accessToken, refreshToken])

  useEffect(() => {
    if (!sessionReady || user || !refreshToken) return
    api
      .get('/users/me')
      .then((res) => setUser(res.data))
      .catch(() => {})
  }, [sessionReady, user, refreshToken, setUser])

  useEffect(() => {
    setNavigationOpen(false)
  }, [pathname, isMobile])

  if (!sessionReady) {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Layout className={`app-shell app-shell--${collapsed ? 'collapsed' : 'expanded'}`} style={{ minHeight: '100dvh' }}>
      <a className="crm-skip-link" href="#main-content">Bỏ qua menu, đến nội dung chính</a>
      {!isMobile && <Sider
        theme="light"
        width={264}
        collapsedWidth={80}
        collapsed={collapsed}
        className="app-shell__sider"
        style={{ borderInlineEnd: `1px solid ${token.colorBorder}`, position: 'sticky', top: 12, height: 'calc(100dvh - 24px)' }}
      >
        <div className="app-shell__brand">
          <BrandLogo collapsed={collapsed} />
        </div>
        <div className="sidebar-scroll">
          <Sidebar />
        </div>
      </Sider>}
      <Drawer
        title="Điều hướng"
        aria-label="Điều hướng"
        placement="left"
        width={288}
        open={isMobile && navigationOpen}
        onClose={() => setNavigationOpen(false)}
        className="crm-navigation-drawer"
      >
        <BrandLogo />
        <Sidebar collapsed={false} onNavigate={() => setNavigationOpen(false)} />
      </Drawer>
      <Layout className="app-shell__main">
        <Header isMobile={isMobile} navigationOpen={navigationOpen} onOpenNavigation={() => setNavigationOpen(true)} />
        <Content className="app-shell__content" id="main-content" tabIndex={-1}>
          <Outlet />
        </Content>
      </Layout>
      <NotificationToastContainer />
    </Layout>
  )
}

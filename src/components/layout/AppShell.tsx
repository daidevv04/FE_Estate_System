import { Layout, Spin, theme } from 'antd'
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
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
  const setSidebarCollapsed = useUiStore((s) => s.setSidebarCollapsed)
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
      <NotificationToastContainer />
    </Layout>
  )
}

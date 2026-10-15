import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SearchOutlined } from '@ant-design/icons'
import { Avatar, Button, Dropdown, Input, Layout, Space, theme } from 'antd'
import type { InputRef } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { paths } from '@/routes/paths'
import { readRefreshToken, useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { HeaderNotificationBox } from '@/components/notification/HeaderNotificationBox'

const { Header: AntHeader } = Layout

export function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = theme.useToken()
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { user, clear } = useAuthStore()

  const searchRef = useRef<InputRef>(null)

  const isSearchPage = location.pathname === paths.search
  const queryFromUrl = isSearchPage ? new URLSearchParams(location.search).get('q') ?? '' : ''
  const [keyword, setKeyword] = useState(queryFromUrl)

  useEffect(() => {
    if (isSearchPage) {
      setKeyword(queryFromUrl)
    } else {
      setKeyword('')
    }
  }, [isSearchPage, queryFromUrl])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleKeywordChange = (val: string) => {
    setKeyword(val)
    const trimmed = val.trim()
    if (trimmed) {
      navigate(`${paths.search}?q=${encodeURIComponent(trimmed)}`, { replace: isSearchPage })
    } else if (isSearchPage) {
      navigate(paths.search, { replace: true })
    }
  }

  const logout = async () => {
    try {
      const stored = readRefreshToken()
      if (stored) await api.post('/auth/logout', { refreshToken: stored })
    } finally {
      clear()
      navigate(paths.login, { replace: true })
    }
  }

  return (
    <AntHeader
      className="app-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 20px',
        background: 'rgba(255,255,255,.92)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 12,
        zIndex: 10,
      }}
    >
      {/* 2 vùng flex-basis 0 ở hai đầu, rộng bằng nhau -> ô tìm kiếm luôn nằm chính giữa header.
          (Không dùng spacer co giãn 1 phía hay margin:auto: cụm bên phải rộng hơn nút menu nên sẽ lệch.) */}
      <div style={{ flex: '1 1 0', display: 'flex', alignItems: 'center' }}>
        <Button
          type="text"
          aria-label={sidebarCollapsed ? 'Mở menu' : 'Thu gọn menu'}
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
        />
      </div>

      <div className="app-header-search" style={{ display: 'flex', justifyContent: 'center' }}>
        <Input
          className="app-header-search__input"
          ref={searchRef}
          allowClear
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          prefix={<SearchOutlined style={{ color: token.colorTextPlaceholder, fontSize: 16 }} />}
          placeholder="Tìm kiếm hệ thống... (Ctrl+K)"
          style={{ width: '100%', borderRadius: 24 }}
          onPressEnter={(e) => {
            const val = (e.target as HTMLInputElement).value.trim()
            if (val) {
              navigate(`${paths.search}?q=${encodeURIComponent(val)}`, { replace: isSearchPage })
            }
          }}
        />
      </div>

      <div
        className="app-header-right"
        style={{ flex: '1 1 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}
      >
        <HeaderNotificationBox />

        <Dropdown
          trigger={['hover']}
          menu={{
            items: [
              { key: 'profile', label: 'Hồ sơ cá nhân', onClick: () => navigate(paths.profile) },
              { type: 'divider' },
              { key: 'logout', label: 'Đăng xuất', danger: true, icon: <LogoutOutlined />, onClick: logout },
            ],
          }}
        >
          <Space className="app-header-profile" size={10} style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: token.borderRadius }}>
            <Avatar style={{ background: token.colorPrimary }}>
              {(user?.fullName ?? user?.username ?? '?').charAt(0).toUpperCase()}
            </Avatar>
            {/* Design Stitch: tên người dùng 14/600, role là nhãn 11/600 in hoa ngay dưới tên.
                Màn rất hẹp thì ẩn khối chữ (xem .app-header-user ở stitch.css), chỉ giữ avatar. */}
            <div className="app-header-user" style={{ lineHeight: 1.25, maxWidth: 170 }}>
              <div
                style={{
                  fontSize: 14, fontWeight: 600, color: token.colorText,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {user?.fullName ?? user?.username ?? '—'}
              </div>
              <div
                style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase',
                  color: token.colorTextTertiary,
                }}
              >
                {user?.role ?? '—'}
              </div>
            </div>
          </Space>
        </Dropdown>
      </div>
    </AntHeader>
  )
}

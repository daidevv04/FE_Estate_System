import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, QuestionCircleOutlined, SearchOutlined } from '@ant-design/icons'
import { Avatar, Button, Dropdown, Input, Layout, Modal, Space, Tag, Tooltip, Typography, theme } from 'antd'
import type { InputRef } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { paths } from '@/routes/paths'
import { readRefreshToken, useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { HeaderNotificationBox } from '@/components/notification/HeaderNotificationBox'

const { Header: AntHeader } = Layout

export function Header({ isMobile = false, navigationOpen = false, onOpenNavigation }: {
  isMobile?: boolean
  navigationOpen?: boolean
  onOpenNavigation?: () => void
}) {
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

  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Bỏ qua nếu đang gõ trong form input/textarea (ngoại trừ Ctrl+K và Esc)
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      } else if (e.key === 'Escape') {
        if (isInput) {
          (target as HTMLInputElement).blur()
        }
      } else if (e.key === '?' && !isInput) {
        e.preventDefault()
        setShortcutsModalOpen(true)
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
      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>
        <Button
          type="text"
          aria-label={isMobile || sidebarCollapsed ? 'Mở menu' : 'Thu gọn menu'}
          aria-expanded={isMobile ? navigationOpen : !sidebarCollapsed}
          icon={isMobile || sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={isMobile ? onOpenNavigation : toggleSidebar}
        />
      </div>

      <div className="app-header-search" style={{ display: 'flex', justifyContent: 'center' }}>
        <Input
          className="app-header-search__input"
          ref={searchRef}
          aria-label="Tìm kiếm hệ thống"
          allowClear
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          prefix={<SearchOutlined style={{ color: token.colorTextPlaceholder, fontSize: 16 }} />}
          suffix={
            <Tooltip title="Nhấn Ctrl + K để tìm nhanh, Esc để đóng">
              <kbd
                style={{
                  fontSize: 11,
                  fontFamily: 'monospace',
                  background: token.colorFillAlter,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: 4,
                  padding: '2px 6px',
                  color: token.colorTextTertiary,
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontWeight: 600,
                }}
                onClick={() => {
                  searchRef.current?.focus()
                  searchRef.current?.select()
                }}
              >
                Ctrl K
              </kbd>
            </Tooltip>
          }
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
        style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}
      >
        <Tooltip title="Phím tắt tiện lợi (Shift + ?)">
          <Button
            type="text"
            className="btn-shortcuts-helper"
            icon={<QuestionCircleOutlined style={{ fontSize: 16 }} />}
            onClick={() => setShortcutsModalOpen(true)}
            aria-label="Phím tắt tiện lợi"
          />
        </Tooltip>

        <HeaderNotificationBox />

        <Modal
          open={shortcutsModalOpen}
          onCancel={() => setShortcutsModalOpen(false)}
          footer={null}
          title="⚡ Phím Tắt Tiện Lợi Cho Sales & Quản Lý"
          centered
          width={480}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: token.colorFillAlter, borderRadius: 8 }}>
              <Typography.Text>Tìm kiếm nhanh toàn hệ thống</Typography.Text>
              <Tag color="cyan" style={{ fontFamily: 'monospace', fontWeight: 600, padding: '2px 8px' }}>Ctrl + K</Tag>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: token.colorFillAlter, borderRadius: 8 }}>
              <Typography.Text>Đóng cửa sổ popup / Thoát tìm kiếm</Typography.Text>
              <Tag style={{ fontFamily: 'monospace', fontWeight: 600, padding: '2px 8px' }}>Esc</Tag>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: token.colorFillAlter, borderRadius: 8 }}>
              <Typography.Text>Mở bảng hướng dẫn phím tắt</Typography.Text>
              <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 600, padding: '2px 8px' }}>Shift + ?</Tag>
            </div>
          </div>
        </Modal>

        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'profile', label: 'Hồ sơ cá nhân', onClick: () => navigate(paths.profile) },
              { type: 'divider' },
              { key: 'logout', label: 'Đăng xuất', danger: true, icon: <LogoutOutlined />, onClick: logout },
            ],
          }}
        >
          <Button type="text" className="app-header-profile" aria-label={`Tài khoản ${user?.fullName ?? user?.username ?? ''}`} style={{ height: 'auto', padding: '4px 8px' }}>
          <Space size={10}>
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
          </Button>
        </Dropdown>
      </div>
    </AntHeader>
  )
}

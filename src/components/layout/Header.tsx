import { BellOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SearchOutlined } from '@ant-design/icons'
import { App, AutoComplete, Avatar, Badge, Button, Dropdown, Input, Layout, Space, Tooltip, theme } from 'antd'
import type { InputRef } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { flatNav } from '@/components/layout/nav'
import { api } from '@/api/client'
import { paths } from '@/routes/paths'
import { readRefreshToken, useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'

const { Header: AntHeader } = Layout

/** Bỏ dấu tiếng Việt để gõ "hop dong" vẫn ra "Hợp đồng" */
const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

export function Header() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { user, clear } = useAuthStore()

  const searchRef = useRef<InputRef>(null)
  const [keyword, setKeyword] = useState('')
  const pages = useMemo(() => flatNav(user?.role), [user?.role])
  const options = useMemo(() => {
    const q = norm(keyword.trim())
    return pages.filter((p) => !q || norm(p.label).includes(q)).map((p) => ({ value: p.label, label: p.label }))
  }, [keyword, pages])

  // Ctrl/Cmd + K → focus ô tìm kiếm (đúng phím tắt ghi trên placeholder)
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

  const goTo = (label: string) => {
    const page = pages.find((p) => p.label === label)
    if (page) navigate(page.key)
    setKeyword('')
  }

  const logout = async () => {
    try {
      // Lấy token MỚI NHẤT từ storage: tab khác có thể đã xoay token, bản trong RAM đã chết.
      const stored = readRefreshToken()
      if (stored) await api.post('/auth/logout', { refreshToken: stored })
    } finally {
      clear()
      navigate(paths.login, { replace: true })
    }
  }

  return (
    <AntHeader
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        borderBottom: `1px solid ${token.colorBorder}`,
        // Design Stitch: header dính trên, trắng 85% + blur để nội dung cuộn phía sau không chói
        background: 'rgba(255,255,255,.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
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

      <AutoComplete
        className="app-header-search"
        options={options}
        value={keyword}
        onChange={setKeyword}
        onSelect={goTo}
      >
        <Input
          ref={searchRef}
          allowClear
          prefix={<SearchOutlined style={{ color: token.colorTextPlaceholder }} />}
          placeholder="Tìm trang (Ctrl+K)"
          onPressEnter={(e) => goTo((e.target as HTMLInputElement).value)}
        />
      </AutoComplete>

      <div
        className="app-header-right"
        style={{ flex: '1 1 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}
      >
        <Tooltip title="Thông báo">
          <Badge dot>
            <Button
              type="text"
              aria-label="Thông báo"
              icon={<BellOutlined />}
              onClick={() => message.info('Chưa có API thông báo — nối khi backend bổ sung /api/notifications')}
            />
          </Badge>
        </Tooltip>

        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'profile', label: 'Hồ sơ cá nhân', onClick: () => navigate(paths.profile) },
              { key: 'security', label: 'Bảo mật 2FA', onClick: () => navigate(paths.security) },
              { type: 'divider' },
              { key: 'logout', label: 'Đăng xuất', danger: true, icon: <LogoutOutlined />, onClick: logout },
            ],
          }}
        >
          <Space size={10} style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: token.borderRadius }}>
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

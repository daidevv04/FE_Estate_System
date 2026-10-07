import { Menu, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { buildNav, flatNav } from '@/components/layout/nav'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'

/** Menu theo nhóm ở mục 5.2 — mục không có quyền thì ẨN HẲN, không hiện xám */
export function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const role = useAuthStore((s) => s.user?.role)
  const collapsed = useUiStore((s) => s.sidebarCollapsed)

  const items = useMemo<MenuProps['items']>(
    // cast 1 lần: union ItemType của antd không nhận type suy ra từ NavGroup
    () =>
      buildNav(role).map((g) => ({
        key: g.key,
        type: 'group' as const,
        label: g.label,
        children: g.children.map((c) => ({ key: c.key, label: c.label, icon: c.icon })),
      })) as MenuProps['items'],
    [role],
  )

  const selectedKey = useMemo(
    () => flatNav(role).map((i) => i.key).filter((p) => pathname === p || pathname.startsWith(`${p}/`)),
    [role, pathname],
  )

  if (collapsed) {
    return (
      <nav className="sidebar-icon-nav" aria-label="Điều hướng chính">
        {flatNav(role).map((item) => {
          const active = pathname === item.key || pathname.startsWith(`${item.key}/`)
          return (
            <Tooltip key={item.key} title={item.label} placement="right">
              <button
                type="button"
                className={`sidebar-icon-nav__item${active ? ' is-active' : ''}`}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                onClick={() => navigate(item.key)}
              >
                {item.icon}
              </button>
            </Tooltip>
          )
        })}
      </nav>
    )
  }

  return (
    <Menu
      mode="inline"
      items={items}
      selectedKeys={selectedKey}
      onClick={({ key }) => navigate(key)}
      className="app-sidebar-menu"
    />
  )
}

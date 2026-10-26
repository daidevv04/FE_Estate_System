import { Breadcrumb, Space, Typography } from 'antd'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  breadcrumb?: { title: ReactNode; href?: string }[]
  status?: ReactNode
  meta?: string
  actions?: ReactNode
}

export function PageHeader({ title, breadcrumb, status, meta, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      {breadcrumb && breadcrumb.length > 1 && (
        <Breadcrumb
          className="page-header__breadcrumb"
          items={breadcrumb.map(({ title: label, href }) => ({ title: href ? <Link to={href}>{label}</Link> : label }))}
        />
      )}
      <Space align="center" className="page-header__row" wrap>
        <Space align="center" className="page-header__title" wrap>
          <Typography.Title level={1}>{title}</Typography.Title>
          {status}
        </Space>
        {actions && <Space wrap className="page-header__actions">{actions}</Space>}
      </Space>
      {meta && (
        <Typography.Text type="secondary" className="page-header__meta">
          {meta}
        </Typography.Text>
      )}
    </div>
  )
}


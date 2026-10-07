import { Breadcrumb, Space, Typography } from 'antd'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  breadcrumb?: { title: string; href?: string }[]
  status?: ReactNode
  meta?: string
  actions?: ReactNode
}

/** Khối tiêu đề dùng chung: breadcrumb → h1 + tag → dòng meta → nút bên phải (mục 5.4) */
export function PageHeader({ title, breadcrumb, status, meta, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      {breadcrumb && breadcrumb.length > 0 && <Breadcrumb items={breadcrumb} className="page-header__breadcrumb" />}
      <Space align="center" className="page-header__row" wrap>
        <Space align="center" className="page-header__title" wrap>
          <Typography.Title level={4}>{title}</Typography.Title>
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

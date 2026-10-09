import { Space, Typography } from 'antd'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  breadcrumb?: { title: ReactNode; href?: string }[]
  status?: ReactNode
  meta?: string
  actions?: ReactNode
}

/** Khối tiêu đề dùng chung: h1 + tag → dòng meta → nút bên phải */
export function PageHeader({ title, status, meta, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
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



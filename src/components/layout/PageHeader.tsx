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
    <div style={{ marginBottom: 16 }}>
      {breadcrumb && breadcrumb.length > 0 && <Breadcrumb items={breadcrumb} style={{ marginBottom: 8 }} />}
      <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }} wrap>
        <Space align="center" wrap>
          <Typography.Title level={4} style={{ margin: 0 }}>{title}</Typography.Title>
          {status}
        </Space>
        {actions && <Space>{actions}</Space>}
      </Space>
      {meta && (
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 13 }}>
          {meta}
        </Typography.Text>
      )}
    </div>
  )
}

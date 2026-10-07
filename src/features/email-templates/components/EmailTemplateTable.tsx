import { EyeOutlined } from '@ant-design/icons'
import { Button, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ReactNode } from 'react'
import { formatDateTime } from '@/lib/format'
import type { EmailTemplate } from '../api'
import { CategoryPill, StatusPill } from './EmailTemplatePills'

interface Props {
  rows: EmailTemplate[]
  loading: boolean
  emptyText: ReactNode
  onPreview: (row: EmailTemplate) => void
}

/** 9.12: cột chính là tên mẫu + tiêu đề; "Xem trước" là hành động nổi bật của màn. */
export function EmailTemplateTable({ rows, loading, emptyText, onPreview }: Props) {
  const columns: ColumnsType<EmailTemplate> = [
    {
      title: 'TÊN MẪU',
      dataIndex: 'name',
      width: 260,
      render: (value, row) => <button type="button" className="product-code product-code--button" onClick={() => onPreview(row)}>{value}</button>,
    },
    { title: 'TIÊU ĐỀ EMAIL', dataIndex: 'subject', ellipsis: true, render: (value) => value || '—' },
    { title: 'DANH MỤC', dataIndex: 'category', width: 150, render: (value: string) => <CategoryPill category={value} /> },
    { title: 'TRẠNG THÁI', dataIndex: 'status', width: 140, render: (value: string) => <StatusPill status={value} /> },
    { title: 'CẬP NHẬT', dataIndex: 'updatedAt', width: 165, render: (value: string) => <span className="product-muted">{formatDateTime(value)}</span> },
    {
      title: 'THAO TÁC',
      width: 70,
      render: (_, row) => (
        <div className="product-actions">
          <Button type="text" size="small" aria-label={`Xem chi tiết ${row.name}`} icon={<EyeOutlined />} onClick={() => onPreview(row)} />
        </div>
      ),
    },
  ]

  return (
    <Table<EmailTemplate>
      className="product-table"
      rowKey="id"
      size="middle"
      loading={loading}
      columns={columns}
      dataSource={rows}
      pagination={false}
      scroll={{ x: 1200 }}
      locale={{ emptyText }}
    />
  )
}
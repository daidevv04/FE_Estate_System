import {
  CalendarOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  MailOutlined,
  TagOutlined,
} from '@ant-design/icons'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ReactNode } from 'react'
import { SelectableTableContainer } from '@/components/common/SelectableTableContainer'
import { formatDateTime } from '@/lib/format'
import type { EmailTemplate } from '../api'
import { CategoryPill, StatusPill } from './EmailTemplatePills'

interface Props {
  rows: EmailTemplate[]
  loading: boolean
  emptyText: ReactNode
  onPreview: (row: EmailTemplate) => void
  selectedRowKeys?: string[]
  onSelect?: (keys: string[]) => void
}

export function EmailTemplateTable({ rows, loading, emptyText, onPreview, selectedRowKeys, onSelect }: Props) {
  const columns: ColumnsType<EmailTemplate> = [
    {
      title: (
        <span>
          <FileTextOutlined style={{ marginRight: 5, color: '#059669' }} />
          Tên mẫu
        </span>
      ),
      dataIndex: 'name',
      width: 220,
      ellipsis: true,
      render: (value, row) => <button type="button" className="product-code product-code--button" onClick={() => onPreview(row)}>{value}</button>,
    },
    {
      title: (
        <span>
          <MailOutlined style={{ marginRight: 5, color: '#64748b' }} />
          Tiêu đề email
        </span>
      ),
      dataIndex: 'subject',
      ellipsis: true,
      render: (value) => value || '—',
    },
    {
      title: (
        <span>
          <TagOutlined style={{ marginRight: 5, color: '#64748b' }} />
          Danh mục
        </span>
      ),
      dataIndex: 'category',
      width: 140,
      render: (value: string) => <CategoryPill category={value} />,
    },
    {
      title: (
        <span>
          <CheckCircleOutlined style={{ marginRight: 5, color: '#059669' }} />
          Trạng thái
        </span>
      ),
      dataIndex: 'status',
      width: 120,
      render: (value: string) => <StatusPill status={value} />,
    },
    {
      title: (
        <span>
          <CalendarOutlined style={{ marginRight: 5, color: '#64748b' }} />
          Cập nhật
        </span>
      ),
      dataIndex: 'updatedAt',
      width: 150,
      render: (value: string) => <span className="product-muted">{formatDateTime(value)}</span>,
    },
  ]

  const tableElement = (
    <Table<EmailTemplate>
      className="product-table crm-compact-table"
      rowKey="id"
      size="small"
      loading={loading}
      columns={columns}
      dataSource={rows}
      pagination={false}
      scroll={{ x: 750 }}
      locale={{ emptyText }}
      rowSelection={onSelect ? {
        selectedRowKeys,
        onChange: (keys) => onSelect(keys.map(String)),
        preserveSelectedRowKeys: true,
      } : undefined}
      onRow={(row) => ({
        onClick: (e) => {
          const target = e.target as HTMLElement
          if (target.closest('.ant-checkbox-wrapper') || target.closest('button') || target.closest('a')) return
          onPreview(row)
        },
        style: { cursor: 'pointer' },
      })}
    />
  )

  if (!onSelect) return tableElement

  return (
    <SelectableTableContainer
      selectedKeys={selectedRowKeys ?? []}
      onSelectChange={onSelect}
    >
      {tableElement}
    </SelectableTableContainer>
  )
}
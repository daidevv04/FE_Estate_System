import { BellOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Input, Radio, Table, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { StatusPill, type StatusTone } from '@/components/common/StatusPill'
import { formatDate, formatDateTime, formatMoney } from '@/lib/format'
import type { AgingBucket, DebtAgingItem } from '../api'

interface Props {
  items: DebtAgingItem[]
  loading?: boolean
  customerMap?: Map<string, { fullName: string; phone: string | null }>
  staffMap?: Map<string, { fullName: string; email?: string }>
  onSelectDeal?: (dealId: string) => void
  onRemind: (item: DebtAgingItem) => void
}

const BUCKET_LABEL: Record<AgingBucket, string> = {
  DUE_SOON: 'Sắp đến hạn',
  OVERDUE_1_30: 'Quá hạn 1-30 ngày',
  OVERDUE_31_60: 'Quá hạn 31-60 ngày',
  OVERDUE_60_PLUS: 'Quá hạn >60 ngày',
}

const BUCKET_TONE: Record<AgingBucket, StatusTone> = {
  DUE_SOON: 'amber',
  OVERDUE_1_30: 'amber',
  OVERDUE_31_60: 'red',
  OVERDUE_60_PLUS: 'purple',
}

export function DebtAgingTable({
  items,
  loading = false,
  customerMap,
  staffMap,
  onSelectDeal,
  onRemind,
}: Props) {
  const [filterBucket, setFilterBucket] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterBucket !== 'ALL' && item.agingBucket !== filterBucket) {
        return false
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const custName = item.customerId ? (customerMap?.get(item.customerId)?.fullName ?? '') : ''
        const salesName = item.salesId ? (staffMap?.get(item.salesId)?.fullName ?? '') : ''
        const match =
          item.contractCode.toLowerCase().includes(q) ||
          item.productCode.toLowerCase().includes(q) ||
          item.projectName.toLowerCase().includes(q) ||
          custName.toLowerCase().includes(q) ||
          salesName.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [items, filterBucket, search, customerMap, staffMap])

  const columns: ColumnsType<DebtAgingItem> = [
    {
      title: 'Mã hợp đồng',
      dataIndex: 'contractCode',
      width: 140,
      render: (v: string, r) => (
        <Button
          type="link"
          style={{ padding: 0, fontWeight: 700, fontFamily: 'monospace' }}
          onClick={() => onSelectDeal?.(r.dealId)}
        >
          {v}
        </Button>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerId',
      width: 170,
      render: (cid: string | null) => {
        const cust = cid ? customerMap?.get(cid) : null
        return (
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>{cust?.fullName || 'Khách hàng'}</div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {cust?.phone || '—'}
            </Typography.Text>
          </div>
        )
      },
    },
    {
      title: 'Căn hộ / Dự án',
      dataIndex: 'productCode',
      width: 160,
      render: (code: string, r) => (
        <div style={{ lineHeight: 1.3 }}>
          <div style={{ fontWeight: 600, color: '#047857' }}>{code}</div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {r.projectName}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: 'Đợt thanh toán',
      dataIndex: 'installmentName',
      width: 180,
      render: (name: string, r) => (
        <Tooltip title={`Số tiền đợt: ${formatMoney(r.amountDue)}`}>
          <span>{name}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Hạn nộp',
      dataIndex: 'dueDate',
      width: 110,
      render: (v: string) => <span className="stitch-num">{formatDate(v)}</span>,
    },
    {
      title: 'Số tiền nợ',
      dataIndex: 'amountRemaining',
      align: 'right',
      width: 140,
      render: (v: number) => (
        <span className="stitch-num" style={{ fontWeight: 700, color: '#dc2626' }}>
          {formatMoney(v)}
        </span>
      ),
    },
    {
      title: 'Tình trạng tuổi nợ',
      dataIndex: 'agingBucket',
      width: 150,
      render: (b: AgingBucket, r) => {
        const isOverdue = b !== 'DUE_SOON'
        const label = isOverdue ? `Trễ ${r.daysDiff} ngày` : `Còn ${r.daysDiff} ngày`
        return (
          <Tooltip title={BUCKET_LABEL[b]}>
            <StatusPill tone={BUCKET_TONE[b]} size="sm">
              {label}
            </StatusPill>
          </Tooltip>
        )
      },
    },
    {
      title: 'Lần nhắc gần nhất',
      dataIndex: 'lastRemindedAt',
      width: 140,
      render: (v: string | null) => (
        v ? (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {formatDateTime(v)}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
            Chưa nhắc
          </Typography.Text>
        )
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 110,
      align: 'center',
      render: (_, r) => (
        <Button
          size="small"
          type="primary"
          icon={<BellOutlined />}
          style={{ background: '#059669', borderColor: '#059669' }}
          onClick={() => onRemind(r)}
        >
          Nhắc nợ
        </Button>
      ),
    },
  ]

  return (
    <Card className="stitch-card" variant="borderless" styles={{ body: { padding: '16px 20px' } }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <Radio.Group
          value={filterBucket}
          onChange={(e) => setFilterBucket(e.target.value)}
          buttonStyle="solid"
          size="middle"
        >
          <Radio.Button value="ALL">Tất cả ({items.length})</Radio.Button>
          <Radio.Button value="DUE_SOON">Sắp đến hạn</Radio.Button>
          <Radio.Button value="OVERDUE_1_30">Quá hạn 1-30 ngày</Radio.Button>
          <Radio.Button value="OVERDUE_31_60">Quá hạn 31-60 ngày</Radio.Button>
          <Radio.Button value="OVERDUE_60_PLUS">Quá hạn &gt;60 ngày</Radio.Button>
        </Radio.Group>

        <Input
          placeholder="Tìm theo mã HĐ, khách, căn hộ, sales..."
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 280 }}
          allowClear
        />
      </div>

      <Table<DebtAgingItem>
        rowKey="scheduleId"
        columns={columns}
        dataSource={filteredItems}
        loading={loading}
        size="small"
        pagination={{ pageSize: 10, showTotal: (t) => `Tổng cộng ${t} đợt nợ cần xử lý` }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Không có khoản công nợ nào cần thu' }}
      />
    </Card>
  )
}

import { CheckOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Input, Select } from 'antd'

interface Props {
  search: string
  onSearchChange: (v: string) => void
  filterType: string
  onTypeChange: (v: string) => void
  filterPriority: string
  onPriorityChange: (v: string) => void
  filterRead: string
  onReadChange: (v: string) => void
  hasFilters: boolean
  onResetFilters: () => void
  unreadCount: number
  onMarkAllAsRead: () => void
}

export function NotificationFilterBar({
  search,
  onSearchChange,
  filterType,
  onTypeChange,
  filterPriority,
  onPriorityChange,
  filterRead,
  onReadChange,
  hasFilters,
  onResetFilters,
  unreadCount,
  onMarkAllAsRead,
}: Props) {
  return (
    <Card className="stitch-card crm-filter-card" variant="borderless" styles={{ body: { padding: '12px 16px' } }} style={{ marginBottom: 16 }}>
      <div className="crm-filter-bar">
        <Input
          placeholder="Tìm theo tiêu đề, nội dung..."
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ flex: '1.8 1 200px', minWidth: 180 }}
          allowClear
        />
        <Select
          value={filterType}
          onChange={onTypeChange}
          style={{ flex: '1 1 130px', minWidth: 120 }}
          options={[
            { value: 'ALL', label: 'Tất cả loại' },
            { value: 'SYSTEM', label: 'Hệ thống' },
            { value: 'DEAL', label: 'Hợp đồng' },
            { value: 'CUSTOMER', label: 'Khách hàng' },
            { value: 'APPOINTMENT', label: 'Lịch hẹn' },
            { value: 'ALERT', label: 'Khẩn cấp' },
          ]}
        />
        <Select
          value={filterPriority}
          onChange={onPriorityChange}
          style={{ flex: '1 1 130px', minWidth: 120 }}
          options={[
            { value: 'ALL', label: 'Mức độ: Tất cả' },
            { value: 'LOW', label: 'Thấp' },
            { value: 'NORMAL', label: 'Thông thường' },
            { value: 'HIGH', label: 'Quan trọng' },
            { value: 'URGENT', label: 'Khẩn cấp' },
          ]}
        />
        <Select
          value={filterRead}
          onChange={onReadChange}
          style={{ flex: '1.2 1 150px', minWidth: 140 }}
          options={[
            { value: 'ALL', label: 'Tất cả trạng thái' },
            { value: 'UNREAD', label: 'Chưa đọc' },
            { value: 'READ', label: 'Đã đọc' },
          ]}
        />
        {hasFilters && (
          <Button
            className="crm-filter-clear-btn"
            icon={<ReloadOutlined />}
            onClick={onResetFilters}
          >
            Xoá lọc
          </Button>
        )}
        {unreadCount > 0 && (
          <Button icon={<CheckOutlined />} onClick={onMarkAllAsRead} style={{ flex: '0 0 auto' }}>
            Đọc tất cả ({unreadCount})
          </Button>
        )}
      </div>
    </Card>
  )
}

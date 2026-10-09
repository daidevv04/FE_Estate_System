import { CheckOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Input, Select } from 'antd'

interface Props {
  search: string
  onSearchChange: (v: string) => void
  filterType: string
  onTypeChange: (v: string) => void
  filterPriority: string
  onPriorityChange: (v: string) => void
  filterRead: string
  onReadChange: (v: string) => void
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
  unreadCount,
  onMarkAllAsRead,
}: Props) {
  return (
    <div className="notif-filter-bar">
      <div className="notif-filter-left">
        <Input
          placeholder="Tìm theo tiêu đề, nội dung..."
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ width: 240 }}
          allowClear
        />
        <Select
          value={filterType}
          onChange={onTypeChange}
          style={{ width: 140 }}
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
          style={{ width: 140 }}
          options={[
            { value: 'ALL', label: 'Mức độ' },
            { value: 'LOW', label: 'Thấp' },
            { value: 'NORMAL', label: 'Thông thường' },
            { value: 'HIGH', label: 'Quan trọng' },
            { value: 'URGENT', label: 'Khẩn cấp' },
          ]}
        />
        <Select
          value={filterRead}
          onChange={onReadChange}
          style={{ width: 130 }}
          options={[
            { value: 'ALL', label: 'Tất cả trạng thái' },
            { value: 'UNREAD', label: 'Chưa đọc' },
            { value: 'READ', label: 'Đã đọc' },
          ]}
        />
      </div>
      {unreadCount > 0 && (
        <Button icon={<CheckOutlined />} onClick={onMarkAllAsRead}>
          Đọc tất cả ({unreadCount})
        </Button>
      )}
    </div>
  )
}

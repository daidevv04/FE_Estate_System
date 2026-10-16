import { CheckOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Modal, Table } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { SelectableTableContainer } from '@/components/common/SelectableTableContainer'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import type { AppNotification, CreateNotificationInput } from '@/types/notification'
import { NotificationDetailModal } from '../components/NotificationDetailModal'
import { NotificationFilterBar } from '../components/NotificationFilterBar'
import { NotificationKpis } from '../components/NotificationKpis'
import { SendNotificationModal } from '../components/SendNotificationModal'
import { buildNotificationColumns } from '../components/NotificationTableColumns'
import './NotificationPage.css'

export function NotificationPage() {
  const { message } = App.useApp()
  const currentUser = useAuthStore((s) => s.user)
  const canSend = currentUser?.role === 'ADMIN'
  const notifications = useNotificationStore((s) => s.notifications)
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications)
  const sendNotification = useNotificationStore((s) => s.sendNotification)
  const markAsRead = useNotificationStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead)
  const deleteNotification = useNotificationStore((s) => s.deleteNotification)

  useEffect(() => {
    void fetchNotifications()
  }, [fetchNotifications])

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [filterPriority, setFilterPriority] = useState('ALL')
  const [filterRead, setFilterRead] = useState('ALL')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null)
  const [selected, setSelected] = useState<string[]>([])

  const filtered = useMemo(() => {
    return notifications.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim()
        if (!item.title.toLowerCase().includes(q) && !item.content.toLowerCase().includes(q)) return false
      }
      if (filterType !== 'ALL' && item.type !== filterType) return false
      if (filterPriority !== 'ALL' && item.priority !== filterPriority) return false
      if (filterRead === 'UNREAD' && item.read) return false
      if (filterRead === 'READ' && !item.read) return false
      return true
    })
  }, [notifications, search, filterType, filterPriority, filterRead])

  const stats = useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    deals: notifications.filter((n) => n.type === 'DEAL').length,
    urgent: notifications.filter((n) => n.priority === 'HIGH' || n.priority === 'URGENT').length,
  }), [notifications])

  const handleSend = async (values: CreateNotificationInput) => {
    const sender = currentUser?.fullName || currentUser?.username || 'Ban Quản Trị'
    await sendNotification(values, sender)
    message.success('Đã phát thông báo thành công!')
    setCreateModalOpen(false)
  }

  const handleBulkRead = () => {
    if (!selected.length) return
    selected.forEach((id) => markAsRead(id))
    message.success(`Đã đánh dấu đã đọc ${selected.length} thông báo`)
    setSelected([])
  }

  const handleBulkDelete = () => {
    if (!selected.length) return
    Modal.confirm({
      title: `Xóa ${selected.length} thông báo đã chọn?`,
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa thông báo',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: () => {
        selected.forEach((id) => deleteNotification(id))
        message.success(`Đã xóa ${selected.length} thông báo`)
        setSelected([])
      },
    })
  }

  const columns = useMemo(
    () =>
      buildNotificationColumns({
        onSelect: (r) => {
          markAsRead(r.id)
          setSelectedNotif(r)
        },
      }),
    [markAsRead],
  )

  return (
    <div className="notif-page">
      <PageHeader
        title="Quản lý thông báo"
        breadcrumb={[{ title: 'Trang chủ', href: paths.dashboard }, { title: 'Quản lý thông báo' }]}
        meta="Hệ thống thông báo tức thời, phát thông điệp và quản lý bản tin cho toàn doanh nghiệp"
        actions={
          canSend ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
              Gửi thông báo mới
            </Button>
          ) : undefined
        }
      />

      <NotificationKpis total={stats.total} unread={stats.unread} deals={stats.deals} urgent={stats.urgent} />

      <NotificationFilterBar
        search={search}
        onSearchChange={setSearch}
        filterType={filterType}
        onTypeChange={setFilterType}
        filterPriority={filterPriority}
        onPriorityChange={setFilterPriority}
        filterRead={filterRead}
        onReadChange={setFilterRead}
        hasFilters={Boolean(search || filterType !== 'ALL' || filterPriority !== 'ALL' || filterRead !== 'ALL')}
        onResetFilters={() => {
          setSearch('')
          setFilterType('ALL')
          setFilterPriority('ALL')
          setFilterRead('ALL')
        }}
        unreadCount={stats.unread}
        onMarkAllAsRead={markAllAsRead}
      />

      {selected.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 14,
            padding: '10px 16px',
            borderRadius: 8,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <span style={{ fontWeight: 600, color: '#0f172a' }}>Đã chọn {selected.length} thông báo</span>
          <Button icon={<CheckOutlined />} onClick={handleBulkRead}>
            Đánh dấu đã đọc ({selected.length})
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleBulkDelete}>
            Xóa ({selected.length})
          </Button>
          <div style={{ flex: 1 }} />
          <Button type="text" onClick={() => setSelected([])}>
            Bỏ chọn
          </Button>
        </div>
      )}

      <SelectableTableContainer
        selectedKeys={selected}
        onSelectChange={setSelected}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (total, range) => `Hiển thị ${range[0]} - ${range[1]} trong tổng số ${total} thông báo`,
          }}
          rowSelection={{
            selectedRowKeys: selected,
            onChange: (keys) => setSelected(keys.map(String)),
            preserveSelectedRowKeys: true,
          }}
          onRow={(r) => ({
            onClick: (e) => {
              const target = e.target as HTMLElement
              if (target.closest('.ant-checkbox-wrapper') || target.closest('button') || target.closest('a')) return
              markAsRead(r.id)
              setSelectedNotif(r)
            },
            style: { cursor: 'pointer' },
          })}
          className="stitch-card"
          locale={{ emptyText: 'Không có thông báo phù hợp' }}
        />
      </SelectableTableContainer>

      <SendNotificationModal
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onSubmit={handleSend}
      />

      <NotificationDetailModal
        notif={selectedNotif}
        onClose={() => setSelectedNotif(null)}
      />
    </div>
  )
}

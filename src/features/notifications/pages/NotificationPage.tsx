import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Table } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
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

  const columns = useMemo(
    () =>
      buildNotificationColumns({
        onSelect: (r) => {
          markAsRead(r.id)
          setSelectedNotif(r)
        },
        onToggleRead: (id) => markAsRead(id),
        onDelete: (id) => deleteNotification(id),
      }),
    [markAsRead, deleteNotification],
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

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        className="stitch-card"
      />

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

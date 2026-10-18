import {
  CalendarOutlined,
  DeleteOutlined,
  EyeOutlined,
  HistoryOutlined,
  MailOutlined,
  MessageOutlined,
  PhoneOutlined,
  ReloadOutlined,
  SearchOutlined,
  TableOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  DatePicker,
  Empty,
  Input,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import { useMemo, useState } from 'react'
import { KpiCard } from '@/components/common/KpiCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDateTime } from '@/lib/format'
import { useAuthStore } from '@/store/authStore'
import {
  CARE_TYPE_LABEL,
  apiErrorMessage,
  customerCode,
  useAllCustomerCares,
  useCareMutations,
  useCustomers,
  useStaff,
  type CareType,
  type CustomerCare,
  type StaffUser,
} from '../api'
import { CustomerDetailModal } from '../components/CustomerDetailModal'
import './CustomerCarePage.css'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const DATE_PRESETS: { label: string; value: [dayjs.Dayjs, dayjs.Dayjs] }[] = [
  { label: 'Hôm nay', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
  { label: '7 ngày qua', value: [dayjs().subtract(7, 'day').startOf('day'), dayjs().endOf('day')] },
  { label: '30 ngày qua', value: [dayjs().subtract(30, 'day').startOf('day'), dayjs().endOf('day')] },
  { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
]

const CARE_CONFIG: Record<
  CareType,
  { label: string; icon: React.ReactNode; color: string; tagColor: string }
> = {
  CALL: {
    label: 'Cuộc gọi',
    icon: <PhoneOutlined />,
    color: '#0284c7',
    tagColor: 'blue',
  },
  MEETING: {
    label: 'Gặp mặt',
    icon: <CalendarOutlined />,
    color: '#059669',
    tagColor: 'green',
  },
  EMAIL: {
    label: 'Email',
    icon: <MailOutlined />,
    color: '#7c3aed',
    tagColor: 'purple',
  },
  NOTE: {
    label: 'Ghi chú',
    icon: <MessageOutlined />,
    color: '#d97706',
    tagColor: 'orange',
  },
}

export function CustomerCarePage() {
  const { message } = App.useApp()
  const user = useAuthStore((s) => s.user)
  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  // Filter state
  const [keyword, setKeyword] = useState('')
  const [selectedType, setSelectedType] = useState<CareType | undefined>(undefined)
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | undefined>(undefined)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table')

  // Modals state
  const [detailCustomerId, setDetailCustomerId] = useState<string | undefined>(undefined)

  // Queries
  const staffQuery = useStaff()
  const customersQuery = useCustomers()
  const caresQuery = useAllCustomerCares({ size: 1000 })

  const { remove: removeCare } = useCareMutations()

  const allCares = caresQuery.data?.content ?? []
  const rawStaff = staffQuery.data
  const staffList: StaffUser[] = Array.isArray(rawStaff)
    ? rawStaff
    : ((rawStaff as unknown as { content?: StaffUser[] })?.content ?? [])
  const customerList = customersQuery.data?.content ?? []

  const staffName = (uid?: string | null) => {
    if (!uid) return 'Chưa phân công'
    return staffList.find((s) => s.id === uid)?.fullName ?? (uid === user?.id ? 'Tôi' : (typeof uid === 'string' ? uid.slice(0, 8) : '—'))
  }

  // Filtered care logs
  const filteredCares = useMemo(() => {
    let list = allCares
    const kw = keyword.trim().toLowerCase()
    if (kw) {
      list = list.filter((c) => {
        const found = customerList.find((cust) => cust.id === c.customerId)
        const name = (c.customerName || found?.fullName || '').toLowerCase()
        const phone = (c.customerPhone || found?.phone || '').toLowerCase()
        const code = (found ? customerCode(found) : '').toLowerCase()
        const content = (c.content || '').toLowerCase()
        const staff = staffName(c.createdBy).toLowerCase()
        return (
          name.includes(kw) ||
          phone.includes(kw) ||
          code.includes(kw) ||
          content.includes(kw) ||
          staff.includes(kw)
        )
      })
    }
    if (selectedType) {
      list = list.filter((c) => c.type === selectedType)
    }
    if (selectedOwnerId) {
      list = list.filter((c) => c.createdBy === selectedOwnerId)
    }
    if (selectedCustomerId) {
      list = list.filter((c) => c.customerId === selectedCustomerId)
    }
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf('day').valueOf()
      const end = dateRange[1].endOf('day').valueOf()
      list = list.filter((c) => {
        const t = dayjs(c.createdAt).valueOf()
        return t >= start && t <= end
      })
    }
    return list
  }, [allCares, keyword, selectedType, selectedOwnerId, selectedCustomerId, dateRange, customerList, staffList, user?.id])

  // KPI calculations
  const kpis = useMemo(() => {
    let call = 0
    let meeting = 0
    let email = 0
    let note = 0
    filteredCares.forEach((item) => {
      if (item.type === 'CALL') call++
      else if (item.type === 'MEETING') meeting++
      else if (item.type === 'EMAIL') email++
      else if (item.type === 'NOTE') note++
    })
    return {
      total: filteredCares.length,
      call,
      meeting,
      email,
      note,
    }
  }, [filteredCares])

  const handleClearFilters = () => {
    setKeyword('')
    setSelectedType(undefined)
    setSelectedOwnerId(undefined)
    setSelectedCustomerId(undefined)
    setDateRange(null)
  }

  const hasFilter = Boolean(
    keyword ||
      selectedType ||
      selectedOwnerId ||
      selectedCustomerId ||
      (dateRange && (dateRange[0] || dateRange[1]))
  )

  const handleDeleteCare = (care: CustomerCare) => {
    removeCare.mutate(
      { careId: care.id, targetCustomerId: care.customerId },
      {
        onSuccess: () => {
          message.success('Đã xóa ghi nhận chăm sóc')
          void caresQuery.refetch()
        },
        onError: (err) => message.error(apiErrorMessage(err)),
      },
    )
  }

  const canDelete = (createdBy?: string | null) =>
    Boolean(user?.role === 'ADMIN' || user?.role === 'MANAGER' || (createdBy && user?.id === createdBy))

  // Table columns
  const columns: ColumnsType<CustomerCare> = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v: string) => (
        <Tooltip title={dayjs(v).fromNow()}>
          <span style={{ fontSize: 13, color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
            {formatDateTime(v)}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      width: 220,
      render: (_, r) => {
        const found = customerList.find((c) => c.id === r.customerId)
        const name = r.customerName || found?.fullName || 'Khách hàng'
        const phone = r.customerPhone || found?.phone || '—'
        const code = found ? customerCode(found) : null
        return (
          <div>
            <div
              className="customer-care-page__customer-link"
              onClick={() => setDetailCustomerId(r.customerId)}
            >
              <span>{name}</span>
            </div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {phone} {code ? `· ${code}` : ''}
            </Typography.Text>
          </div>
        )
      },
    },
    {
      title: 'Hình thức',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: (type: CareType) => {
        const cfg = CARE_CONFIG[type]
        return (
          <Tag
            color={cfg.tagColor}
            style={{
              borderRadius: 12,
              padding: '1px 8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontWeight: 500,
            }}
          >
            {cfg.icon}
            {cfg.label}
          </Tag>
        )
      },
    },
    {
      title: 'Nội dung trao đổi / Kết quả',
      dataIndex: 'content',
      key: 'content',
      ellipsis: false,
      render: (text: string) => (
        <div style={{ fontSize: 13, color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
          {text}
        </div>
      ),
    },
    {
      title: 'Nhân sự',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 160,
      render: (uid: string) => (
        <Space size={6}>
          <UserOutlined style={{ color: '#64748b', fontSize: 12 }} />
          <span style={{ fontSize: 13, color: '#334155' }}>{staffName(uid)}</span>
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 90,
      align: 'center',
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="Xem thông tin khách hàng">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setDetailCustomerId(record.customerId)}
            />
          </Tooltip>
          {canDelete(record.createdBy) && (
            <Popconfirm
              title="Xóa ghi nhận này?"
              description="Hành động này không thể hoàn tác"
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDeleteCare(record)}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="customer-care-page">
      <PageHeader
        title="Nhật ký chăm sóc khách hàng"
        meta="Quản lý và theo dõi toàn diện tiến trình tư vấn, cuộc gọi và tương tác của Sales với khách hàng"
        actions={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void caresQuery.refetch()}
            loading={caresQuery.isFetching}
          >
            Làm mới
          </Button>
        }
      />

      {/* KPI Section */}
      <div className="customer-care-page__kpis">
        <KpiCard
          label="Tổng lượt tương tác"
          value={kpis.total}
          icon={<HistoryOutlined />}
          tone="green"
          loading={caresQuery.isLoading}
        />
        <KpiCard
          label="Cuộc gọi tư vấn"
          value={kpis.call}
          icon={<PhoneOutlined />}
          tone="blue"
          loading={caresQuery.isLoading}
        />
        <KpiCard
          label="Cuộc hẹn & Gặp mặt"
          value={kpis.meeting}
          icon={<CalendarOutlined />}
          tone="green"
          loading={caresQuery.isLoading}
        />
        <KpiCard
          label="Email chăm sóc"
          value={kpis.email}
          icon={<MailOutlined />}
          tone="purple"
          loading={caresQuery.isLoading}
        />
        <KpiCard
          label="Ghi chú & Phản hồi"
          value={kpis.note}
          icon={<MessageOutlined />}
          tone="amber"
          loading={caresQuery.isLoading}
        />
      </div>

      {/* Filter Card */}
      <Card className="stitch-card crm-filter-card" variant="borderless" styles={{ body: { padding: '12px 16px' } }}>
        <div className="crm-filter-bar">
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder="Tìm theo tên khách, SĐT, nội dung..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ flex: '1.8 1 200px', minWidth: 180 }}
          />

          <Select
            placeholder="Tất cả hình thức"
            allowClear
            value={selectedType}
            onChange={(val) => setSelectedType(val)}
            style={{ flex: '1 1 140px', minWidth: 130 }}
            options={[
              { value: undefined, label: 'Tất cả hình thức' },
              ...Object.entries(CARE_TYPE_LABEL).map(([val, label]) => ({
                value: val,
                label: (
                  <Space size={6}>
                    {CARE_CONFIG[val as CareType]?.icon}
                    <span>{label}</span>
                  </Space>
                ),
              })),
            ]}
          />

          {isManagerOrAdmin && (
            <Select
              placeholder="Tất cả nhân sự"
              allowClear
              showSearch
              optionFilterProp="label"
              value={selectedOwnerId}
              onChange={(val) => setSelectedOwnerId(val)}
              style={{ flex: '1.2 1 160px', minWidth: 150 }}
              options={staffList.map((s) => ({
                value: s.id,
                label: `${s.fullName} (${s.role})`,
              }))}
            />
          )}

          <Select
            placeholder="Tất cả khách hàng"
            allowClear
            showSearch
            optionFilterProp="label"
            value={selectedCustomerId}
            onChange={(val) => setSelectedCustomerId(val)}
            style={{ flex: '1.2 1 180px', minWidth: 160 }}
            options={customerList.map((c) => ({
              value: c.id,
              label: `${c.fullName}${c.phone ? ' - ' + c.phone : ''}`,
            }))}
          />

          <DatePicker.RangePicker
            value={dateRange}
            onChange={(val) => setDateRange(val as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
            format="DD/MM/YYYY"
            placeholder={['Từ ngày', 'Đến ngày']}
            presets={DATE_PRESETS}
            allowClear
            style={{ flex: '1.5 1 230px', minWidth: 210 }}
          />

          {hasFilter && (
            <Button
              className="crm-filter-clear-btn"
              icon={<ReloadOutlined />}
              onClick={handleClearFilters}
            >
              Xoá lọc
            </Button>
          )}

          <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <Segmented
              value={viewMode}
              onChange={(val) => setViewMode(val as 'table' | 'timeline')}
              options={[
                { label: 'Bảng dữ liệu', value: 'table', icon: <TableOutlined /> },
                { label: 'Dòng thời gian', value: 'timeline', icon: <UnorderedListOutlined /> },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Main Content Area */}
      <Card className="stitch-card" variant="borderless" styles={{ body: { padding: 0 } }}>
        {viewMode === 'table' ? (
          <Table<CustomerCare>
            columns={columns}
            dataSource={filteredCares}
            rowKey="id"
            loading={caresQuery.isLoading}
            pagination={{
              defaultPageSize: 20,
              pageSizeOptions: [10, 20, 50, 100],
              showSizeChanger: true,
              showTotal: (total, range) =>
                `Hiển thị ${range[0]} - ${range[1]} trong tổng số ${total} lượt chăm sóc`,
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    hasFilter
                      ? 'Không có nhật ký chăm sóc phù hợp với bộ lọc'
                      : 'Chưa có dữ liệu nhật ký chăm sóc khách hàng'
                  }
                />
              ),
            }}
          />
        ) : (
          <div className="customer-care-page__timeline-wrapper">
            {caresQuery.isLoading ? (
              <div style={{ padding: 24 }}>
                <Typography.Text type="secondary">Đang tải dòng thời gian...</Typography.Text>
              </div>
            ) : filteredCares.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Không có nhật ký chăm sóc phù hợp với bộ lọc"
                style={{ padding: '40px 0' }}
              />
            ) : (
              <Timeline
                items={filteredCares.map((item) => {
                  const cfg = CARE_CONFIG[item.type]
                  const found = customerList.find((c) => c.id === item.customerId)
                  const name = item.customerName || found?.fullName || 'Khách hàng'
                  const phone = item.customerPhone || found?.phone || '—'
                  return {
                    dot: (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: cfg.color,
                          color: '#fff',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 14,
                        }}
                      >
                        {cfg.icon}
                      </div>
                    ),
                    children: (
                      <div className="customer-care-page__timeline-card">
                        <div className="customer-care-page__timeline-card-header">
                          <Space size={8}>
                            <Tag color={cfg.tagColor} style={{ borderRadius: 12, margin: 0, fontWeight: 500 }}>
                              {cfg.label}
                            </Tag>
                            <span
                              className="customer-care-page__customer-link"
                              onClick={() => setDetailCustomerId(item.customerId)}
                            >
                              {name}
                            </span>
                            <span style={{ fontSize: 12, color: '#64748b' }}>
                              {phone} {found ? `· ${customerCode(found)}` : ''}
                            </span>
                          </Space>
                          <Space size={12}>
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>
                              {formatDateTime(item.createdAt)}
                            </span>
                            {canDelete(item.createdBy) && (
                              <Popconfirm
                                title="Xóa ghi nhận này?"
                                okText="Xóa"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                                onConfirm={() => handleDeleteCare(item)}
                              >
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                                />
                              </Popconfirm>
                            )}
                          </Space>
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                          Nhân sự: <strong>{staffName(item.createdBy)}</strong>
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#1e293b' }}>
                          {item.content}
                        </div>
                      </div>
                    ),
                  }
                })}
              />
            )}
          </div>
        )}
      </Card>

      {/* Modal Chi Tiết Khách Hàng */}
      {detailCustomerId && (
        <CustomerDetailModal
          customerId={detailCustomerId}
          staff={staffList}
          canWrite={true}
          onClose={() => setDetailCustomerId(undefined)}
          onEdit={() => {}}
        />
      )}
    </div>
  )
}

import {
  CalendarOutlined,
  DeleteOutlined,
  EyeOutlined,
  HistoryOutlined,
  MailOutlined,
  MessageOutlined,
  PhoneOutlined,
  PlusOutlined,
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
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
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
} from '../api'
import { CustomerDetailModal } from '../components/CustomerDetailModal'
import './CustomerCarePage.css'

dayjs.extend(relativeTime)
dayjs.locale('vi')

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
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table')

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [detailCustomerId, setDetailCustomerId] = useState<string | undefined>(undefined)

  const [form] = Form.useForm()

  // Queries
  const staffQuery = useStaff()
  const customersQuery = useCustomers()
  const caresQuery = useAllCustomerCares({
    keyword: keyword.trim() || undefined,
    type: selectedType,
    ownerId: selectedOwnerId,
  })

  const { create: createCare, remove: removeCare } = useCareMutations()

  const allCares = caresQuery.data?.content ?? []
  const staffList = staffQuery.data ?? []
  const customerList = customersQuery.data?.content ?? []

  const staffName = (uid: string) =>
    staffList.find((s) => s.id === uid)?.fullName ?? (uid === user?.id ? 'Tôi' : uid.slice(0, 8))

  // KPI calculations
  const kpis = useMemo(() => {
    let call = 0
    let meeting = 0
    let email = 0
    let note = 0
    allCares.forEach((item) => {
      if (item.type === 'CALL') call++
      else if (item.type === 'MEETING') meeting++
      else if (item.type === 'EMAIL') email++
      else if (item.type === 'NOTE') note++
    })
    return {
      total: allCares.length,
      call,
      meeting,
      email,
      note,
    }
  }, [allCares])

  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields()
      await createCare.mutateAsync({
        targetCustomerId: values.customerId,
        type: values.type,
        content: values.content,
      })
      message.success('Đã lưu nhật ký chăm sóc thành công')
      setCreateModalOpen(false)
      form.resetFields()
      void caresQuery.refetch()
    } catch (err: unknown) {
      if ((err as { errorFields?: unknown })?.errorFields) return
      message.error(apiErrorMessage(err))
    }
  }

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

  const canDelete = (createdBy: string) =>
    user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.id === createdBy

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
          <UserOutlined style={{ color: '#94a3b8' }} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>{staffName(uid)}</span>
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Xem chi tiết khách hàng">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setDetailCustomerId(r.customerId)}
            />
          </Tooltip>
          {canDelete(r.createdBy) && (
            <Popconfirm
              title="Xóa ghi nhận này?"
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDeleteCare(r)}
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
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
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void caresQuery.refetch()}>
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
              style={{
                background: '#059669',
                borderColor: '#059669',
                fontWeight: 600,
                borderRadius: 8,
              }}
            >
              Ghi nhận chăm sóc
            </Button>
          </Space>
        }
      />

      {/* KPI Section */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} md={6} lg={4} xl={4} style={{ flex: '1 1 200px' }}>
          <KpiCard
            label="Tổng lượt tương tác"
            value={kpis.total}
            icon={<HistoryOutlined />}
            tone="green"
            loading={caresQuery.isLoading}
          />
        </Col>
        <Col xs={12} sm={8} md={6} lg={4} xl={4} style={{ flex: '1 1 200px' }}>
          <KpiCard
            label="Cuộc gọi tư vấn"
            value={kpis.call}
            icon={<PhoneOutlined />}
            tone="blue"
            loading={caresQuery.isLoading}
          />
        </Col>
        <Col xs={12} sm={8} md={6} lg={4} xl={4} style={{ flex: '1 1 200px' }}>
          <KpiCard
            label="Cuộc hẹn & Gặp mặt"
            value={kpis.meeting}
            icon={<CalendarOutlined />}
            tone="green"
            loading={caresQuery.isLoading}
          />
        </Col>
        <Col xs={12} sm={8} md={6} lg={4} xl={4} style={{ flex: '1 1 200px' }}>
          <KpiCard
            label="Email chăm sóc"
            value={kpis.email}
            icon={<MailOutlined />}
            tone="purple"
            loading={caresQuery.isLoading}
          />
        </Col>
        <Col xs={12} sm={8} md={6} lg={4} xl={4} style={{ flex: '1 1 200px' }}>
          <KpiCard
            label="Ghi chú & Phản hồi"
            value={kpis.note}
            icon={<MessageOutlined />}
            tone="amber"
            loading={caresQuery.isLoading}
          />
        </Col>
      </Row>

      {/* Filter Card */}
      <Card className="stitch-card" variant="borderless" styles={{ body: { padding: '14px 18px' } }}>
        <div className="customer-care-page__filters">
          <div className="customer-care-page__filters-left">
            <Input.Search
              placeholder="Tìm theo tên khách, SĐT, nội dung..."
              allowClear
              onSearch={(v) => setKeyword(v)}
              style={{ width: 280 }}
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            />

            <Select
              placeholder="Tất cả hình thức"
              allowClear
              value={selectedType}
              onChange={(val) => setSelectedType(val)}
              style={{ width: 170 }}
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
                placeholder="Lọc theo nhân sự phụ trách"
                allowClear
                value={selectedOwnerId}
                onChange={(val) => setSelectedOwnerId(val)}
                style={{ width: 220 }}
                options={staffList.map((s) => ({
                  value: s.id,
                  label: `${s.fullName} (${s.role})`,
                }))}
              />
            )}
          </div>

          <div className="customer-care-page__filters-right">
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
            dataSource={allCares}
            rowKey="id"
            loading={caresQuery.isLoading}
            pagination={{
              pageSize: 15,
              showTotal: (total) => `Tổng cộng ${total} lượt chăm sóc`,
              showSizeChanger: true,
              pageSizeOptions: ['15', '30', '50'],
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa có dữ liệu nhật ký chăm sóc khách hàng"
                >
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalOpen(true)}
                  >
                    Ghi nhận ngay
                  </Button>
                </Empty>
              ),
            }}
          />
        ) : (
          <div className="customer-care-page__timeline-wrapper">
            {caresQuery.isLoading ? (
              <div style={{ padding: 24 }}>
                <Typography.Text type="secondary">Đang tải dòng thời gian...</Typography.Text>
              </div>
            ) : allCares.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Không có nhật ký chăm sóc phù hợp với bộ lọc"
                style={{ padding: '40px 0' }}
              />
            ) : (
              <Timeline
                items={allCares.map((item) => {
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
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              ({phone})
                            </Typography.Text>
                          </Space>
                          <Space size={8}>
                            <Tooltip title={dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}>
                              <span style={{ fontSize: 12, color: '#64748b' }}>
                                {dayjs(item.createdAt).fromNow()}
                              </span>
                            </Tooltip>
                            <Typography.Text strong style={{ fontSize: 12 }}>
                              · {staffName(item.createdBy)}
                            </Typography.Text>
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
                                  icon={<DeleteOutlined />}
                                  style={{ padding: '0 4px', height: 20 }}
                                />
                              </Popconfirm>
                            )}
                          </Space>
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

      {/* Modal Tạo Ghi Nhận Mới */}
      <Modal
        open={createModalOpen}
        title="Ghi nhận hoạt động chăm sóc khách hàng"
        okText="Lưu ghi nhận"
        cancelText="Hủy"
        confirmLoading={createCare.isPending}
        onOk={handleCreateSubmit}
        onCancel={() => {
          setCreateModalOpen(false)
          form.resetFields()
        }}
        width={560}
        centered
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ type: 'CALL' }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="customerId"
            label="Khách hàng tiếp nhận"
            rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
          >
            <Select
              showSearch
              placeholder="Chọn khách hàng phụ trách..."
              optionFilterProp="label"
              options={customerList.map((c) => ({
                value: c.id,
                label: `${c.fullName} - ${c.phone ?? 'Chưa có SĐT'} (${customerCode(c)})`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="type"
            label="Hình thức tương tác"
            rules={[{ required: true, message: 'Vui lòng chọn hình thức' }]}
          >
            <Select
              options={Object.entries(CARE_TYPE_LABEL).map(([val, label]) => ({
                value: val,
                label: (
                  <Space>
                    {CARE_CONFIG[val as CareType]?.icon}
                    <span>{label}</span>
                  </Space>
                ),
              }))}
            />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung chăm sóc / Phản hồi khách hàng"
            rules={[
              { required: true, message: 'Vui lòng nhập nội dung chăm sóc' },
              { min: 5, message: 'Nội dung tối thiểu 5 ký tự' },
            ]}
          >
            <Input.TextArea
              rows={4}
              maxLength={2000}
              showCount
              placeholder="Nhập chi tiết cuộc gọi, nhu cầu tư vấn hoặc các cam kết đã thảo luận với khách hàng..."
            />
          </Form.Item>
        </Form>
      </Modal>

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

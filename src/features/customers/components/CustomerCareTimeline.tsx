import {
  CalendarOutlined,
  DeleteOutlined,
  MailOutlined,
  MessageOutlined,
  PhoneOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import {
  App,
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import { useMemo, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import {
  CARE_TYPE_LABEL,
  apiErrorMessage,
  useCareMutations,
  useCustomerCares,
  type CareType,
  type StaffUser,
} from '../api'
import './CustomerCareTimeline.css'

dayjs.extend(relativeTime)
dayjs.locale('vi')

export interface CustomerCareTimelineProps {
  customerId: string
  canWrite?: boolean
  staff?: StaffUser[]
  onCareAdded?: () => void
}

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

export function CustomerCareTimeline({
  customerId,
  canWrite = true,
  staff = [],
  onCareAdded,
}: CustomerCareTimelineProps) {
  const { message } = App.useApp()
  const user = useAuthStore((s) => s.user)
  const caresQuery = useCustomerCares(customerId)
  const { create: createCare, remove: removeCare } = useCareMutations(customerId)

  const [filterType, setFilterType] = useState<CareType | 'ALL'>('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const staffName = (uid: string) =>
    staff.find((s) => s.id === uid)?.fullName ?? (uid === user?.id ? 'Tôi' : uid.slice(0, 8))

  const allCares = caresQuery.data?.content ?? []

  const filteredCares = useMemo(() => {
    if (filterType === 'ALL') return allCares
    return allCares.filter((c) => c.type === filterType)
  }, [allCares, filterType])

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      await createCare.mutateAsync(values)
      message.success('Đã lưu nhật ký chăm sóc')
      setModalOpen(false)
      form.resetFields()
      onCareAdded?.()
    } catch (err: unknown) {
      if ((err as { errorFields?: unknown })?.errorFields) return
      message.error(apiErrorMessage(err))
    }
  }

  const handleDelete = (careId: string) => {
    removeCare.mutate(careId, {
      onSuccess: () => message.success('Đã xóa ghi nhận'),
      onError: (err) => message.error(apiErrorMessage(err)),
    })
  }

  const canDeleteCare = (createdBy: string) =>
    user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.id === createdBy

  return (
    <div className="customer-care-timeline">
      <div className="customer-care-timeline__header">
        <div className="customer-care-timeline__filters">
          <button
            type="button"
            className={`customer-care-timeline__filter-btn ${filterType === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterType('ALL')}
          >
            Tất cả ({allCares.length})
          </button>
          {(Object.keys(CARE_TYPE_LABEL) as CareType[]).map((t) => {
            const count = allCares.filter((c) => c.type === t).length
            return (
              <button
                type="button"
                key={t}
                className={`customer-care-timeline__filter-btn ${filterType === t ? 'active' : ''}`}
                onClick={() => setFilterType(t)}
              >
                {CARE_CONFIG[t].label} ({count})
              </button>
            )
          })}
        </div>

        {canWrite && (
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
            style={{
              background: '#059669',
              borderColor: '#059669',
              borderRadius: 6,
              fontWeight: 500,
            }}
          >
            Ghi nhận chăm sóc
          </Button>
        )}
      </div>

      {caresQuery.isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : filteredCares.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            filterType === 'ALL'
              ? 'Chưa có nhật ký chăm sóc nào. Hãy ghi nhận tương tác đầu tiên!'
              : `Chưa có ghi nhận nào thuộc loại ${CARE_CONFIG[filterType].label.toLowerCase()}.`
          }
          style={{ margin: '20px 0' }}
        >
          {canWrite && filterType === 'ALL' && (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
            >
              Ghi nhận ngay
            </Button>
          )}
        </Empty>
      ) : (
        <div className="customer-care-timeline__list">
          <Timeline
            items={filteredCares.map((care) => {
              const cfg = CARE_CONFIG[care.type]
              return {
                dot: (
                  <div className={`customer-care-item__dot customer-care-item__dot--${care.type}`}>
                    {cfg.icon}
                  </div>
                ),
                children: (
                  <div className="customer-care-item">
                    <div className="customer-care-item__header">
                      <Space size={6}>
                        <Tag color={cfg.tagColor} style={{ borderRadius: 12, margin: 0, fontWeight: 500 }}>
                          {cfg.label}
                        </Tag>
                        <Typography.Text strong style={{ fontSize: 13 }}>
                          {staffName(care.createdBy)}
                        </Typography.Text>
                      </Space>
                      <Space size={8}>
                        <Tooltip title={dayjs(care.createdAt).format('DD/MM/YYYY HH:mm')}>
                          <span className="customer-care-item__meta">
                            {dayjs(care.createdAt).fromNow()}
                          </span>
                        </Tooltip>
                        {canDeleteCare(care.createdBy) && (
                          <Popconfirm
                            title="Xóa ghi nhận chăm sóc này?"
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleDelete(care.id)}
                          >
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              style={{ padding: '0 4px', height: 22 }}
                            />
                          </Popconfirm>
                        )}
                      </Space>
                    </div>
                    <div className="customer-care-item__content">{care.content}</div>
                  </div>
                ),
              }
            })}
          />
        </div>
      )}

      <Modal
        open={modalOpen}
        title="Ghi nhận chăm sóc khách hàng"
        okText="Lưu ghi nhận"
        cancelText="Hủy"
        confirmLoading={createCare.isPending}
        onOk={handleCreate}
        onCancel={() => {
          setModalOpen(false)
          form.resetFields()
        }}
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
            name="type"
            label="Hình thức tương tác"
            rules={[{ required: true, message: 'Vui lòng chọn hình thức chăm sóc' }]}
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
            label="Nội dung trao đổi / Kết quả"
            rules={[
              { required: true, message: 'Vui lòng nhập nội dung chăm sóc' },
              { min: 5, message: 'Nội dung tối thiểu 5 ký tự' },
            ]}
          >
            <Input.TextArea
              rows={4}
              maxLength={2000}
              showCount
              placeholder="VD: Gọi điện tư vấn tiến độ shophouse Regal Legend, khách quan tâm chính sách chiết khấu đợt 2, hẹn gặp lại vào thứ 6..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

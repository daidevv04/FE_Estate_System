import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  InputNumber,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  CheckCircleOutlined,
  DollarCircleOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useProjectCommissionPolicy, useUpdateProjectCommissionPolicy } from '../api'

interface Props {
  projectId: string
  canManage?: boolean
}

interface UnitTypePolicy {
  key: string
  code: string
  name: string
  description: string
  rate: number
  bonus: number
  tagColor: string
}

const DEFAULT_MILESTONES_JSON = JSON.stringify([
  {
    milestoneNo: 1,
    name: 'Đợt 1: Đủ 15% HĐMB',
    customerPaidThresholdPct: 15.0,
    payoutPercentage: 50.0,
  },
  {
    milestoneNo: 2,
    name: 'Đợt 2: Đủ 70% nhận bàn giao căn hộ',
    customerPaidThresholdPct: 70.0,
    payoutPercentage: 50.0,
  },
])

export function ProjectCommissionPolicyCard({ projectId, canManage = true }: Props) {
  const [form] = Form.useForm()
  const policyQuery = useProjectCommissionPolicy(projectId)
  const updateMutation = useUpdateProjectCommissionPolicy()

  // Bảng phân loại căn hộ / sản phẩm trong dự án
  const [unitTypes, setUnitTypes] = useState<UnitTypePolicy[]>([
    {
      key: 'APARTMENT',
      code: 'APARTMENT',
      name: 'Căn hộ chung cư',
      description: 'Căn hộ tiêu chuẩn 1PN - 3PN, Studio, Penthouse',
      rate: 2.5,
      bonus: 15000000,
      tagColor: 'blue',
    },
    {
      key: 'TOWNHOUSE',
      code: 'TOWNHOUSE',
      name: 'Nhà phố / Shophouse',
      description: 'Nhà phố liền kề, Shophouse khối đế & trục đường lớn',
      rate: 3.0,
      bonus: 30000000,
      tagColor: 'green',
    },
    {
      key: 'LAND',
      code: 'LAND',
      name: 'Đất nền / Biệt thự',
      description: 'Lô đất nền, biệt thự song lập & đơn lập view hồ/biển',
      rate: 2.0,
      bonus: 20000000,
      tagColor: 'purple',
    },
  ])

  useEffect(() => {
    if (policyQuery.data) {
      const baseRate = policyQuery.data.commissionRate ?? 2.5
      const baseBonus = policyQuery.data.defaultBonusAmount ?? 0

      form.setFieldsValue({
        commissionRate: baseRate,
        defaultBonusAmount: baseBonus,
      })

      // Đồng bộ tỷ lệ vào bảng phân loại căn hộ
      setUnitTypes((prev) =>
        prev.map((item) => ({
          ...item,
          rate: baseRate,
          bonus: baseBonus > 0 ? baseBonus : item.bonus,
        })),
      )
    }
  }, [policyQuery.data, form])

  if (policyQuery.isLoading) {
    return <Card loading size="small" />
  }

  const handleFinish = (vals: any) => {
    // Tự động bảo toàn quy tắc 2 đợt chuẩn, không bắt người dùng nhập JSON
    const cleanMilestones = policyQuery.data?.milestoneRules || DEFAULT_MILESTONES_JSON

    updateMutation.mutate(
      {
        projectId,
        input: {
          commissionRate: vals.commissionRate,
          defaultBonusAmount: vals.defaultBonusAmount ?? 0,
          milestoneRules: cleanMilestones,
        },
      },
      {
        onSuccess: () => message.success('Đã lưu cấu hình hoa hồng dự án thành công!'),
        onError: () => message.error('Không thể cập nhật chính sách hoa hồng'),
      },
    )
  }

  const updateTypeRow = (key: string, field: 'rate' | 'bonus', value: number | null) => {
    setUnitTypes((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value ?? 0 } : row)),
    )
  }

  const columns = [
    {
      title: 'Loại căn hộ / Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (_: any, record: UnitTypePolicy) => (
        <div>
          <Space>
            <Tag color={record.tagColor} style={{ fontWeight: 600 }}>
              {record.name}
            </Tag>
          </Space>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
            {record.description}
          </div>
        </div>
      ),
    },
    {
      title: 'Hoa hồng (%)',
      dataIndex: 'rate',
      key: 'rate',
      width: 170,
      render: (val: number, record: UnitTypePolicy) => (
        <InputNumber
          min={0.1}
          max={50}
          step={0.1}
          value={val}
          disabled={!canManage}
          addonAfter="%"
          onChange={(v) => {
            updateTypeRow(record.key, 'rate', v)
            if (record.key === 'APARTMENT') {
              form.setFieldValue('commissionRate', v)
            }
          }}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Thưởng nóng / căn (VNĐ)',
      dataIndex: 'bonus',
      key: 'bonus',
      width: 210,
      render: (val: number, record: UnitTypePolicy) => (
        <InputNumber
          min={0}
          step={1000000}
          value={val}
          disabled={!canManage}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(v) => v?.replace(/,/g, '') as any}
          addonAfter="đ"
          onChange={(v) => {
            updateTypeRow(record.key, 'bonus', v)
            if (record.key === 'APARTMENT') {
              form.setFieldValue('defaultBonusAmount', v)
            }
          }}
          style={{ width: '100%' }}
        />
      ),
    },
  ]

  return (
    <Card
      size="small"
      title={
        <Space>
          <SettingOutlined style={{ color: '#059669' }} />
          <span>Cấu hình hoa hồng & Thưởng nóng theo từng loại căn hộ</span>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Thiết lập tỷ lệ hoa hồng và tiền thưởng trực tiếp cho từng loại căn hộ thuộc dự án.
        Hệ thống tự động đồng bộ vào hợp đồng deal của Sales khi chốt giao dịch.
      </Typography.Paragraph>

      {!policyQuery.data && !policyQuery.isLoading ? (
        <Empty description="Chưa có dữ liệu chính sách cho dự án này" />
      ) : (
        <Form
          form={form}
          layout="vertical"
          disabled={!canManage}
          onFinish={handleFinish}
          style={{ maxWidth: 740 }}
        >
          {/* Cấu hình chung của dự án */}
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="commissionRate"
                label={
                  <Space>
                    <SafetyCertificateOutlined style={{ color: '#059669' }} />
                    <span style={{ fontWeight: 600 }}>Tỷ lệ hoa hồng chuẩn dự án (%)</span>
                  </Space>
                }
                rules={[{ required: true, message: 'Vui lòng nhập tỷ lệ hoa hồng' }]}
              >
                <InputNumber
                  min={0.1}
                  max={50}
                  step={0.1}
                  addonAfter="%"
                  style={{ width: '100%' }}
                  onChange={(v) => {
                    if (v) {
                      setUnitTypes((prev) =>
                        prev.map((row) => ({ ...row, rate: v })),
                      )
                    }
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="defaultBonusAmount"
                label={
                  <Space>
                    <DollarCircleOutlined style={{ color: '#D97706' }} />
                    <span style={{ fontWeight: 600 }}>Thưởng nóng mặc định cho mỗi căn (VNĐ)</span>
                  </Space>
                }
              >
                <InputNumber
                  min={0}
                  step={1000000}
                  formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(val) => val?.replace(/,/g, '') as any}
                  addonAfter="VNĐ"
                  style={{ width: '100%' }}
                  onChange={(v) => {
                    if (v !== null) {
                      setUnitTypes((prev) =>
                        prev.map((row) => ({ ...row, bonus: v })),
                      )
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Bảng cấu hình theo từng loại căn hộ */}
          <div style={{ marginTop: 8, marginBottom: 20 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
                fontWeight: 600,
                color: '#1E293B',
              }}
            >
              <HomeOutlined style={{ color: '#006A61' }} />
              <span>Định mức chi tiết theo từng loại căn hộ của dự án:</span>
            </div>

            <Table
              size="small"
              bordered
              pagination={false}
              columns={columns}
              dataSource={unitTypes}
            />
          </div>

          {/* Tiến độ giải ngân tự động: Hiển thị trực quan, KHÔNG PHẢI JSON */}
          <Alert
            type="info"
            showIcon
            icon={<CheckCircleOutlined style={{ color: '#059669' }} />}
            message="Tiến độ giải ngân tự động theo chuẩn quy chế bán hàng"
            description={
              <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6 }}>
                <div>
                  <strong>Đợt 1 (50% hoa hồng):</strong> Giải ngân khi khách hàng hoàn tất nộp đủ{' '}
                  <span style={{ color: '#059669', fontWeight: 600 }}>15%</span> giá trị HĐMB.
                </div>
                <div>
                  <strong>Đợt 2 (50% hoa hồng còn lại):</strong> Giải ngân khi khách hàng đóng đủ{' '}
                  <span style={{ color: '#059669', fontWeight: 600 }}>70%</span> và nhận bàn giao căn hộ.
                </div>
              </div>
            }
            style={{ marginBottom: 20, background: '#F0FDF4', borderColor: '#BBF7D0' }}
          />

          {canManage && (
            <Button
              type="primary"
              htmlType="submit"
              loading={updateMutation.isPending}
              style={{ minWidth: 180, height: 40, fontWeight: 600 }}
            >
              Lưu chính sách hoa hồng
            </Button>
          )}
        </Form>
      )}
    </Card>
  )
}

import { useEffect } from 'react'
import { Button, Card, Empty, Form, Input, InputNumber, message, Space, Typography } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { useProjectCommissionPolicy, useUpdateProjectCommissionPolicy } from '../api'

interface Props {
  projectId: string
  canManage?: boolean
}

export function ProjectCommissionPolicyCard({ projectId, canManage = true }: Props) {
  const [form] = Form.useForm()
  const policyQuery = useProjectCommissionPolicy(projectId)
  const updateMutation = useUpdateProjectCommissionPolicy()

  useEffect(() => {
    if (policyQuery.data) {
      form.setFieldsValue({
        commissionRate: policyQuery.data.commissionRate,
        defaultBonusAmount: policyQuery.data.defaultBonusAmount,
        milestoneRules: policyQuery.data.milestoneRules,
      })
    }
  }, [policyQuery.data, form])

  if (policyQuery.isLoading) {
    return <Card loading size="small" />
  }

  const handleFinish = (vals: any) => {
    updateMutation.mutate(
      { projectId, input: vals },
      {
        onSuccess: () => message.success('Đã cập nhật chính sách hoa hồng dự án!'),
        onError: () => message.error('Không thể cập nhật chính sách hoa hồng'),
      },
    )
  }

  return (
    <Card
      size="small"
      title={
        <Space>
          <SettingOutlined style={{ color: '#059669' }} />
          <span>Chính sách hoa hồng & Đợt giải ngân dự án</span>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Tất cả căn hộ thuộc dự án này khi ký hợp đồng sẽ tự động kế thừa tỷ lệ hoa hồng chuẩn và lịch giải ngân đối soát theo tỷ lệ nộp tiền của khách hàng.
      </Typography.Paragraph>

      {!policyQuery.data && !policyQuery.isLoading ? (
        <Empty description="Chưa có dữ liệu chính sách cho dự án này" />
      ) : (
        <Form
          form={form}
          layout="vertical"
          disabled={!canManage}
          onFinish={handleFinish}
          style={{ maxWidth: 640 }}
        >
          <Form.Item
            name="commissionRate"
            label="Tỷ lệ hoa hồng chuẩn (%)"
            rules={[{ required: true, message: 'Vui lòng nhập tỷ lệ hoa hồng' }]}
          >
            <InputNumber
              min={0.1}
              max={50}
              step={0.1}
              addonAfter="%"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="defaultBonusAmount"
            label="Thưởng nóng mặc định cho mỗi căn (VNĐ)"
          >
            <InputNumber
              min={0}
              step={1000000}
              formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(val) => val?.replace(/,/g, '') as any}
              addonAfter="VNĐ"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="milestoneRules"
            label="Quy tắc các đợt giải ngân theo % tiền khách nộp (JSON)"
            tooltip="Định dạng mảng JSON chứa milestoneNo, name, customerPaidThresholdPct, payoutPercentage"
            rules={[{ required: true, message: 'Vui lòng nhập quy tắc các đợt giải ngân' }]}
          >
            <Input.TextArea
              rows={6}
              style={{ fontFamily: 'Consolas, monospace', fontSize: 13 }}
            />
          </Form.Item>

          {canManage && (
            <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
              Lưu chính sách hoa hồng
            </Button>
          )}
        </Form>
      )}
    </Card>
  )
}

import { CalculatorOutlined, CheckCircleOutlined, GiftOutlined, TagOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Checkbox, Col, Divider, Form, InputNumber, Modal, Radio, Row, Space, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { formatMoney } from '@/lib/format'
import { useCalculateDiscount, useSalesPolicies } from '../api'

interface Props {
  open: boolean
  initialPrice?: number
  onClose: () => void
  onApply: (data: {
    netValue: number
    summaryNote: string
    discountRate: number
    discountAmount: number
  }) => void
}

const moneyFormatter = {
  formatter: (v?: number | string) => (v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''),
  parser: (v?: string) => (v ? Number(v.replace(/\./g, '')) : 0),
}

export function DiscountCalculatorModal({ open, initialPrice = 0, onClose, onApply }: Props) {
  const [form] = Form.useForm()
  const policiesQuery = useSalesPolicies()
  const calculateMutation = useCalculateDiscount()

  const [listedPrice, setListedPrice] = useState<number>(initialPrice)
  const [policyId, setPolicyId] = useState<string>('FAST_95')
  const [bulkQty, setBulkQty] = useState<number>(1)
  const [isLoyal, setIsLoyal] = useState<boolean>(false)
  const [voucher, setVoucher] = useState<number>(0)

  useEffect(() => {
    if (open) {
      setListedPrice(initialPrice > 0 ? initialPrice : 3_500_000_000)
      form.setFieldsValue({
        listedPrice: initialPrice > 0 ? initialPrice : 3_500_000_000,
        policyId: 'FAST_95',
        bulkQty: 1,
        isLoyal: false,
        voucher: 0,
      })
    }
  }, [open, initialPrice, form])

  // Trigger calculation when inputs change
  useEffect(() => {
    if (open && listedPrice > 0) {
      calculateMutation.mutate({
        listedPrice,
        policyId,
        bulkQuantity: bulkQty,
        isLoyalCustomer: isLoyal,
        customVoucherAmount: voucher,
      })
    }
  }, [open, listedPrice, policyId, bulkQty, isLoyal, voucher])

  const result = calculateMutation.data

  const handleApply = () => {
    if (!result) return
    const breakdowns = result.discountAppliedBreakdowns?.join('; ') ?? ''
    const summaryNote = `[Chính sách bán hàng: ${result.policyName} | Giảm ${result.totalDiscountRate}% (-${formatMoney(result.totalDiscountAmount)}) | Giá gốc: ${formatMoney(result.listedPrice)} -> Giá Net: ${formatMoney(result.netContractValue)}. Chi tiết: ${breakdowns}]`

    onApply({
      netValue: result.netContractValue,
      summaryNote,
      discountRate: result.totalDiscountRate,
      discountAmount: result.totalDiscountAmount,
    })
    onClose()
  }

  const policies = policiesQuery.data ?? [
    { id: 'STANDARD', name: 'Tiến độ chuẩn', description: 'Không chiết khấu', discountRate: 0, paymentScheduleNote: '7 đợt' },
    { id: 'FAST_70', name: 'Thanh toán sớm 70%', description: 'Chiết khấu 3.5%', discountRate: 3.5, paymentScheduleNote: 'Nộp 70% đợt 1' },
    { id: 'FAST_95', name: 'Thanh toán sớm 95%', description: 'Chiết khấu 6.0%', discountRate: 6.0, paymentScheduleNote: 'Nộp 95% đợt 1' },
    { id: 'BANK_LOAN_SUPPORT', name: 'Gói vay HTLS 0%', description: 'Hỗ trợ lãi suất 12 tháng', discountRate: 0, paymentScheduleNote: 'Vay 70%' },
  ]

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Space>
          <CalculatorOutlined style={{ color: '#059669', fontSize: 18 }} />
          <span>Bảng Tính Chiết Khấu Chính Sách Bán Hàng & Giá Net</span>
        </Space>
      }
      width={760}
      centered
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onClose}>
          Đóng
        </Button>,
        <Button
          key="apply"
          type="primary"
          icon={<CheckCircleOutlined />}
          style={{ background: '#059669', borderColor: '#059669' }}
          disabled={!result}
          onClick={handleApply}
        >
          Áp dụng Giá Net vào Hợp Đồng
        </Button>,
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
        <Alert
          type="info"
          showIcon
          icon={<ThunderboltOutlined />}
          message="Hệ thống tự động tính chiết khấu theo chính sách mở bán của Chủ Đầu Tư, loại bỏ hoàn toàn việc tính tay sai sót."
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <Form form={form} layout="vertical">
              <Form.Item label="Giá niêm yết lô đất / căn hộ (đ)">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={50_000_000}
                  value={listedPrice}
                  onChange={(v) => setListedPrice(v ?? 0)}
                  {...moneyFormatter}
                />
              </Form.Item>

              <Form.Item label="Gói tiến độ thanh toán & Chiết khấu cơ bản">
                <Radio.Group
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {policies.map((p) => (
                    <Radio.Button
                      key={p.id}
                      value={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        height: 'auto',
                        padding: '8px 12px',
                        borderRadius: 6,
                      }}
                    >
                      <div>
                        <strong>{p.name}</strong>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{p.description}</div>
                      </div>
                      <Tag color={p.discountRate > 0 ? 'green' : 'default'} style={{ marginLeft: 'auto' }}>
                        {p.discountRate > 0 ? `CK -${p.discountRate}%` : 'Chuẩn'}
                      </Tag>
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </Form.Item>

              <Divider style={{ margin: '12px 0' }} />

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="Mua sỉ cùng đợt (lô/căn)">
                    <InputNumber
                      min={1}
                      max={20}
                      style={{ width: '100%' }}
                      value={bulkQty}
                      onChange={(v) => setBulkQty(v ?? 1)}
                    />
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      2 lô: +1.0% | ≥ 3 lô: +2.0%
                    </div>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Quà tặng / Voucher trừ thẳng (đ)">
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={10_000_000}
                      value={voucher}
                      onChange={(v) => setVoucher(v ?? 0)}
                      {...moneyFormatter}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ marginBottom: 0 }}>
                <Checkbox checked={isLoyal} onChange={(e) => setIsLoyal(e.target.checked)}>
                  <Space>
                    <GiftOutlined style={{ color: '#d97706' }} />
                    <span>Khách hàng thân thiết / Booking đợt 1 (Ưu đãi thêm +1.0%)</span>
                  </Space>
                </Checkbox>
              </Form.Item>
            </Form>
          </Col>

          <Col xs={24} md={10}>
            <Card
              className="stitch-card"
              style={{ background: '#f8fafc', borderColor: '#e2e8f0', height: '100%' }}
              styles={{ body: { padding: 16 } }}
            >
              <Typography.Text strong style={{ fontSize: 14, color: '#0f172a', display: 'block', marginBottom: 12 }}>
                <TagOutlined style={{ color: '#059669', marginRight: 6 }} />
                BẢNG TÍNH GIÁ NET
              </Typography.Text>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#64748b' }}>Giá niêm yết:</span>
                  <strong className="stitch-num">{formatMoney(result?.listedPrice ?? listedPrice)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#64748b' }}>Tổng tỷ lệ chiết khấu:</span>
                  <Tag color="cyan" style={{ fontWeight: 700 }}>
                    -{result?.totalDiscountRate ?? 0}%
                  </Tag>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#dc2626' }}>Tổng tiền giảm:</span>
                  <span className="stitch-num" style={{ fontWeight: 700, color: '#dc2626' }}>
                    -{formatMoney(result?.totalDiscountAmount ?? 0)}
                  </span>
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <div style={{ background: '#ecfdf5', padding: '10px 12px', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: 12, color: '#065f46', fontWeight: 600 }}>GIÁ BÁN NET HỢP ĐỒNG</div>
                  <div className="stitch-num" style={{ fontSize: 20, fontWeight: 800, color: '#047857', marginTop: 2 }}>
                    {formatMoney(result?.netContractValue ?? listedPrice)}
                  </div>
                </div>

                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    Diễn giải áp dụng:
                  </div>
                  <ul style={{ paddingLeft: 18, margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                    {(result?.discountAppliedBreakdowns ?? ['Chưa tính toán']).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </Modal>
  )
}

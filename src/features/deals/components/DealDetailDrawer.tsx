import { CheckCircleOutlined, CloseCircleOutlined, EditOutlined, FilePdfOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Descriptions, Drawer, Empty, Popconfirm, Progress, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatDate, formatDateTime, formatMoney } from '@/lib/format'
import { tokens as t } from '@/theme/tokens'
import {
  APPROVAL_STATUS_LABEL, DEAL_STATUS_LABEL, PAYMENT_STATUS_LABEL, paymentMethodLabel, progressPct,
  type Deal, type DealPayment,
} from '../api'

interface Props {
  open: boolean
  deal: Deal | null
  customerName: string
  unitLabel: string
  projectName: string
  salesName: string
  payments: DealPayment[]
  collected: number
  canApprove: boolean
  submitting: boolean
  loadingPayments: boolean
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  onRecordPayment: () => void
  onEdit: () => void
}

const statusTone = (deal: Deal) => {
  if (deal.status === 'COMPLETED') return t.colorSuccess
  if (deal.status === 'CANCELLED') return t.colorTextMuted
  if (deal.status === 'ACTIVE') return t.colorViolet
  return t.colorInfo
}

const approvalTone = (deal: Deal) => {
  if (deal.approvalStatus === 'APPROVED') return t.colorSuccess
  if (deal.approvalStatus === 'REJECTED') return t.colorError
  if (deal.approvalStatus === 'PENDING') return t.colorWarning
  return t.colorTextMuted
}

const paymentTone = (deal: Deal) => {
  if (deal.paymentStatus === 'PAID') return t.colorSuccess
  if (deal.paymentStatus === 'PARTIAL') return t.colorWarning
  return t.colorError
}

/** Drawer chi tiết (khuôn 9.21 rút gọn): thông tin chung → tài chính → thanh toán → duyệt → file */
export function DealDetailDrawer({
  open, deal, customerName, unitLabel, projectName, salesName, payments, collected,
  canApprove, submitting, loadingPayments, onClose, onApprove, onReject, onRecordPayment, onEdit,
}: Props) {
  const remaining = Math.max(0, (deal?.contractValue ?? 0) - collected)
  const pct = progressPct(collected, deal?.contractValue ?? null)

  const columns: ColumnsType<DealPayment> = [
    { title: 'Ngày thanh toán', dataIndex: 'paidAt', width: 150, render: (v: string) => formatDateTime(v) },
    {
      title: 'Số tiền', dataIndex: 'amount', align: 'right', width: 150,
      render: (v: number) => <span className="stitch-num" style={{ fontWeight: 600 }}>{formatMoney(v)}</span>,
    },
    { title: 'Phương thức', dataIndex: 'method', width: 130, render: (v: string | null) => paymentMethodLabel(v) },
    {
      title: 'Biên lai', dataIndex: 'receiptUrl', width: 90,
      render: (v: string | null) => (v
        ? <a href={v} target="_blank" rel="noreferrer">Mở</a>
        : <Typography.Text type="secondary">—</Typography.Text>),
    },
    { title: 'Ghi chú', dataIndex: 'note', render: (v: string | null) => v || '—' },
  ]

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={760}
      title={deal ? (
        <Space size={8} wrap>
          <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{deal.contractCode}</span>
          <Tag color={statusTone(deal)}>{DEAL_STATUS_LABEL[deal.status]}</Tag>
          <Tag color={paymentTone(deal)}>{PAYMENT_STATUS_LABEL[deal.paymentStatus]}</Tag>
        </Space>
      ) : 'Chi tiết hợp đồng'}
      extra={deal ? (
        <Space wrap>
          <Button icon={<EditOutlined />} onClick={onEdit}>Sửa</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={onRecordPayment}>Ghi nhận thanh toán</Button>
        </Space>
      ) : null}
    >
      {!deal ? <Empty description="Không có dữ liệu hợp đồng" /> : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card size="small" title="Thông tin chung">
            <Descriptions column={2} size="small" colon={false}>
              <Descriptions.Item label="Khách hàng">{customerName}</Descriptions.Item>
              <Descriptions.Item label="Nhân viên phụ trách">{salesName}</Descriptions.Item>
              <Descriptions.Item label="Căn / sản phẩm">{unitLabel}</Descriptions.Item>
              <Descriptions.Item label="Dự án">{projectName}</Descriptions.Item>
              <Descriptions.Item label="Ngày ký">{formatDate(deal.signedDate)}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{formatDateTime(deal.createdAt)}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card size="small" title="Thông tin tài chính">
            <Descriptions column={2} size="small" colon={false}>
              <Descriptions.Item label="Giá trị hợp đồng">
                <span className="stitch-num" style={{ fontWeight: 600 }}>{formatMoney(deal.contractValue)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Tiền đặt cọc">
                <span className="stitch-num">{formatMoney(deal.depositAmount)}</span>
                {deal.depositDate ? ` · ${formatDate(deal.depositDate)}` : ''}
              </Descriptions.Item>
              <Descriptions.Item label="Đã thu">
                <span className="stitch-num" style={{ fontWeight: 600, color: t.colorSuccessText }}>{formatMoney(collected)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Còn phải thu">
                <span className="stitch-num" style={{ fontWeight: 600, color: remaining > 0 ? t.colorErrorText : t.colorSuccessText }}>
                  {formatMoney(remaining)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái thanh toán">{PAYMENT_STATUS_LABEL[deal.paymentStatus]}</Descriptions.Item>
              <Descriptions.Item label="Phương thức thanh toán">{paymentMethodLabel(deal.paymentMethod)}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 8 }}>
              <Progress percent={pct} strokeColor={t.colorSuccess} size="small" />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Đã thu {pct}% giá trị hợp đồng (chỉ tính các đợt thanh toán, không gồm tiền đặt cọc)
              </Typography.Text>
            </div>
          </Card>

          <Card
            size="small"
            title={`Các đợt thanh toán (${payments.length})`}
            extra={<Button size="small" type="primary" icon={<PlusOutlined />} onClick={onRecordPayment}>Ghi nhận</Button>}
          >
            <Table<DealPayment>
              rowKey="id"
              size="small"
              loading={loadingPayments}
              columns={columns}
              dataSource={payments}
              pagination={false}
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: 'Chưa ghi nhận đợt thanh toán nào' }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Danh sách append-only: backend không cho sửa/xoá đợt đã ghi.
            </Typography.Text>
          </Card>

          <Card size="small" title="Phê duyệt">
            <Descriptions column={2} size="small" colon={false}>
              <Descriptions.Item label="Trạng thái duyệt">
                <Tag color={approvalTone(deal)}>{APPROVAL_STATUS_LABEL[deal.approvalStatus]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thời điểm duyệt">{formatDateTime(deal.approvedAt)}</Descriptions.Item>
            </Descriptions>
            {canApprove ? (
              <Space wrap>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={submitting}
                  disabled={deal.approvalStatus === 'APPROVED'}
                  onClick={onApprove}
                >
                  Phê duyệt
                </Button>
                <Popconfirm
                  title="Từ chối hợp đồng này?"
                  description="Backend không có field lý do từ chối — ghi lý do vào ô Ghi chú khi bấm Sửa nếu cần."
                  okText="Từ chối"
                  cancelText="Huỷ"
                  okButtonProps={{ danger: true }}
                  onConfirm={onReject}
                >
                  <Button danger icon={<CloseCircleOutlined />} disabled={deal.approvalStatus !== 'PENDING'}>
                    Từ chối
                  </Button>
                </Popconfirm>
              </Space>
            ) : (
              <Typography.Text type="secondary">Chỉ ADMIN/MANAGER được phê duyệt hợp đồng.</Typography.Text>
            )}
          </Card>

          <Card size="small" title="Tệp & ghi chú">
            {deal.fileUrl
              ? <Button icon={<FilePdfOutlined />} href={deal.fileUrl} target="_blank">Mở file hợp đồng</Button>
              : <Typography.Text type="secondary">Chưa có file hợp đồng</Typography.Text>}
            <div style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
              {deal.note || <Typography.Text type="secondary">Không có ghi chú</Typography.Text>}
            </div>
          </Card>
        </Space>
      )}
    </Drawer>
  )
}


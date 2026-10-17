import { CheckCircleOutlined, CloseCircleOutlined, EditOutlined, FilePdfOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Descriptions, Empty, Modal, Popconfirm, Progress, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatDate, formatDateTime, formatMoney } from '@/lib/format'
import { StatusPill, type StatusTone } from '@/components/common/StatusPill'
import { tokens as t } from '@/theme/tokens'
import {
  APPROVAL_STATUS_LABEL, DEAL_STATUS_LABEL, PAYMENT_STATUS_LABEL, paymentMethodLabel, progressPct,
  type Deal, type DealPayment,
} from '../api'
import { DealPaymentScheduleSection } from './DealPaymentScheduleSection'
import './DealDetailDrawer.css'

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

const statusTone = (deal: Deal): StatusTone => {
  if (deal.status === 'COMPLETED') return 'green'
  if (deal.status === 'CANCELLED') return 'gray'
  if (deal.status === 'ACTIVE') return 'purple'
  return 'blue'
}

const approvalTone = (deal: Deal): StatusTone => {
  if (deal.approvalStatus === 'APPROVED') return 'green'
  if (deal.approvalStatus === 'REJECTED') return 'red'
  if (deal.approvalStatus === 'PENDING') return 'amber'
  return 'gray'
}

const paymentTone = (deal: Deal): StatusTone => {
  if (deal.paymentStatus === 'PAID') return 'green'
  if (deal.paymentStatus === 'PARTIAL') return 'amber'
  return 'red'
}

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
    <Modal
      open={open}
      onCancel={onClose}
      width={920}
      className="deal-detail-modal"
      centered
      destroyOnHidden
      title="Thông tin hợp đồng"
      footer={deal && <div className="deal-detail-modal__footer"><Typography.Text>Thông tin được tải mới từ hệ thống CRM.</Typography.Text><Space><Button onClick={onClose}>Đóng</Button><Button icon={<PlusOutlined />} onClick={onRecordPayment}>Ghi nhận thanh toán</Button><Button type="primary" icon={<EditOutlined />} onClick={onEdit}>Chỉnh sửa</Button></Space></div>}
    >
      {!deal ? <Empty description="Không có dữ liệu hợp đồng" /> : (
        <div className="deal-detail-modal__content">
          <div className="deal-detail-modal__hero"><div><Typography.Text type="secondary">MÃ HỢP ĐỒNG</Typography.Text><Typography.Title level={3}>{deal.contractCode}</Typography.Title><Space wrap size={[6, 6]}><StatusPill tone={statusTone(deal)} size="sm">{DEAL_STATUS_LABEL[deal.status]}</StatusPill><StatusPill tone={paymentTone(deal)} size="sm">{PAYMENT_STATUS_LABEL[deal.paymentStatus]}</StatusPill><StatusPill tone={approvalTone(deal)} size="sm">{APPROVAL_STATUS_LABEL[deal.approvalStatus]}</StatusPill></Space></div><div className="deal-detail-modal__audit"><span>Ngày tạo</span><strong>{formatDateTime(deal.createdAt)}</strong><span>Cập nhật</span><strong>{formatDateTime(deal.updatedAt)}</strong></div></div>
          <div className="deal-detail-modal__grid">
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
          </div>

          <DealPaymentScheduleSection deal={deal} onRecordPayment={onRecordPayment} />

          <Card className="deal-detail-modal__payments"
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
              Lịch sử thanh toán được ghi nhận theo từng đợt, không thể thay đổi sau khi xác nhận.
            </Typography.Text>
          </Card>

          <Card className="deal-detail-modal__approval" size="small" title="Phê duyệt">
            <Descriptions column={2} size="small" colon={false}>
              <Descriptions.Item label="Trạng thái duyệt">
                <StatusPill tone={approvalTone(deal)} size="sm">{APPROVAL_STATUS_LABEL[deal.approvalStatus]}</StatusPill>
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
                  Xác nhận phê duyệt
                </Button>
                <Popconfirm
                  title="Xác nhận từ chối hợp đồng này?"
                  description="Hợp đồng sẽ chuyển sang trạng thái Từ chối. Bạn có thể ghi chú thêm thông tin vào hợp đồng nếu cần."
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

          <Card className="deal-detail-modal__file" size="small" title="Tệp & ghi chú">
            {deal.fileUrl
              ? <Button icon={<FilePdfOutlined />} href={deal.fileUrl} target="_blank">Mở file hợp đồng</Button>
              : <Typography.Text type="secondary">Chưa có file hợp đồng</Typography.Text>}
            <div style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
              {deal.note || <Typography.Text type="secondary">Không có ghi chú</Typography.Text>}
            </div>
          </Card>
        </div>
      )}
    </Modal>
  )
}


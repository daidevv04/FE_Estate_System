import { CheckCircleOutlined, CloseCircleOutlined, EditOutlined, FilePdfOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Descriptions, Empty, Modal, Popconfirm, Progress, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatDate, formatDateTime, formatMoney } from '@/lib/format'
import { tokens as t } from '@/theme/tokens'
import {
  APPROVAL_STATUS_LABEL, DEAL_STATUS_LABEL, PAYMENT_STATUS_LABEL, paymentMethodLabel, progressPct,
  type Deal, type DealPayment,
} from '../api'
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

/** Popup nổi chi tiết hợp đồng: dữ liệu thật, payment append-only, action sửa cố định ở footer. */
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
      destroyOnHidden
      title="Thông tin hợp đồng"
      footer={deal && <div className="deal-detail-modal__footer"><Typography.Text>Thông tin được tải mới từ hệ thống CRM.</Typography.Text><Space><Button onClick={onClose}>Đóng</Button><Button icon={<PlusOutlined />} onClick={onRecordPayment}>Ghi nhận thanh toán</Button><Button type="primary" icon={<EditOutlined />} onClick={onEdit}>Chỉnh sửa</Button></Space></div>}
    >
      {!deal ? <Empty description="Không có dữ liệu hợp đồng" /> : (
        <div className="deal-detail-modal__content">
          <div className="deal-detail-modal__hero"><div><Typography.Text type="secondary">MÃ HỢP ĐỒNG</Typography.Text><Typography.Title level={3}>{deal.contractCode}</Typography.Title><Space wrap size={[6, 6]}><Tag color={statusTone(deal)}>{DEAL_STATUS_LABEL[deal.status]}</Tag><Tag color={paymentTone(deal)}>{PAYMENT_STATUS_LABEL[deal.paymentStatus]}</Tag><Tag color={approvalTone(deal)}>{APPROVAL_STATUS_LABEL[deal.approvalStatus]}</Tag></Space></div><div className="deal-detail-modal__audit"><span>Ngày tạo</span><strong>{formatDateTime(deal.createdAt)}</strong><span>Cập nhật</span><strong>{formatDateTime(deal.updatedAt)}</strong></div></div>
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
              Danh sách append-only: backend không cho sửa/xoá đợt đã ghi.
            </Typography.Text>
          </Card>

          <Card className="deal-detail-modal__approval" size="small" title="Phê duyệt">
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


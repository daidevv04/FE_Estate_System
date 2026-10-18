import { useEffect, useMemo, useState } from 'react'
import {
  FileTextOutlined,
  PrinterOutlined,
  ScheduleOutlined,
  TransactionOutlined,
} from '@ant-design/icons'
import { Button, Modal, Segmented, Select, Skeleton, Space, Typography } from 'antd'
import { useDealPrintData } from '../api'
import { DepositAgreementTemplate } from './templates/DepositAgreementTemplate'
import { PaymentReceiptTemplate } from './templates/PaymentReceiptTemplate'
import { PaymentScheduleTemplate } from './templates/PaymentScheduleTemplate'
import './PrintPreviewModal.css'

export type DocumentType = 'DEPOSIT' | 'RECEIPT' | 'SCHEDULE'

interface Props {
  open: boolean
  dealId: string | null
  defaultDocType?: DocumentType
  selectedPaymentId?: string | null
  customer?: {
    fullName?: string | null
    phone?: string | null
    idCard?: string | null
    idCardDate?: string | null
    idCardPlace?: string | null
    address?: string | null
  } | null
  salesPersonName?: string
  onClose: () => void
}

export function PrintPreviewModal({
  open,
  dealId,
  defaultDocType = 'DEPOSIT',
  selectedPaymentId: initialPaymentId,
  customer,
  salesPersonName,
  onClose,
}: Props) {
  const [docType, setDocType] = useState<DocumentType>(defaultDocType)
  const [activePaymentId, setActivePaymentId] = useState<string | null>(initialPaymentId || null)

  const { data: dealPrintData, isLoading } = useDealPrintData(dealId)

  useEffect(() => {
    if (defaultDocType) {
      setDocType(defaultDocType)
    }
  }, [defaultDocType])

  useEffect(() => {
    if (initialPaymentId) {
      setActivePaymentId(initialPaymentId)
    }
  }, [initialPaymentId])

  const payments = dealPrintData?.payments || []

  // Default to first payment if none selected
  const activePayment = useMemo(() => {
    if (activePaymentId) {
      return payments.find((p) => p.id === activePaymentId) || payments[0] || null
    }
    return payments[0] || null
  }, [payments, activePaymentId])

  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1000}
      centered
      destroyOnHidden
      className="print-preview-modal"
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <PrinterOutlined style={{ color: '#059669', fontSize: 18 }} />
            <Typography.Text strong style={{ fontSize: 16 }}>
              In Hồ Sơ & Biểu Mẫu Bất Động Sản (Chuẩn A4)
            </Typography.Text>
          </Space>
        </div>
      }
      footer={null}
    >
      {/* Toolbar */}
      <div className="print-preview-toolbar no-print">
        <Space size={16}>
          <Segmented<DocumentType>
            value={docType}
            onChange={(val) => setDocType(val)}
            options={[
              {
                value: 'DEPOSIT',
                label: (
                  <Space size={6}>
                    <FileTextOutlined />
                    <span>Phiếu Đặt Cọc</span>
                  </Space>
                ),
              },
              {
                value: 'RECEIPT',
                label: (
                  <Space size={6}>
                    <TransactionOutlined />
                    <span>Phiếu Thu Tiền</span>
                  </Space>
                ),
              },
              {
                value: 'SCHEDULE',
                label: (
                  <Space size={6}>
                    <ScheduleOutlined />
                    <span>Tiến Độ Thanh Toán</span>
                  </Space>
                ),
              },
            ]}
          />

          {docType === 'RECEIPT' && payments.length > 0 && (
            <Select
              style={{ width: 240 }}
              value={activePayment?.id}
              onChange={(val) => setActivePaymentId(val)}
              options={payments.map((p, idx) => ({
                value: p.id,
                label: `Đợt ${idx + 1}: ${new Intl.NumberFormat('vi-VN').format(p.amount)} đ`,
              }))}
            />
          )}
        </Space>

        <Space>
          <Button onClick={onClose}>Đóng</Button>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint} style={{ background: '#059669' }}>
            In tài liệu (A4)
          </Button>
        </Space>
      </div>

      {/* Content Preview */}
      <div className="print-preview-content">
        {isLoading || !dealPrintData ? (
          <div style={{ padding: 40, background: '#fff', width: '210mm', margin: '0 auto', minHeight: '297mm' }}>
            <Skeleton active paragraph={{ rows: 12 }} />
          </div>
        ) : (
          <>
            {docType === 'DEPOSIT' && (
              <DepositAgreementTemplate
                deal={dealPrintData}
                customer={customer}
                salesPersonName={salesPersonName}
              />
            )}
            {docType === 'RECEIPT' && (
              <PaymentReceiptTemplate
                deal={dealPrintData}
                customer={customer}
                payment={activePayment}
              />
            )}
            {docType === 'SCHEDULE' && (
              <PaymentScheduleTemplate
                deal={dealPrintData}
                customer={customer}
              />
            )}
          </>
        )}
      </div>
    </Modal>
  )
}

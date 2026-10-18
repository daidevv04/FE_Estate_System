import { QRCode } from 'antd'
import { formatDate, formatMoney } from '@/lib/format'
import type { DealPrintData, PaymentPrintDto } from '../../api'
import { numberToVietnameseWords } from '../../utils/numberToVietnameseWords'
import '../../styles/documentPrint.css'

interface Props {
  deal: DealPrintData
  customer?: {
    fullName?: string | null
    phone?: string | null
    address?: string | null
  } | null
  payment?: PaymentPrintDto | null
}

export function PaymentReceiptTemplate({ deal, customer, payment }: Props) {
  const company = deal.company
  const product = deal.product
  const project = deal.project
  const today = new Date()

  const amount = payment?.amount || deal.depositAmount || 100000000
  const receiptNo = payment?.id ? `PT-${payment.id.slice(0, 8).toUpperCase()}` : `PT-${deal.contractCode}-01`
  const verificationUrl = `https://regalgroup.vn/verify-receipt?code=${receiptNo}&deal=${deal.contractCode}&amount=${amount}`

  return (
    <div className="print-page-a4">
      {/* Watermark con dấu chìm */}
      <div className="doc-watermark-paid">
        ĐÃ THU TIỀN / PAID
      </div>

      {/* Header */}
      <div className="doc-header">
        <div className="doc-header__left">
          <div className="doc-header__company-name">{company?.companyName || 'TỔNG CÔNG TY ĐẤT XANH MIỀN TRUNG'}</div>
          <div>MST: {company?.taxCode || '0401412898'}</div>
          <div>Trụ sở: {company?.headquarterAddress || '52-54 Võ Văn Kiệt, Sơn Trà, TP. Đà Nẵng'}</div>
          <div>Phòng Kế toán — Tài chính</div>
        </div>
        <div className="doc-header__right">
          <div style={{ fontWeight: 700, fontSize: '11pt' }}>Mẫu số 01 - TT</div>
          <div style={{ fontSize: '10pt', fontStyle: 'italic' }}>(Ban hành theo TT số 200/2014/TT-BTC)</div>
          <div style={{ marginTop: 6, fontWeight: 600 }}>Số phiếu: {receiptNo}</div>
          <div className="doc-header__date">
            Ngày {today.getDate()} tháng {today.getMonth() + 1} năm {today.getFullYear()}
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="doc-title-block">
        <div className="doc-title">PHIẾU THU TIỀN</div>
        <div className="doc-subtitle">
          (Liên 2: Giao cho khách hàng nộp tiền)
        </div>
      </div>

      {/* Thông tin người nộp */}
      <div className="doc-row">
        <span className="doc-label">Họ và tên người nộp:</span>
        <span className="doc-value doc-value--bold">
          {customer?.fullName ? customer.fullName.toUpperCase() : 'TRẦN ĐÌNH TRỌNG'}
        </span>
      </div>
      <div className="doc-row">
        <span className="doc-label">Địa chỉ:</span>
        <span className="doc-value">{customer?.address || 'Hải Châu, TP. Đà Nẵng'}</span>
      </div>
      <div className="doc-row">
        <span className="doc-label">Số điện thoại:</span>
        <span className="doc-value">{customer?.phone || '0905123456'}</span>
      </div>
      <div className="doc-row">
        <span className="doc-label">Lý do nộp tiền:</span>
        <span className="doc-value">
          {payment?.note || `Thu tiền cọc / thanh toán Hợp đồng số ${deal.contractCode} căn hộ ${product?.code || 'RL-A201'} Dự án ${project?.name || 'Regal Legend'}`}
        </span>
      </div>
      <div className="doc-row">
        <span className="doc-label">Số tiền thu:</span>
        <span className="doc-value doc-value--highlight" style={{ fontSize: '14pt' }}>
          {formatMoney(amount)}
        </span>
      </div>
      <div className="doc-row">
        <span className="doc-label">Viết bằng chữ:</span>
        <span className="doc-value" style={{ fontStyle: 'italic', fontWeight: 600 }}>
          {numberToVietnameseWords(amount)}
        </span>
      </div>
      <div className="doc-row">
        <span className="doc-label">Hình thức thanh toán:</span>
        <span className="doc-value">
          {payment?.method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản ngân hàng'} (Ngân hàng TMCP Quân Đội - MBBank, STK: 0401412898999)
        </span>
      </div>
      <div className="doc-row">
        <span className="doc-label">Chứng từ gốc đính kèm:</span>
        <span className="doc-value">
          01 Giấy nộp tiền / Ủy nhiệm chi ngày {payment?.paidAt ? formatDate(payment.paidAt) : formatDate(today.toISOString())}
        </span>
      </div>

      {/* QR Code xác thực biên lai */}
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 24, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <QRCode value={verificationUrl} size={76} bordered={false} />
        <div style={{ marginLeft: 16, fontSize: '10pt', color: '#475569', lineHeight: 1.4 }}>
          <strong style={{ color: '#0f172a' }}>Mã QR điện tử xác thực biên lai:</strong>
          <div>Quét mã QR để tra cứu tính hợp lệ của biên lai trên cổng thông tin tài chính điện tử của Tập đoàn Regal Group.</div>
          <div style={{ fontSize: '9pt', marginTop: 2, fontFamily: 'monospace' }}>Mã hash: {receiptNo}-{Math.abs(amount).toString(16)}</div>
        </div>
      </div>

      {/* Chữ ký 4 bên */}
      <div className="doc-signatures" style={{ marginTop: 32 }}>
        <div className="doc-signature-col" style={{ width: '25%' }}>
          <div className="doc-signature-col__title">GIÁM ĐỐC</div>
          <div className="doc-signature-col__note">(Ký, họ tên, đóng dấu)</div>
          <div className="doc-signature-col__name">{company?.representativeName || 'Trần Ngọc Thái'}</div>
        </div>
        <div className="doc-signature-col" style={{ width: '25%' }}>
          <div className="doc-signature-col__title">KẾ TOÁN TRƯỞNG</div>
          <div className="doc-signature-col__note">(Ký, họ tên)</div>
          <div className="doc-signature-col__name">Lê Thị Mai Lan</div>
        </div>
        <div className="doc-signature-col" style={{ width: '25%' }}>
          <div className="doc-signature-col__title">THỦ QUỸ</div>
          <div className="doc-signature-col__note">(Ký, họ tên)</div>
          <div className="doc-signature-col__name">Nguyễn Thị Thu</div>
        </div>
        <div className="doc-signature-col" style={{ width: '25%' }}>
          <div className="doc-signature-col__title">NGƯỜI NỘP TIỀN</div>
          <div className="doc-signature-col__note">(Ký, họ tên)</div>
          <div className="doc-signature-col__name">{customer?.fullName || 'Trần Đình Trọng'}</div>
        </div>
      </div>
    </div>
  )
}

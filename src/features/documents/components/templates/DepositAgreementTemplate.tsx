import { formatDate, formatMoney } from '@/lib/format'
import type { DealPrintData } from '../../api'
import { numberToVietnameseWords } from '../../utils/numberToVietnameseWords'
import '../../styles/documentPrint.css'

interface Props {
  deal: DealPrintData
  customer?: {
    fullName?: string
    phone?: string
    idCard?: string
    idCardDate?: string
    idCardPlace?: string
    address?: string
  } | null
  salesPersonName?: string
}

export function DepositAgreementTemplate({ deal, customer, salesPersonName }: Props) {
  const company = deal.company
  const product = deal.product
  const project = deal.project
  const today = new Date()

  return (
    <div className="print-page-a4">
      {/* Header */}
      <div className="doc-header">
        <div className="doc-header__left">
          <div className="doc-header__company-name">{company?.companyName || 'TỔNG CÔNG TY ĐẤT XANH MIỀN TRUNG'}</div>
          <div>MST: {company?.taxCode || '0401412898'}</div>
          <div>Trụ sở: {company?.headquarterAddress || '52-54 Võ Văn Kiệt, Sơn Trà, TP. Đà Nẵng'}</div>
          <div>Hotline: {company?.hotline || '1900 234 567'}</div>
        </div>
        <div className="doc-header__right">
          <div className="doc-header__country">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div className="doc-header__motto">Độc lập - Tự do - Hạnh phúc</div>
          <div className="doc-header__divider" />
          <div className="doc-header__date">
            Đà Nẵng, ngày {today.getDate()} tháng {today.getMonth() + 1} năm {today.getFullYear()}
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="doc-title-block">
        <div className="doc-title">PHIẾU ĐĂNG KÝ ĐẶT CỌC CĂN HỘ</div>
        <div className="doc-subtitle">
          (Mã hợp đồng / thỏa thuận: <strong>{deal.contractCode}</strong>)
        </div>
      </div>

      {/* Bên A: Bên Bán */}
      <div className="doc-section-title">BÊN BÁN (BÊN A): CHỦ ĐẦU TƯ / ĐƠN VỊ PHÁT TRIỂN DỰ ÁN</div>
      <div className="doc-row">
        <span className="doc-label">Tên đơn vị:</span>
        <span className="doc-value doc-value--bold">{company?.companyName}</span>
      </div>
      <div className="doc-row">
        <span className="doc-label">Địa chỉ trụ sở:</span>
        <span className="doc-value">{company?.headquarterAddress}</span>
      </div>
      <div className="doc-row">
        <span className="doc-label">Đại diện theo PL:</span>
        <span className="doc-value">
          <strong>{company?.representativeName}</strong> — Chức vụ: {company?.representativePosition}
        </span>
      </div>

      {/* Bên B: Bên Mua */}
      <div className="doc-section-title">BÊN ĐẶT CỌC (BÊN B): KHÁCH HÀNG MUA CĂN HỘ</div>
      <div className="doc-row">
        <span className="doc-label">Họ và tên:</span>
        <span className="doc-value doc-value--bold">
          {customer?.fullName ? customer.fullName.toUpperCase() : 'TRẦN ĐÌNH TRỌNG'}
        </span>
      </div>
      <div className="doc-row">
        <span className="doc-label">Số CMND/CCCD:</span>
        <span className="doc-value">
          {customer?.idCard || '048092001889'} · Ngày cấp: {customer?.idCardDate ? formatDate(customer.idCardDate) : '15/04/2021'} · Nơi cấp: {customer?.idCardPlace || 'Cục CSQLHC về TTXH'}
        </span>
      </div>
      <div className="doc-row">
        <span className="doc-label">Địa chỉ thường trú:</span>
        <span className="doc-value">{customer?.address || 'Hải Châu, TP. Đà Nẵng'}</span>
      </div>
      <div className="doc-row">
        <span className="doc-label">Số điện thoại:</span>
        <span className="doc-value">{customer?.phone || '0905123456'}</span>
      </div>

      {/* Thông tin Bất động sản */}
      <div className="doc-section-title">THÔNG TIN BẤT ĐỘNG SẢN ĐẶT CỌC</div>
      <div className="doc-row">
        <span className="doc-label">Dự án:</span>
        <span className="doc-value doc-value--bold">{project?.name || 'Regal Legend Quảng Bình'}</span>
      </div>
      <div className="doc-row">
        <span className="doc-label">Địa điểm dự án:</span>
        <span className="doc-value">{project?.location || 'Võ Nguyên Giáp, Bảo Ninh, Đồng Hới'}</span>
      </div>
      <div className="doc-row">
        <span className="doc-label">Mã căn hộ:</span>
        <span className="doc-value doc-value--highlight">
          {product?.code || 'RL-A201'} (Block {product?.block || 'A'} · {product?.bedroom || 2} Phòng ngủ · Hướng {product?.direction || 'Đông Nam'})
        </span>
      </div>
      <div className="doc-row">
        <span className="doc-label">Diện tích sàn:</span>
        <span className="doc-value">{product?.area || 75.5} m²</span>
      </div>

      {/* Giá bán & Tiền đặt cọc */}
      <div className="doc-section-title">GIÁ TRỊ CĂN HỘ VÀ TIỀN ĐẶT CỌC</div>
      <div className="doc-row">
        <span className="doc-label">Giá bán niêm yết:</span>
        <span className="doc-value doc-value--bold">{formatMoney(deal.contractValue)}</span>
      </div>
      <div className="doc-row">
        <span className="doc-label">Số tiền đặt cọc:</span>
        <span className="doc-value doc-value--highlight">{formatMoney(deal.depositAmount || 100000000)}</span>
      </div>
      <div className="doc-row">
        <span className="doc-label">Bằng chữ:</span>
        <span className="doc-value" style={{ fontStyle: 'italic' }}>
          {numberToVietnameseWords(deal.depositAmount || 100000000)}
        </span>
      </div>
      <div className="doc-row">
        <span className="doc-label">Thời hạn ký HĐMB:</span>
        <span className="doc-value">
          Trong vòng 07 ngày làm việc kể từ ngày ký phiếu đặt cọc (Dự kiến: {formatDate(deal.signedDate || today.toISOString())})
        </span>
      </div>

      {/* Chữ ký */}
      <div className="doc-signatures">
        <div className="doc-signature-col">
          <div className="doc-signature-col__title">ĐẠI DIỆN BÊN A</div>
          <div className="doc-signature-col__note">(Ký, ghi rõ họ tên và đóng dấu)</div>
          <div className="doc-signature-col__name">{company?.representativeName || 'Trần Ngọc Thái'}</div>
        </div>
        <div className="doc-signature-col">
          <div className="doc-signature-col__title">CHUYÊN VIÊN TƯ VẤN</div>
          <div className="doc-signature-col__note">(Ký và ghi rõ họ tên)</div>
          <div className="doc-signature-col__name">{salesPersonName || 'Nguyễn Văn Sales'}</div>
        </div>
        <div className="doc-signature-col">
          <div className="doc-signature-col__title">ĐẠI DIỆN BÊN B</div>
          <div className="doc-signature-col__note">(Ký và ghi rõ họ tên)</div>
          <div className="doc-signature-col__name">{customer?.fullName || 'Trần Đình Trọng'}</div>
        </div>
      </div>
    </div>
  )
}

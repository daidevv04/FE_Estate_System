import { formatDate, formatMoney } from '@/lib/format'
import type { DealPrintData } from '../../api'
import '../../styles/documentPrint.css'

interface Props {
  deal: DealPrintData
  customer?: {
    fullName?: string
    phone?: string
  } | null
}

export function PaymentScheduleTemplate({ deal, customer }: Props) {
  const company = deal.company
  const product = deal.product
  const project = deal.project
  const today = new Date()

  const schedules = deal.schedules && deal.schedules.length > 0 ? deal.schedules : [
    { id: '1', installmentNo: 1, name: 'Đợt 1: Ký Hợp đồng mua bán', percentage: 15, amountDue: (deal.contractValue * 0.15), dueDate: '2026-10-25', notes: 'Bao gồm tiền đặt cọc' },
    { id: '2', installmentNo: 2, name: 'Đợt 2: Xây dựng đến tầng 5', percentage: 15, amountDue: (deal.contractValue * 0.15), dueDate: '2026-12-15', notes: 'Hoàn thành sàn tầng 5' },
    { id: '3', installmentNo: 3, name: 'Đợt 3: Xây dựng đến tầng 15', percentage: 15, amountDue: (deal.contractValue * 0.15), dueDate: '2027-02-15', notes: 'Hoàn thành sàn tầng 15' },
    { id: '4', installmentNo: 4, name: 'Đợt 4: Cất nóc toà nhà', percentage: 15, amountDue: (deal.contractValue * 0.15), dueDate: '2027-05-15', notes: 'Lễ cất nóc dự án' },
    { id: '5', installmentNo: 5, name: 'Đợt 5: Hoàn thiện mặt ngoài', percentage: 10, amountDue: (deal.contractValue * 0.10), dueDate: '2027-08-15', notes: 'Hoàn thiện hệ kính Facade' },
    { id: '6', installmentNo: 6, name: 'Đợt 6: Bàn giao căn hộ', percentage: 25, amountDue: (deal.contractValue * 0.25), dueDate: '2027-11-15', notes: 'Kèm 2% kinh phí bảo trì' },
    { id: '7', installmentNo: 7, name: 'Đợt 7: Nhận Giấy chứng nhận quyền sở hữu', percentage: 5, amountDue: (deal.contractValue * 0.05), dueDate: '2028-03-15', notes: 'Bàn giao sổ hồng' },
  ]

  const totalPaid = (deal.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0)
  const remaining = Math.max(0, deal.contractValue - totalPaid)

  return (
    <div className="print-page-a4">
      {/* Header */}
      <div className="doc-header">
        <div className="doc-header__left">
          <div className="doc-header__company-name">{company?.companyName || 'TỔNG CÔNG TY ĐẤT XANH MIỀN TRUNG'}</div>
          <div>Dự án: {project?.name || 'Regal Legend Quảng Bình'}</div>
          <div>Hotline hỗ trợ: {company?.hotline || '1900 234 567'}</div>
        </div>
        <div className="doc-header__right">
          <div className="doc-header__country">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div className="doc-header__motto">Độc lập - Tự do - Hạnh phúc</div>
          <div className="doc-header__divider" />
          <div className="doc-header__date">
            Ngày {today.getDate()} tháng {today.getMonth() + 1} năm {today.getFullYear()}
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="doc-title-block">
        <div className="doc-title">BẢNG KẾ HOẠCH & TIẾN ĐỘ THANH TOÁN</div>
        <div className="doc-subtitle">
          (Đính kèm Hợp đồng số: <strong>{deal.contractCode}</strong> — Căn hộ: <strong>{product?.code || 'RL-A201'}</strong>)
        </div>
      </div>

      {/* Tóm tắt hợp đồng */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, background: '#f8fafc', padding: '10px 14px', borderRadius: 6 }}>
        <div>
          <div>Khách hàng: <strong>{customer?.fullName || 'Trần Đình Trọng'}</strong></div>
          <div>Số điện thoại: <strong>{customer?.phone || '0905123456'}</strong></div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div>Giá trị căn hộ: <strong style={{ color: '#059669' }}>{formatMoney(deal.contractValue)}</strong></div>
          <div>Tiền cọc đã nộp: <strong>{formatMoney(deal.depositAmount || 100000000)}</strong></div>
        </div>
      </div>

      {/* Bảng tiến độ */}
      <table className="doc-table">
        <thead>
          <tr>
            <th style={{ width: '8%' }}>Đợt</th>
            <th style={{ width: '38%' }}>Nội dung đợt thanh toán</th>
            <th style={{ width: '12%' }}>Tỷ lệ (%)</th>
            <th style={{ width: '18%' }}>Số tiền phải nộp</th>
            <th style={{ width: '14%' }}>Hạn thanh toán</th>
            <th style={{ width: '10%' }}>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((s, idx) => {
            const isFirst = idx === 0
            return (
              <tr key={s.id || idx}>
                <td className="align-center"><strong>#{s.installmentNo}</strong></td>
                <td>
                  <strong>{s.name}</strong>
                  {s.notes && <div style={{ fontSize: '9.5pt', color: '#64748b' }}>{s.notes}</div>}
                </td>
                <td className="align-center">{s.percentage}%</td>
                <td className="align-right"><strong>{formatMoney(s.amountDue)}</strong></td>
                <td className="align-center">{s.dueDate ? formatDate(s.dueDate) : 'Theo tiến độ'}</td>
                <td className="align-center">
                  {isFirst ? (
                    <span style={{ color: '#059669', fontWeight: 600 }}>Đã cọc</span>
                  ) : (
                    <span style={{ color: '#64748b' }}>Chưa nộp</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Tổng hợp tài chính */}
      <div style={{ marginTop: 16, borderTop: '2px solid #0f172a', paddingTop: 10 }}>
        <div className="doc-row">
          <span className="doc-label" style={{ minWidth: 200 }}>Tổng giá trị hợp đồng:</span>
          <span className="doc-value doc-value--bold" style={{ fontSize: '13pt' }}>{formatMoney(deal.contractValue)}</span>
        </div>
        <div className="doc-row">
          <span className="doc-label" style={{ minWidth: 200 }}>Đã thanh toán thực tế:</span>
          <span className="doc-value doc-value--highlight" style={{ fontSize: '13pt' }}>{formatMoney(totalPaid || deal.depositAmount || 100000000)}</span>
        </div>
        <div className="doc-row">
          <span className="doc-label" style={{ minWidth: 200 }}>Còn lại phải thu:</span>
          <span className="doc-value doc-value--bold" style={{ color: remaining > 0 ? '#b91c1c' : '#059669' }}>
            {formatMoney(remaining)}
          </span>
        </div>
      </div>

      {/* Ghi chú pháp lý */}
      <div style={{ fontSize: '10pt', color: '#475569', marginTop: 14, fontStyle: 'italic', lineHeight: 1.4 }}>
        * Lưu ý: Khách hàng thanh toán đúng hạn vào tài khoản thụ hưởng của Chủ đầu tư tại MBBank (STK: 0401412898999). Quá thời hạn quy định, khoản thanh toán sẽ chịu lãi phạt chậm nộp 0.05%/ngày theo điều khoản Hợp đồng mua bán.
      </div>

      {/* Chữ ký */}
      <div className="doc-signatures">
        <div className="doc-signature-col" style={{ width: '45%' }}>
          <div className="doc-signature-col__title">PHÒNG QUẢN LÝ HỢP ĐỒNG & CÔNG NỢ</div>
          <div className="doc-signature-col__note">(Ký, họ tên và đóng dấu)</div>
          <div className="doc-signature-col__name">Nguyễn Thị Thu Trang</div>
        </div>
        <div className="doc-signature-col" style={{ width: '45%' }}>
          <div className="doc-signature-col__title">XÁC NHẬN CỦA KHÁCH HÀNG</div>
          <div className="doc-signature-col__note">(Ký và ghi rõ họ tên)</div>
          <div className="doc-signature-col__name">{customer?.fullName || 'Trần Đình Trọng'}</div>
        </div>
      </div>
    </div>
  )
}

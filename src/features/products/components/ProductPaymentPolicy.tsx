import { GiftOutlined, PercentageOutlined } from '@ant-design/icons'
import { Empty } from 'antd'
import { ProductSection } from './ProductSection'

export interface PaymentTerm {
  id: string
  name: string
  percent: number
  amount: number | null
  note: string | null
  paid: boolean
}

export function ProductPaymentPolicy({ terms }: { terms: PaymentTerm[] }) {
  return (
    <ProductSection title="Chính sách thanh toán ưu đãi">
      {terms.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Chưa có chính sách thanh toán cho sản phẩm này"
        />
      ) : (
        <>
          <ul className="pd-terms">
            {terms.map((term) => (
              <li className="pd-term" key={term.id}>
                <div className="pd-term__head">
                  <span className="pd-term__name">{term.name}</span>
                  <span className={`pd-term__badge ${term.paid ? 'is-paid' : ''}`}>{term.paid ? 'Đã thanh toán' : `CK ${term.percent}%`}</span>
                </div>
                <div className="pd-term__amount">{term.amount == null ? '—' : `${term.percent}%`}</div>
                {term.note && <div className="pd-term__note">{term.note}</div>}
              </li>
            ))}
          </ul>
          <div className="pd-policy-gift">
            <GiftOutlined />
            <span>Chưa có thông tin chương trình quà tặng kèm theo.</span>
          </div>
        </>
      )}
      <p className="pd-policy__hint">
        <PercentageOutlined /> Chương trình khuyến mãi do dự án cấu hình — liên hệ quản lý dự án để áp dụng.
      </p>
    </ProductSection>
  )
}
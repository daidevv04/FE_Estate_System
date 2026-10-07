import { LinkOutlined } from '@ant-design/icons'
import { App, Button } from 'antd'
import { ProductSection } from './ProductSection'

interface FloorPlan {
  id: string
  name: string
  imageUrl: string | null
  area: number | null
}

/**
 * 9.17 — thumbnails mặt bằng. Backend chưa có entity bản vẽ (ProductResponse không có field mặt bằng)
 * nên danh sách luôn rỗng và hiện empty state; không dựng bản vẽ giả.
 * Khi backend có endpoint, chỉ cần truyền `plans` vào — giao diện không đổi.
 */
export function ProductFloorPlans({ plans }: { plans: FloorPlan[] }) {
  const { message } = App.useApp()

  return (
    <ProductSection
      title="Mặt bằng & bố trí công năng"
      extra={<Button type="link" size="small" icon={<LinkOutlined />} onClick={() => message.info('Chưa có API bản vẽ chi tiết')}>Nháp xem bản vẽ chi tiết</Button>}
    >
      {plans.length === 0 ? (
        <div className="pd-media-empty">
          <strong>Chưa có mặt bằng</strong>
          <span>Dữ liệu bản vẽ chưa được đồng bộ cho sản phẩm này.</span>
        </div>
      ) : (
        <div className="pd-floors">
          {plans.map((plan) => (
            <button type="button" className="pd-floor" key={plan.id}>
              <span className="pd-floor__img">
                {plan.imageUrl ? <img src={plan.imageUrl} alt={plan.name} loading="lazy" /> : <span className="pd-floor__none">Chưa có ảnh</span>}
              </span>
              <span className="pd-floor__name">{plan.name}</span>
              {plan.area != null && <span className="pd-floor__area">DT: {plan.area} m²</span>}
            </button>
          ))}
        </div>
      )}
    </ProductSection>
  )
}
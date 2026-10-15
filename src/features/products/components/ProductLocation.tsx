import { EnvironmentOutlined } from '@ant-design/icons'
import { ProductSection } from './ProductSection'

export function ProductLocation({ location, code }: { location: string | null; code: string }) {
  return (
    <ProductSection title="Vị trí thực tế trên bản đồ dự án" subtitle={location ?? undefined}>
      <div className="pd-map">
        <div className="pd-map__placeholder">
          <EnvironmentOutlined />
          <strong>{code}</strong>
          <span>{location ?? 'Chưa cập nhật địa chỉ dự án'}</span>
        </div>
        <p className="pd-map__note">Bản đồ tương tác sẽ hiển thị khi hệ thống tích hợp dịch vụ bản đồ.</p>
      </div>
    </ProductSection>
  )
}
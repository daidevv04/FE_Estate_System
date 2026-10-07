import { EnvironmentOutlined } from '@ant-design/icons'
import { ProductSection } from './ProductSection'

/**
 * 9.17 — khu vực bản đồ. Dự án CHƯA tích hợp map provider nên không dựng map giả (tránh "fake interactive map").
 * Hiện khối trống đúng bố cục Stitch + địa chỉ thật lấy từ project.location.
 */
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
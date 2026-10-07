import { ExpandOutlined, FileImageOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { ProductSection } from './ProductSection'

interface Props {
  /** URL ảnh thật từ API (product.imageUrl). Không có thì hiện empty state — không dựng ảnh giả. */
  imageUrl: string | null
  code: string
  /** Dòng phụ mô tả ảnh; nếu rỗng thì bỏ overlay chú thích. */
  caption?: string
  onOpen: () => void
}

/**
 * 9.17 — ảnh chính + caption overlay đáy + nút phóng to góc phải.
 * Backend chỉ có 1 field imageUrl (không có endpoint gallery) nên CHỈ render MỘT ảnh chính;
 * không dựng thumbnail giả. Muốn có thumbnail cần API /products/{id}/images.
 */
export function ProductGallery({ imageUrl, code, caption, onOpen }: Props) {
  const [failed, setFailed] = useState(false)
  const hasImage = Boolean(imageUrl) && !failed

  return (
    <ProductSection title="Hình ảnh thực tế & Phối cảnh kiến trúc">
      {hasImage ? (
        <button type="button" className="pd-gallery" onClick={onOpen}>
          <img src={imageUrl ?? ''} alt={`Ảnh căn ${code}`} loading="lazy" onError={() => setFailed(true)} />
          <span className="pd-gallery__caption">
            <strong>{code}</strong>
            {caption && <span>{caption}</span>}
          </span>
          <span className="pd-gallery__zoom" aria-hidden><ExpandOutlined /></span>
        </button>
      ) : (
        <div className="pd-media-empty">
          <FileImageOutlined />
          <strong>{failed ? 'Ảnh không tải được' : 'Chưa có ảnh cho sản phẩm này'}</strong>
          <span>Cập nhật ảnh tại màn Sửa sản phẩm.</span>
        </div>
      )}
    </ProductSection>
  )
}
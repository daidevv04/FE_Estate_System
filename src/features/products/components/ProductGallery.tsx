import { BankOutlined, ExpandOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { ProductSection } from './ProductSection'

interface Props {
  imageUrl: string | null
  code: string
  caption?: string
  onOpen: () => void
}

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
          <span className="pd-gallery__zoom" aria-hidden>
            <ExpandOutlined />
          </span>
        </button>
      ) : (
        <div className="pd-mock-gallery">
          <div className="pd-mock-gallery__icon">
            <BankOutlined />
          </div>
          <span className="pd-mock-gallery__badge">Phối cảnh căn hộ mẫu · {code}</span>
          <div className="pd-mock-gallery__meta">
            <strong>{code}</strong>
            <span>{caption || 'Chưa cập nhật ảnh phối cảnh thực tế (Mẫu kiến trúc Đất Xanh)'}</span>
          </div>
        </div>
      )}
    </ProductSection>
  )
}
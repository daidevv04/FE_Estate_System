import { AppstoreOutlined, CompassOutlined, EditOutlined, EnvironmentOutlined, HomeOutlined, PictureOutlined } from '@ant-design/icons'
import { Button, Card, Empty, Modal, Skeleton, Space, Tag, Typography } from 'antd'
import { useState } from 'react'
import { useProject } from '@/features/projects/api'
import { formatDate, formatMoney } from '@/lib/format'
import { DIRECTION, PRODUCT_STATUS, PRODUCT_TYPE, labelOf, useProduct, type Product } from '../api'
import './ProductDetailModal.css'

interface Props { productId?: string; onClose: () => void; onEdit: (product: Product) => void }
const tone: Record<Product['status'], string> = { AVAILABLE: 'green', RESERVED: 'gold', SOLD: 'blue' }

/** Popup chỉ đọc sản phẩm. Field thiếu hiển thị “Chưa cập nhật”, không dựng dữ liệu không có trong ProductResponse. */
export function ProductDetailModal({ productId, onClose, onEdit }: Props) {
  const detail = useProduct(productId)
  const product = detail.data
  const project = useProject(product?.projectId)
  const [imageFailed, setImageFailed] = useState(false)

  return <Modal open={Boolean(productId)} onCancel={onClose} width={920} className="product-detail-modal" destroyOnHidden title="Thông tin sản phẩm" footer={product && <div className="product-detail-modal__footer"><Typography.Text>Thông tin được tải mới từ hệ thống CRM.</Typography.Text><Space><Button onClick={onClose}>Đóng</Button><Button type="primary" icon={<EditOutlined />} onClick={() => onEdit(product)}>Chỉnh sửa</Button></Space></div>}>
    {detail.isLoading ? <Skeleton active avatar paragraph={{ rows: 12 }} /> : !product ? <Empty description={detail.isError ? 'Không thể tải thông tin sản phẩm.' : 'Không tìm thấy sản phẩm.'}><Button hidden={!detail.isError} onClick={() => void detail.refetch()}>Thử lại</Button></Empty> : <div className="product-detail-modal__content">
      <div className="product-detail-modal__hero"><div className="product-detail-modal__cover">{product.imageUrl && !imageFailed ? <img src={product.imageUrl} alt={`Ảnh sản phẩm ${product.code}`} onError={() => setImageFailed(true)} /> : <PictureOutlined />}</div><div className="product-detail-modal__identity"><Typography.Text type="secondary">{labelOf(PRODUCT_TYPE, product.type).toUpperCase()}</Typography.Text><Typography.Title level={3}>{product.code}</Typography.Title><Tag color={tone[product.status]}>{labelOf(PRODUCT_STATUS, product.status)}</Tag></div><div className="product-detail-modal__audit"><span>Ngày tạo</span><strong>{formatDate(product.createdAt)}</strong><span>Cập nhật</span><strong>{formatDate(product.updatedAt)}</strong></div></div>
      <div className="product-detail-modal__grid"><Card className="product-detail-modal__card" size="small" title={<Space size={7}><AppstoreOutlined />Thông tin sản phẩm</Space>} extra="Thông tin cơ bản"><div className="product-detail-modal__facts"><div><span>Mã sản phẩm</span><strong>{product.code}</strong></div><div><span>Trạng thái</span><Tag color={tone[product.status]}>{labelOf(PRODUCT_STATUS, product.status)}</Tag></div><div><span><HomeOutlined /> Loại hình</span><strong>{labelOf(PRODUCT_TYPE, product.type)}</strong></div><div><span>Diện tích</span><strong>{product.area ? `${product.area} m²` : 'Chưa cập nhật'}</strong></div><div><span>Block / phân khu</span><strong>{product.block || 'Chưa cập nhật'}</strong></div><div><span><CompassOutlined /> Hướng</span><strong>{labelOf(DIRECTION, product.direction) === '—' ? 'Chưa cập nhật' : labelOf(DIRECTION, product.direction)}</strong></div><div><span>Số phòng ngủ</span><strong>{product.bedroom == null ? 'Chưa cập nhật' : `${product.bedroom} phòng`}</strong></div><div><span>Giá niêm yết</span><strong>{product.price == null ? 'Chưa cập nhật' : formatMoney(product.price)}</strong></div></div></Card><Card className="product-detail-modal__card" size="small" title={<Space size={7}><EnvironmentOutlined />Thuộc dự án</Space>} extra="Danh mục"><div className="product-detail-modal__project"><strong>{project.data?.name ?? 'Chưa cập nhật'}</strong><span>{project.data?.location || 'Chưa cập nhật địa điểm'}</span><span>Chủ đầu tư: {project.data?.investor || 'Chưa cập nhật'}</span></div></Card></div>
    </div>}
  </Modal>
}
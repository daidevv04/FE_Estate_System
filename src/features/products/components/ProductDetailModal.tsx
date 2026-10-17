import {
  BankOutlined,
  CompassOutlined,
  EditOutlined,
  EnvironmentOutlined,
  ExportOutlined,
  HomeOutlined,
  KeyOutlined,
} from '@ant-design/icons'
import { Button, Empty, Modal, Skeleton, Space, Typography } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusPill, type Tone } from '@/components/common/StatusPill'
import { useProject } from '@/features/projects/api'
import { formatDate, formatMoney } from '@/lib/format'
import { paths } from '@/routes/paths'
import { DIRECTION, PRODUCT_TYPE, labelOf, useProduct, type Product, type ProductStatus } from '../api'
import './ProductDetailModal.css'

interface Props { productId?: string; onClose: () => void; onEdit: (product: Product) => void }

const STATUS_CONFIG: Record<ProductStatus, { label: string; tone: Tone }> = {
  AVAILABLE: { label: 'Còn trống', tone: 'green' },
  RESERVED: { label: 'Đang giữ chỗ', tone: 'amber' },
  SOLD: { label: 'Đã bán', tone: 'blue' },
}

export function ProductDetailModal({ productId, onClose, onEdit }: Props) {
  const navigate = useNavigate()
  const detail = useProduct(productId)
  const product = detail.data
  const project = useProject(product?.projectId)
  const [imageFailed, setImageFailed] = useState(false)

  const st = product ? STATUS_CONFIG[product.status] ?? STATUS_CONFIG.AVAILABLE : STATUS_CONFIG.AVAILABLE
  const pricePerM2 = product?.price && product?.area && product.area > 0 ? Math.round(product.price / product.area) : null

  return (
    <Modal
      open={Boolean(productId)}
      onCancel={onClose}
      width={1060}
      className="product-detail-modal"
      centered
      destroyOnHidden
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: '#DCFCE7', color: '#16A34A', display: 'grid', placeItems: 'center', fontSize: 18 }}>
            <HomeOutlined />
          </span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>Hồ sơ chi tiết sản phẩm / căn hộ</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>Thông số kỹ thuật, giá niêm yết & dự án liên kết</div>
          </div>
        </div>
      }
      footer={
        product && (
          <div className="product-detail-modal__footer">
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Dữ liệu sản phẩm đồng bộ trực tiếp từ hệ thống CRM Đất Xanh Miền Trung.
            </Typography.Text>
            <Space size={10}>
              <Button onClick={onClose} style={{ height: 38, borderRadius: 8 }}>
                Đóng
              </Button>
              {project.data && (
                <Button
                  icon={<ExportOutlined />}
                  onClick={() => {
                    onClose()
                    navigate(paths.project(project.data.id))
                  }}
                  style={{ height: 38, borderRadius: 8 }}
                >
                  Xem trang dự án
                </Button>
              )}
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => onEdit(product)}
                style={{ height: 38, borderRadius: 8, background: '#006b2c' }}
              >
                Chỉnh sửa sản phẩm
              </Button>
            </Space>
          </div>
        )
      }
    >
      {detail.isLoading ? (
        <Skeleton active avatar paragraph={{ rows: 12 }} />
      ) : !product ? (
        <Empty description={detail.isError ? 'Không thể tải thông tin sản phẩm.' : 'Không tìm thấy sản phẩm.'}>
          <Button hidden={!detail.isError} onClick={() => void detail.refetch()}>
            Thử lại
          </Button>
        </Empty>
      ) : (
        <div className="product-detail-modal__content">
          <div className="prod-hero">
            <div className="prod-hero__media">
              {product.imageUrl && !imageFailed ? (
                <div className="prod-hero__img-wrap">
                  <img src={product.imageUrl} alt={product.code} onError={() => setImageFailed(true)} />
                  <div className="prod-hero__scrim" />
                </div>
              ) : (
                <div className="prod-hero__empty">
                  <div className="prod-hero__empty-icon">
                    <BankOutlined />
                  </div>
                  <span className="prod-hero__empty-badge">Phối cảnh căn hộ mẫu · {product.code}</span>
                  <span className="prod-hero__empty-sub">Kiến trúc chuẩn Đất Xanh Miền Trung</span>
                </div>
              )}

              <StatusPill tone={st.tone} className="prod-status-badge">
                {st.label}
              </StatusPill>

              <span className="prod-type-badge">
                {labelOf(PRODUCT_TYPE, product.type)}
              </span>
            </div>

            <div className="prod-hero__info">
              <div className="prod-hero__eyebrow">
                <span>SẢN PHẨM BẤT ĐỘNG SẢN</span>
                <span className="prod-hero__block">
                  {product.block ? `BLOCK / PHÂN KHU: ${product.block}` : 'CHƯA PHÂN KHU'}
                </span>
              </div>

              <div className="prod-hero__title-row">
                <h2 className="prod-hero__title">{product.code}</h2>
                <div className="prod-hero__price">{formatMoney(product.price)}</div>
              </div>

              <div className="prod-hero__facts">
                <div className="prod-hero__fact">
                  <EnvironmentOutlined style={{ color: '#16a34a', fontSize: 15 }} />
                  <span>
                    Dự án: <strong>{project.data?.name || 'Chưa cập nhật'}</strong>
                    {project.data?.location ? ` · ${project.data.location}` : ''}
                  </span>
                </div>
                {pricePerM2 && (
                  <div className="prod-hero__fact">
                    <KeyOutlined style={{ color: '#0284c7', fontSize: 14 }} />
                    <span>Đơn giá ước tính: <strong>{formatMoney(pricePerM2)} / m²</strong></span>
                  </div>
                )}
              </div>

              {product.status === 'RESERVED' && (
                <div style={{ marginTop: 12, marginBottom: 14, padding: '10px 14px', background: '#FEF3C7', borderRadius: 8, border: '1px solid #FCD34D', color: '#92400E', fontSize: 13 }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🔒 Căn đang được giữ chỗ</span>
                    {product.lockExpiresAt && <span>· Hạn chót: {product.lockExpiresAt}</span>}
                  </div>
                  {product.lockDepositAmount != null && product.lockDepositAmount > 0 && (
                    <div style={{ marginTop: 2, fontSize: 12 }}>
                      Tiền cọc thiện chí / booking: <strong>{formatMoney(product.lockDepositAmount)}</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="prod-kpi-grid">
                <div className="prod-kpi-card prod-kpi-card--green">
                  <span className="prod-kpi-label">DIỆN TÍCH THÔNG THỦY</span>
                  <strong className="prod-kpi-value">{product.area ? `${product.area} m²` : '—'}</strong>
                  <span className="prod-kpi-sub">Diện tích mặt sàn</span>
                </div>
                <div className="prod-kpi-card prod-kpi-card--blue">
                  <span className="prod-kpi-label">PHÒNG NGỦ</span>
                  <strong className="prod-kpi-value">{product.bedroom != null ? `${product.bedroom} PN` : '—'}</strong>
                  <span className="prod-kpi-sub">Bố trí phòng</span>
                </div>
                <div className="prod-kpi-card prod-kpi-card--purple">
                  <span className="prod-kpi-label">HƯỚNG BAN CÔNG / CỬA</span>
                  <strong className="prod-kpi-value" style={{ fontSize: 15 }}>
                    {labelOf(DIRECTION, product.direction) === '—' ? 'Chưa rõ' : labelOf(DIRECTION, product.direction)}
                  </strong>
                  <span className="prod-kpi-sub">Phong thủy</span>
                </div>
              </div>
            </div>
          </div>
          {/* Lower Grid */}
          <div className="prod-body-grid">
            <div className="prod-card">
              <div className="prod-card__header">
                <div className="prod-card__title">
                  <CompassOutlined style={{ color: '#16a34a' }} />
                  <span>Thông số kỹ thuật & Chi tiết căn hộ</span>
                </div>
                <span className="prod-card__hint">Quy chuẩn xây dựng</span>
              </div>
              <div className="prod-card__content">
                <div className="prod-specs-grid">
                  <div className="prod-spec-item">
                    <span>Mã sản phẩm / căn</span>
                    <strong>{product.code}</strong>
                  </div>
                  <div className="prod-spec-item">
                    <span>Loại hình</span>
                    <strong>{labelOf(PRODUCT_TYPE, product.type)}</strong>
                  </div>
                  <div className="prod-spec-item">
                    <span>Phân khu / Block</span>
                    <strong>{product.block || 'Chưa cập nhật'}</strong>
                  </div>
                  <div className="prod-spec-item">
                    <span>Diện tích</span>
                    <strong>{product.area ? `${product.area} m²` : 'Chưa cập nhật'}</strong>
                  </div>
                  <div className="prod-spec-item">
                    <span>Hướng</span>
                    <strong>{labelOf(DIRECTION, product.direction) === '—' ? 'Chưa cập nhật' : labelOf(DIRECTION, product.direction)}</strong>
                  </div>
                  <div className="prod-spec-item">
                    <span>Số phòng ngủ</span>
                    <strong>{product.bedroom != null ? `${product.bedroom} phòng` : 'Chưa cập nhật'}</strong>
                  </div>
                  <div className="prod-spec-item">
                    <span>Giá niêm yết</span>
                    <strong style={{ color: '#16a34a' }}>{formatMoney(product.price)}</strong>
                  </div>
                  <div className="prod-spec-item">
                    <span>Đơn giá / m²</span>
                    <strong>{pricePerM2 ? `${formatMoney(pricePerM2)}/m²` : 'Chưa cập nhật'}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="prod-card">
              <div className="prod-card__header">
                <div className="prod-card__title">
                  <EnvironmentOutlined style={{ color: '#0284c7' }} />
                  <span>Dự án & Trạng thái phân phối</span>
                </div>
                <StatusPill tone={st.tone}>{st.label}</StatusPill>
              </div>
              <div className="prod-card__content">
                <div className="prod-project-box">
                  <div className="prod-project-name">{project.data?.name ?? 'Chưa liên kết dự án'}</div>
                  <div className="prod-project-line">
                    <EnvironmentOutlined style={{ color: '#16a34a' }} />
                    <span>{project.data?.location || 'Chưa cập nhật địa điểm'}</span>
                  </div>
                  <div className="prod-project-line">
                    <span>Chủ đầu tư: <strong>{project.data?.investor || 'Chưa cập nhật'}</strong></span>
                  </div>
                  <div className="prod-project-line" style={{ fontSize: 12, color: '#94a3b8' }}>
                    <span>Cập nhật: {formatDate(product.updatedAt)}</span>
                  </div>
                </div>

                {project.data && (
                  <div className="prod-side-cta">
                    <Button
                      type="primary"
                      ghost
                      block
                      icon={<ExportOutlined />}
                      onClick={() => {
                        onClose()
                        navigate(paths.project(project.data.id))
                      }}
                      style={{ height: 40, borderRadius: 8, fontWeight: 600 }}
                    >
                      Xem toàn bộ dự án này →
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
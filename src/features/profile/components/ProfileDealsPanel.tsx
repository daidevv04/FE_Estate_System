import { FileTextOutlined, RightOutlined } from '@ant-design/icons'
import { Empty, Skeleton, Tag } from 'antd'
import { formatMoney } from '@/lib/format'

export interface ProfileDealItem {
  id: string
  contractCode: string
  contractValue: number | null
  status: string
  projectName: string
  productCode: string
  customerName: string
  date: string
}

interface ProfileDealsPanelProps {
  deals: ProfileDealItem[]
  loading?: boolean
  onViewAllDeals: () => void
}

const statusTagMap: Record<string, { color: string; label: string }> = {
  ACTIVE: { color: 'processing', label: 'Đang thực hiện' },
  IN_PROGRESS: { color: 'processing', label: 'Đang xử lý' },
  SIGNED: { color: 'success', label: 'Đã ký' },
  COMPLETED: { color: 'success', label: 'Hoàn tất' },
  DEPOSIT: { color: 'warning', label: 'Đang cọc' },
  DRAFT: { color: 'default', label: 'Bản thảo' },
  CANCELLED: { color: 'error', label: 'Đã hủy' },
}

export function ProfileDealsPanel({
  deals,
  loading = false,
  onViewAllDeals,
}: ProfileDealsPanelProps) {
  return (
    <div className="profile-panel-card">
      <div className="profile-panel-card__header">
        <div className="profile-panel-card__header-left">
          <div className="profile-panel-icon is-green">
            <FileTextOutlined />
          </div>
          <div>
            <h3 className="profile-panel-title">Giao dịch phụ trách</h3>
          </div>
        </div>
        <button
          type="button"
          className="profile-link-btn"
          onClick={onViewAllDeals}
        >
          Xem tất cả <RightOutlined style={{ fontSize: 11 }} />
        </button>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : deals.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Chưa có hợp đồng nào phụ trách"
          style={{ margin: '16px 0' }}
        />
      ) : (
        <div className="profile-deals-list">
          {deals.map((deal) => {
            const tag = statusTagMap[deal.status] ?? { color: 'default', label: deal.status }
            return (
              <div key={deal.id} className="profile-deal-item">
                <div className="profile-deal-item__row">
                  <div className="profile-deal-item__title-wrap">
                    <span className="profile-deal-item__code">{deal.contractCode}</span>
                    <Tag color={tag.color} className="profile-deal-tag">
                      {tag.label}
                    </Tag>
                  </div>
                  <span className="profile-deal-item__amount">
                    {formatMoney(deal.contractValue)}
                  </span>
                </div>
                <div className="profile-deal-item__sub">
                  <span>
                    {deal.projectName}
                    {deal.productCode ? ` • ${deal.productCode}` : ''}
                    {deal.customerName && deal.customerName !== '—' ? ` • ${deal.customerName}` : ''}
                  </span>
                  <span className="profile-deal-item__time">{deal.date}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

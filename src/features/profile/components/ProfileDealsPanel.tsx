import { FileTextOutlined, RightOutlined } from '@ant-design/icons'
import { Empty, Skeleton } from 'antd'
import { StatusPill, type Tone } from '@/components/common/StatusPill'
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

const statusTagMap: Record<string, { tone: Tone; label: string }> = {
  ACTIVE: { tone: 'blue', label: 'Đang thực hiện' },
  IN_PROGRESS: { tone: 'blue', label: 'Đang xử lý' },
  SIGNED: { tone: 'green', label: 'Đã ký' },
  COMPLETED: { tone: 'teal', label: 'Hoàn tất' },
  DEPOSIT: { tone: 'amber', label: 'Đang cọc' },
  DRAFT: { tone: 'gray', label: 'Bản thảo' },
  CANCELLED: { tone: 'red', label: 'Đã hủy' },
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
            const tag = statusTagMap[deal.status] ?? { tone: 'gray' as Tone, label: deal.status }
            return (
              <div key={deal.id} className="profile-deal-item">
                <div className="profile-deal-item__row">
                  <div className="profile-deal-item__title-wrap">
                    <span className="profile-deal-item__code">{deal.contractCode}</span>
                    <StatusPill tone={tag.tone} size="sm">
                      {tag.label}
                    </StatusPill>
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

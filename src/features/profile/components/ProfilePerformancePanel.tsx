import { RightOutlined, RiseOutlined } from '@ant-design/icons'
import { formatMoneyShort } from '@/lib/format'

interface ProfilePerformancePanelProps {
  revenue: number
  winRate: number | null
  activeLeads: number
  completedDeals: number
  loading?: boolean
  onViewReport: () => void
}

export function ProfilePerformancePanel({
  revenue,
  winRate,
  activeLeads,
  completedDeals,
  loading = false,
  onViewReport,
}: ProfilePerformancePanelProps) {
  return (
    <div className="profile-panel-card">
      <div className="profile-panel-card__header">
        <div className="profile-panel-card__header-left">
          <div className="profile-panel-icon is-green">
            <RiseOutlined />
          </div>
          <div>
            <h3 className="profile-panel-title">Hiệu suất kinh doanh</h3>
          </div>
        </div>
        <button
          type="button"
          className="profile-link-btn"
          onClick={onViewReport}
        >
          Xem báo cáo <RightOutlined style={{ fontSize: 11 }} />
        </button>
      </div>

      <div className="profile-kpi-grid">
        <div className="profile-kpi-box">
          <span className="profile-kpi-box__label">Doanh số phụ trách</span>
          <span className="profile-kpi-box__val">
            {loading ? '...' : formatMoneyShort(revenue)}
          </span>
          <span className="profile-kpi-box__sub is-green">Tổng giá trị hợp đồng</span>
        </div>
        <div className="profile-kpi-box">
          <span className="profile-kpi-box__label">Tỷ lệ chốt Deal</span>
          <span className="profile-kpi-box__val">
            {loading ? '...' : winRate != null ? `${winRate.toFixed(1)}%` : '—'}
          </span>
          <span className="profile-kpi-box__sub is-green">
            {winRate != null ? 'Thắng / tổng đóng' : 'Chưa có deal kết thúc'}
          </span>
        </div>
        <div className="profile-kpi-box">
          <span className="profile-kpi-box__label">Khách hàng active</span>
          <span className="profile-kpi-box__val">
            {loading ? '...' : `${activeLeads} Khách`}
          </span>
          <span className="profile-kpi-box__sub is-muted">Lead đang chăm sóc</span>
        </div>
        <div className="profile-kpi-box">
          <span className="profile-kpi-box__label">Hợp đồng hoàn tất</span>
          <span className="profile-kpi-box__val">
            {loading ? '...' : `${completedDeals} HĐ`}
          </span>
          <span className="profile-kpi-box__sub is-muted">Đã ký hoặc hoàn thành</span>
        </div>
      </div>
    </div>
  )
}

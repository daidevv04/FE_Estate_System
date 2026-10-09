import {
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons'

interface Props {
  total: number
  unread: number
  deals: number
  urgent: number
}

export function NotificationKpis({ total, unread, deals, urgent }: Props) {
  return (
    <div className="notif-kpi-grid">
      <div className="notif-kpi-card">
        <div>
          <div className="notif-kpi-label">Tổng thông báo</div>
          <div className="notif-kpi-val">{total}</div>
        </div>
        <div className="notif-kpi-icon-box" style={{ background: '#eff6ff', color: '#1677ff' }}>
          <BellOutlined />
        </div>
      </div>
      <div className="notif-kpi-card">
        <div>
          <div className="notif-kpi-label">Chưa đọc</div>
          <div className="notif-kpi-val" style={{ color: '#fa8c16' }}>{unread}</div>
        </div>
        <div className="notif-kpi-icon-box" style={{ background: '#fff7e6', color: '#fa8c16' }}>
          <CheckCircleOutlined />
        </div>
      </div>
      <div className="notif-kpi-card">
        <div>
          <div className="notif-kpi-label">Hợp đồng & GD</div>
          <div className="notif-kpi-val" style={{ color: '#10b981' }}>{deals}</div>
        </div>
        <div className="notif-kpi-icon-box" style={{ background: '#ecfdf5', color: '#10b981' }}>
          <FileTextOutlined />
        </div>
      </div>
      <div className="notif-kpi-card">
        <div>
          <div className="notif-kpi-label">Khẩn cấp / Cao</div>
          <div className="notif-kpi-val" style={{ color: '#ef4444' }}>{urgent}</div>
        </div>
        <div className="notif-kpi-icon-box" style={{ background: '#fef2f2', color: '#ef4444' }}>
          <ExclamationCircleOutlined />
        </div>
      </div>
    </div>
  )
}

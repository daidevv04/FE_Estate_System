import { BellOutlined } from '@ant-design/icons'
import { Switch } from 'antd'

interface ProfileNotifPanelProps {
  notifDeals: boolean
  notifAppointments: boolean
  notifReports: boolean
  onChangeDeals: (val: boolean) => void
  onChangeAppointments: (val: boolean) => void
  onChangeReports: (val: boolean) => void
}

export function ProfileNotifPanel({
  notifDeals,
  notifAppointments,
  notifReports,
  onChangeDeals,
  onChangeAppointments,
  onChangeReports,
}: ProfileNotifPanelProps) {
  return (
    <div className="profile-panel-card">
      <div className="profile-panel-card__header">
        <div className="profile-panel-card__header-left">
          <div className="profile-panel-icon is-green">
            <BellOutlined />
          </div>
          <div>
            <h3 className="profile-panel-title">Cài đặt thông báo</h3>
          </div>
        </div>
      </div>

      <div className="profile-notifs-list">
        <div className="profile-notif-item">
          <div className="profile-notif-item__info">
            <span className="profile-notif-item__title">
              Email thông báo giao dịch & Hợp đồng
            </span>
            <span className="profile-notif-item__desc">
              Nhận thông báo khi có thay đổi trạng thái đặt cọc, ký HĐMB
            </span>
          </div>
          <Switch checked={notifDeals} onChange={onChangeDeals} />
        </div>

        <div className="profile-notif-item">
          <div className="profile-notif-item__info">
            <span className="profile-notif-item__title">
              Cảnh báo lịch hẹn khách hàng (Push)
            </span>
            <span className="profile-notif-item__desc">
              Nhắc nhở trước 30 phút khi có lịch hẹn tư vấn dự án
            </span>
          </div>
          <Switch checked={notifAppointments} onChange={onChangeAppointments} />
        </div>

        <div className="profile-notif-item">
          <div className="profile-notif-item__info">
            <span className="profile-notif-item__title">
              Báo cáo hiệu suất kinh doanh tuần
            </span>
            <span className="profile-notif-item__desc">
              Gửi tổng kết doanh số và tỷ lệ chốt deal vào thứ Hai hàng tuần
            </span>
          </div>
          <Switch checked={notifReports} onChange={onChangeReports} />
        </div>
      </div>
      <p className="profile-notif-footer-hint">
        Cài đặt thông báo được lưu trữ an toàn theo hồ sơ tài khoản trên trình duyệt này.
      </p>
    </div>
  )
}

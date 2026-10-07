import { ApartmentOutlined, ContactsOutlined, EnvironmentFilled, FileTextOutlined, LockOutlined } from '@ant-design/icons'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { BrandArt } from './LoginPage'

const highlights = [
  { icon: <ContactsOutlined />, title: 'Quản lý khách hàng', desc: 'Theo dõi thông tin và lịch sử tương tác.' },
  { icon: <ApartmentOutlined />, title: 'Quản lý giỏ hàng', desc: 'Theo dõi sản phẩm và tình trạng căn.' },
  { icon: <FileTextOutlined />, title: 'Quản lý giao dịch', desc: 'Theo dõi cơ hội, đặt cọc và hợp đồng.' },
]

/** Markup/class CSS giống panel trái LoginPage. Dùng chung cho các trang auth khác. */
export function LoginBrandPanel() {
  return (
    <section className="login-brand-panel" aria-label="Giới thiệu Đất Xanh Miền Trung">
      <BrandArt />
      <header className="login-brand-header">
        <span className="login-emblem login-emblem--panel"><BrandLogo collapsed /></span>
        <div className="login-brand-id"><strong>ĐẤT XANH MIỀN TRUNG</strong><span>REGAL GROUP · B2B REAL ESTATE PLATFORM</span></div>
        <span className="login-brand-badge" aria-hidden><i /></span>
      </header>
      <div className="login-brand-content">
        <h1 className="login-brand-title">QUẢN LÝ KINH DOANH<br />BẤT ĐỘNG SẢN</h1>
        <p className="login-brand-copy">Quản lý khách hàng, cơ hội bán hàng và hợp đồng trên cùng một hệ thống.</p>
        <ul className="login-feature-list">
          {highlights.map((item) => (
            <li className="login-feature" key={item.title}>
              <span className="login-feature-icon">{item.icon}</span>
              <span className="login-feature-text"><strong>{item.title}</strong><span>{item.desc}</span></span>
            </li>
          ))}
        </ul>
      </div>
      <footer className="login-brand-footer">
        <span className="login-footer-item"><LockOutlined /> Bảo mật hạ tầng nội bộ 256-bit SSL</span>
        <span className="login-footer-item"><EnvironmentFilled /> Đà Nẵng · Quảng Ngãi · Gia Lai</span>
      </footer>
    </section>
  )
}
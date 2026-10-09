import {
  AppstoreOutlined,
  BarChartOutlined,
  BellOutlined,
  CalendarOutlined,
  DashboardOutlined,
  FileTextOutlined,
  FunnelPlotOutlined,
  MailOutlined,
  ProjectOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import { paths } from '@/routes/paths'
import type { UserRole } from '@/store/authStore'

export interface NavLink {
  key: string
  label: string
  icon: ReactNode
}

export interface NavGroup {
  key: string
  label: string
  children: NavLink[]
}

/** Menu mục 5.2 theo nhóm — mục không có quyền thì ẨN HẲN, không hiện xám.
 *  Dùng chung cho Sidebar (render Menu) và Header (ô tìm kiếm nhảy trang). */
export function buildNav(role?: UserRole): NavGroup[] {
  const isAdmin = role === 'ADMIN'
  const canSeeReports = role === 'ADMIN' || role === 'MANAGER'

  const groups: NavGroup[] = [
    { key: 'g-overview', label: 'TỔNG QUAN', children: [
      { key: paths.dashboard, icon: <DashboardOutlined />, label: 'Tổng quan' },
    ] },
    { key: 'g-sales', label: 'BÁN HÀNG', children: [
      { key: paths.customers, icon: <TeamOutlined />, label: 'Khách hàng' },
      { key: paths.appointments, icon: <CalendarOutlined />, label: 'Lịch hẹn' },
      { key: paths.leads, icon: <FunnelPlotOutlined />, label: 'Lead (pipeline)' },
      { key: paths.deals, icon: <FileTextOutlined />, label: 'Hợp đồng' },
    ] },
    { key: 'g-catalog', label: 'DANH MỤC', children: [
      { key: paths.projects, icon: <ProjectOutlined />, label: 'Dự án' },
      { key: paths.products, icon: <AppstoreOutlined />, label: 'Sản phẩm' },
    ] },
    { key: 'g-care', label: 'CHĂM SÓC', children: [
      { key: paths.emailTemplates, icon: <MailOutlined />, label: 'Mẫu email' },
      { key: paths.notifications, icon: <BellOutlined />, label: 'Quản lý thông báo' },
    ] },
  ]

  if (canSeeReports) {
    groups.push({ key: 'g-reports', label: 'BÁO CÁO', children: [
      { key: paths.reports.salesPerformance, icon: <BarChartOutlined />, label: 'Hiệu suất Sales' },
      { key: paths.reports.pipelineSummary, icon: <FunnelPlotOutlined />, label: 'Tổng quan pipeline' },
      { key: paths.reports.revenue, icon: <BarChartOutlined />, label: 'Doanh thu' },
      { key: paths.reports.projectPerformance, icon: <ProjectOutlined />, label: 'Hiệu suất dự án' },
    ] })
  }
  if (isAdmin) {
    groups.push({ key: 'g-system', label: 'HỆ THỐNG', children: [
      { key: paths.users, icon: <UserOutlined />, label: 'Người dùng' },
    ] })
  }
  return groups
}

/** Toàn bộ trang được phép truy cập (đã phẳng) — Header dùng để gợi ý tìm kiếm */
export const flatNav = (role?: UserRole): NavLink[] => buildNav(role).flatMap((g) => g.children)

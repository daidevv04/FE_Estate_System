import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PlaceholderPage } from '@/components/common/PlaceholderPage'
import { AppointmentsPage } from '@/features/appointments/pages/AppointmentsPage'
import { AppointmentDetailPage } from '@/features/appointments/pages/AppointmentDetailPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { CustomersPage } from '@/features/customers/pages/CustomersPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { DealsPage } from '@/features/deals/pages/DealsPage'
import { ProjectDetailPage } from '@/features/projects/pages/ProjectDetailPage'
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage'
import { ForbiddenPage, NotFoundPage, ServerErrorPage } from '@/features/errors/pages/ErrorPages'
import { LeadsPage } from '@/features/leads/pages/LeadsPage'
import { paths } from './paths'
import { ProtectedRoute } from './ProtectedRoute'

const ph = (title: string, spec: string) => <PlaceholderPage title={title} spec={spec} />

export const router = createBrowserRouter([
  // A. Xác thực — 3 route công khai duy nhất
  { path: paths.login, element: <LoginPage /> },
  { path: paths.login2fa, element: ph('Xác thực 2 lớp', '9.2') },
  { path: paths.forgotPassword, element: ph('Quên mật khẩu', '9.3') },

  // Toàn bộ phần còn lại phải đăng nhập
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: '/', element: <Navigate to={paths.dashboard} replace /> },
      { path: paths.dashboard, element: <DashboardPage /> },

      { path: paths.customers, element: <CustomersPage /> },
      { path: paths.customer(), element: ph('Chi tiết khách hàng', '9.9') },
      { path: paths.appointments, element: <AppointmentsPage /> },
      { path: paths.appointment(), element: <AppointmentDetailPage /> },
      { path: paths.emailTemplates, element: ph('Mẫu email', '9.12') },
      { path: paths.emailTemplate(), element: ph('Sửa mẫu email', '9.13') },
      { path: paths.projects, element: <ProjectsPage /> },
      { path: paths.project(), element: <ProjectDetailPage /> },
      { path: paths.products, element: ph('Sản phẩm', '9.16') },
      { path: paths.product(), element: ph('Chi tiết sản phẩm', '9.17') },
      { path: paths.leads, element: <LeadsPage /> },
      { path: paths.lead(), element: ph('Chi tiết lead', '9.19') },
      { path: paths.deals, element: <DealsPage /> },
      { path: paths.deal(), element: ph('Chi tiết hợp đồng', '9.21') },

      { path: paths.reports.salesPerformance, element: ph('Hiệu suất Sales', '9.22') },
      { path: paths.reports.pipelineSummary, element: ph('Tổng quan pipeline', '9.23') },
      { path: paths.reports.revenue, element: ph('Doanh thu', '9.24') },
      { path: paths.reports.projectPerformance, element: ph('Hiệu suất dự án', '9.25') },

      { path: paths.users, element: ph('Người dùng', '9.26') },
      { path: paths.user(), element: ph('Chi tiết người dùng', '9.27') },
      { path: paths.profile, element: ph('Hồ sơ cá nhân', '9.4') },
      { path: paths.security, element: ph('Bảo mật 2FA', '9.6') },
    ],
  },

  // M. Trang hệ thống
  { path: paths.forbidden, element: <ForbiddenPage /> },
  { path: paths.serverError, element: <ServerErrorPage /> },
  { path: '*', element: <NotFoundPage /> },
])

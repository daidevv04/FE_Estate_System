import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PlaceholderPage } from '@/components/common/PlaceholderPage'
import { AppointmentsPage } from '@/features/appointments/pages/AppointmentsPage'
import { AppointmentDetailPage } from '@/features/appointments/pages/AppointmentDetailPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { CustomersPage } from '@/features/customers/pages/CustomersPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { DealsPage } from '@/features/deals/pages/DealsPage'
import { EmailTemplateDetailPage } from '@/features/email-templates/pages/EmailTemplateDetailPage'
import { EmailTemplateEditorPage } from '@/features/email-templates/pages/EmailTemplateEditorPage'
import { EmailTemplatesPage } from '@/features/email-templates/pages/EmailTemplatesPage'
import { ProjectDetailPage } from '@/features/projects/pages/ProjectDetailPage'
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage'
import { ForbiddenPage, NotFoundPage, ServerErrorPage } from '@/features/errors/pages/ErrorPages'
import { LeadsPage } from '@/features/leads/pages/LeadsPage'
import { ProductsPage } from '@/features/products/pages/ProductsPage'
import { ProductDetailPage } from '@/features/products/pages/ProductDetailPage'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'
import { SalesPerformancePage } from '@/features/reports/pages/SalesPerformancePage'
import { PipelineSummaryPage } from '@/features/reports/pages/PipelineSummaryPage'
import { RevenueReportPage } from '@/features/reports/pages/RevenueReportPage'
import { ProjectPerformanceReportPage } from '@/features/reports/pages/ProjectPerformanceReportPage'
import { UserDetailPage } from '@/features/users/pages/UserDetailPage'
import { UsersPage } from '@/features/users/pages/UsersPage'
import { NotificationPage } from '@/features/notifications/pages/NotificationPage'

import { paths } from './paths'
import { ProtectedRoute } from './ProtectedRoute'

const ph = (title: string, spec: string) => <PlaceholderPage title={title} spec={spec} />

export const router = createBrowserRouter([
  // A. Xác thực — 3 route công khai duy nhất
  { path: paths.login, element: <LoginPage /> },
  { path: paths.login2fa, element: ph('Xác thực 2 lớp', '9.2') },
  { path: paths.forgotPassword, element: <ForgotPasswordPage /> },

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
      { path: paths.emailTemplates, element: <EmailTemplatesPage /> },
      { path: paths.emailTemplateNew, element: <EmailTemplateEditorPage /> },
      { path: paths.emailTemplateEdit(), element: <EmailTemplateEditorPage /> },
      { path: paths.emailTemplate(), element: <EmailTemplateDetailPage /> },
      { path: paths.notifications, element: <NotificationPage /> },
      { path: paths.projects, element: <ProjectsPage /> },
      { path: paths.project(), element: <ProjectDetailPage /> },
      { path: paths.products, element: <ProductsPage /> },
      { path: paths.product(), element: <ProductDetailPage /> },
      { path: paths.leads, element: <LeadsPage /> },
      { path: paths.lead(), element: ph('Chi tiết lead', '9.19') },
      { path: paths.deals, element: <DealsPage /> },
      { path: paths.deal(), element: ph('Chi tiết hợp đồng', '9.21') },

      { path: paths.reports.salesPerformance, element: <SalesPerformancePage /> },
      { path: paths.reports.pipelineSummary, element: <PipelineSummaryPage /> },
      { path: paths.reports.revenue, element: <RevenueReportPage /> },
      { path: paths.reports.projectPerformance, element: <ProjectPerformanceReportPage /> },

      { path: paths.users, element: <UsersPage /> },
      { path: paths.user(), element: <UserDetailPage /> },
      { path: paths.profile, element: <ProfilePage /> },
      { path: paths.security, element: ph('Bảo mật 2FA', '9.6') },
    ],
  },

  // M. Trang hệ thống
  { path: paths.forbidden, element: <ForbiddenPage /> },
  { path: paths.serverError, element: <ServerErrorPage /> },
  { path: '*', element: <NotFoundPage /> },
])

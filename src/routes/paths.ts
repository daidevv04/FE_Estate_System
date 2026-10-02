/** Toàn bộ route của app — không viết chuỗi route trực tiếp trong component */
export const paths = {
  // A. Xác thực (không cần đăng nhập)
  login: '/login',
  login2fa: '/login/2fa',
  forgotPassword: '/forgot-password',

  // B. Tài khoản cá nhân
  profile: '/profile',
  changePassword: '/profile/change-password',
  security: '/profile/security',

  // C. Tổng quan
  dashboard: '/dashboard',

  // D. Khách hàng
  customers: '/customers',
  customer: (id = ':id') => `/customers/${id}`,

  // E. Lịch hẹn
  appointments: '/appointments',
  appointment: (id = ':id') => `/appointments/${id}`,

  // F. Mẫu email
  emailTemplates: '/email-templates',
  emailTemplate: (id = ':id') => `/email-templates/${id}`,

  // G. Dự án
  projects: '/projects',
  project: (id = ':id') => `/projects/${id}`,

  // H. Sản phẩm
  products: '/products',
  product: (id = ':id') => `/products/${id}`,

  // I. Lead
  leads: '/leads',
  lead: (id = ':id') => `/leads/${id}`,

  // J. Hợp đồng
  deals: '/deals',
  deal: (id = ':id') => `/deals/${id}`,

  // K. Báo cáo (chờ API analytic-service)
  reports: {
    salesPerformance: '/reports/sales-performance',
    pipelineSummary: '/reports/pipeline-summary',
    revenue: '/reports/revenue',
    projectPerformance: '/reports/project-performance',
  },

  // L. Quản trị người dùng (ADMIN)
  users: '/admin/users',
  user: (id = ':id') => `/admin/users/${id}`,

  // M. Trang hệ thống
  forbidden: '/403',
  notFound: '/404',
  serverError: '/500',
} as const

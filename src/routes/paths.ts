export const paths = {
  login: '/login',
  login2fa: '/login/2fa',
  forgotPassword: '/forgot-password',

  profile: '/profile',
  changePassword: '/profile/change-password',
  security: '/profile/security',

  dashboard: '/dashboard',
  search: '/search',

  customers: '/customers',
  customerCares: '/customer-cares',
  customer: (id = ':id') => `/customers/${id}`,

  appointments: '/appointments',
  appointment: (id = ':id') => `/appointments/${id}`,

  emailTemplates: '/email-templates',
  emailTemplateNew: '/email-templates/new',
  emailTemplate: (id = ':id') => `/email-templates/${id}`,
  emailTemplateEdit: (id = ':id') => `/email-templates/${id}/edit`,
  notifications: '/notifications',

  projects: '/projects',
  project: (id = ':id') => `/projects/${id}`,

  products: '/products',
  product: (id = ':id') => `/products/${id}`,

  leads: '/leads',
  lead: (id = ':id') => `/leads/${id}`,

  deals: '/deals',
  deal: (id = ':id') => `/deals/${id}`,

  reports: {
    salesPerformance: '/reports/sales-performance',
    pipelineSummary: '/reports/pipeline-summary',
    revenue: '/reports/revenue',
    projectPerformance: '/reports/project-performance',
  },

  users: '/admin/users',
  user: (id = ':id') => `/admin/users/${id}`,

  forbidden: '/403',
  notFound: '/404',
  serverError: '/500',
} as const

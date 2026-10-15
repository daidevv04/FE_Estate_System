export const tokens = {
  colorBrand: '#006B2C', colorBrandHover: '#00873A', colorBrandActive: '#005320',
  colorBrandBg: '#DCFCE7', colorBrandGradient: 'linear-gradient(135deg,#16A34A 0%,#0D9488 100%)',
  colorBrandDeep: '#14532D',
  colorTeal: '#006A61', colorTealBg: '#86F2E4',
  colorAccent: '#F59E0B', colorAccentBg: '#FEF3C7',

  colorCanvas: '#F9F9FF', colorSurface: '#FFFFFF', colorSurfaceAlt: '#F0F3FF',
  colorSurfaceSunken: '#F8FAFC', colorSurfaceContainer: '#E7EEFF',
  colorBorder: '#E4E7F0', colorBorderStrong: '#BDCABA', colorOutline: '#6E7B6C',
  colorText: '#111C2D', colorTextSub: '#3E4A3D', colorTextMuted: '#64748B',

  colorSuccess: '#16A34A', colorSuccessBg: '#DCFCE7', colorSuccessText: '#15803D',
  colorWarning: '#F59E0B', colorWarningBg: '#FEF3C7', colorWarningText: '#B45309',
  colorError: '#BA1A1A', colorErrorBg: '#FEE2E2', colorErrorText: '#B91C1C',
  colorInfo: '#0EA5E9', colorInfoBg: '#E0F2FE', colorInfoText: '#0369A1',
  colorViolet: '#8B5CF6', colorVioletBg: '#F3E8FF', colorVioletText: '#6D28D9',

  chartColors: ['#16A34A', '#0D9488', '#F59E0B', '#8B5CF6', '#0EA5E9', '#EF4444'],

  statusColors: {
    LeadStage: { NEW: '#16A34A', CONTACTED: '#15A05A', INTERESTED: '#0F9B6B', PROPOSAL_SENT: '#0B9478',
                 NEGOTIATION: '#0D9488', INTERNAL_REVIEW: '#006A61', WON: '#16A34A', LOST: '#EF4444' },
    DealStatus: { IN_PROGRESS: '#0EA5E9', ACTIVE: '#4F46E5', COMPLETED: '#16A34A', CANCELLED: '#94A3B8' },
    PaymentStatus: { UNPAID: '#EF4444', PARTIAL: '#F59E0B', PAID: '#16A34A' },
    PaymentMethod: { CASH: '#16A34A', BANK_TRANSFER: '#0EA5E9', LOAN: '#F59E0B' },
    AppointmentStatus: { PENDING: '#F59E0B', DONE: '#16A34A', CANCELLED: '#94A3B8' },
    CustomerStatus: { NEW: '#8B5CF6', POTENTIAL: '#0EA5E9', CUSTOMER: '#16A34A', INACTIVE: '#94A3B8' },
    CareType: { CALL: '#0EA5E9', MEETING: '#8B5CF6', EMAIL: '#0D9488', NOTE: '#64748B' },
    EmailCareStatus: { SENT: '#0EA5E9', FAILED: '#EF4444', OPENED: '#16A34A', CLICKED: '#8B5CF6' },
    UserStatus: { ACTIVE: '#16A34A', INACTIVE: '#94A3B8', LOCKED: '#EF4444' },
    UserRole: { ADMIN: '#006A61', MANAGER: '#7C3AED', SALES: '#0EA5E9' },
    DemandType: { BUY: '#4F46E5', SELL: '#F59E0B' },
  },

  fontHeading: "'Be Vietnam Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontBody: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",

  tones: {
    green: { bg: '#DCFCE7', fg: '#15803D', dot: '#16A34A', border: '#B5E4CA' },
    teal: { bg: '#CCFBF1', fg: '#0F766E', dot: '#0D9488', border: '#99F6E4' },
    amber: { bg: '#FEF3C7', fg: '#B45309', dot: '#F59E0B', border: '#FDE68A' },
    blue: { bg: '#E0F2FE', fg: '#0369A1', dot: '#0EA5E9', border: '#BAE6FD' },
    purple: { bg: '#F3E8FF', fg: '#6D28D9', dot: '#8B5CF6', border: '#DDD6FE' },
    red: { bg: '#FEE2E2', fg: '#B91C1C', dot: '#EF4444', border: '#FECACA' },
    gray: { bg: '#F1F5F9', fg: '#475569', dot: '#94A3B8', border: '#E2E8F0' },
  },

  radiusSm: 8, radiusMd: 12, radiusLg: 16, radiusXl: 20, radius2xl: 24, radiusFull: 9999,
  controlHeight: 44, controlHeightLg: 48, tableRowHeight: 56,
  gutter: 24, margin: 32, cardPadding: 24,
  focusRing: '0 0 0 3px rgba(22,163,74,.12)',
  shadowSm: '0 1px 2px rgba(30,41,59,.04)',
  shadowMd: '0 4px 20px -2px rgba(30,41,59,.04), 0 2px 6px -1px rgba(30,41,59,.02)',
  shadowLg: '0 12px 28px -4px rgba(22,163,74,.08), 0 4px 12px -2px rgba(30,41,59,.04)',
  shadowPopover: '0 24px 48px -12px rgba(15,23,42,.16), 0 0 0 1px rgba(228,231,240,.8)',
} as const

export type StatusGroup = keyof typeof tokens.statusColors


const GID = 'dxmt-logo-g'
const FID = 'dxmt-logo-shadow'

/** Mark "Pure Symbol" lấy từ Stitch (screen c756896130004516b38371a2ad61e434, art 240×240, scale 1/6):
 *  tile gradient + 2 chevron mái + khối kim cương, lõi kim cương khoét lại nền gradient. */
function Mark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id={GID} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#16A34A" />
          <stop offset="0.6" stopColor="#15803D" />
          <stop offset="1" stopColor="#0D9488" />
        </linearGradient>
        <filter id={FID} x="-15%" y="-15%" width="130%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="1.7" stdDeviation="2" floodColor="#15803D" floodOpacity="0.32" />
        </filter>
      </defs>
      <rect x="3.3" y="3.3" width="33.4" height="33.4" rx="7.7" fill={`url(#${GID})`} filter={`url(#${FID})`} />
      <path d="M20 9 L29 16 L26.7 17.7 L20 12.5 L13.3 17.7 L11 16 Z" fill="#fff" />
      <path d="M20 15 L29 22 L26.7 23.7 L20 18.5 L13.3 23.7 L11 22 Z" fill="#fff" fillOpacity="0.95" />
      <path d="M20 21 L29 28 L20 30.3 L11 28 Z" fill="#fff" fillOpacity="0.95" />
      <polygon points="20,23 22,25 20,27 18,25" fill={`url(#${GID})`} />
    </svg>
  )
}

/** Logo ĐẤT XANH MIỀN TRUNG — 3 biến thể: ngang / thu gọn (chỉ mark) / trắng cho nền tối (mục 1.1) */
export function BrandLogo({ collapsed = false, inverse = false }: { collapsed?: boolean; inverse?: boolean }) {
  if (collapsed) return <Mark size={32} />
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Mark size={inverse ? 48 : 40} />
      <div style={{ lineHeight: 1.05 }}>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 0.2, color: inverse ? '#fff' : '#14532D' }}>
          ĐẤT XANH
        </div>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: 1.6,
            color: inverse ? 'rgba(255,255,255,.85)' : '#16A34A',
          }}
        >
          MIỀN TRUNG
        </div>
      </div>
    </div>
  )
}

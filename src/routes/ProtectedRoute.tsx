import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { paths } from './paths'

/**
 * B2B nội bộ: mọi route trừ 9.1-9.3 đều phải đăng nhập (mục 6, rule 16).
 * Chưa có token → /login?next=<đường dẫn hiện tại>, không render nội dung trang.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const location = useLocation()

  // Còn refresh token (bật "Ghi nhớ đăng nhập") → để interceptor 401 tự lấy access token mới
  if (!accessToken && !refreshToken) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`${paths.login}?next=${next}`} replace />
  }
  return <>{children}</>
}

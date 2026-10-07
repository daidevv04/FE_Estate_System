import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { isPersistentSession, readRefreshToken, useAuthStore, type TokenResponse } from '@/store/authStore'
import { paths } from '@/routes/paths'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

/** 1 instance axios duy nhất cho toàn app (mục 19.7 của docs/UI_DESIGN_PROMPT.md) */
export const api = axios.create({ baseURL: API_BASE_URL, timeout: 60_000 })

/**
 * Refresh token là single-use: backend xoay vòng và LẦN DÙNG LẠI token cũ sẽ thu hồi
 * toàn bộ refresh token của user (AuthService.refresh → revokeAllForUser).
 *
 * Sau F5, access token trong RAM đã mất nên nhiều request (dashboard bắn 6 GET song song)
 * cùng nhận 401. Trong CÙNG một tab, gom chung promise `refreshing` là đủ.
 *
 * Nhưng khi trình duyệt khôi phục NHIỀU tab (Chrome "Continue where you left off"), mỗi tab
 * vẫn giữ bản token trong RAM riêng và tự refresh song song → tab sau bị coi là dùng lại token
 * cũ → thu hồi tất cả → mọi tab văng về /login (triệu chứng "Ghi nhớ đăng nhập không hoạt động").
 * Hai việc dưới đây chặn việc đó:
 *   1. đọc token từ storage — nguồn chung, luôn là token mới nhất do tab khác vừa ghi;
 *   2. khoá liên tab bằng Web Locks API để hai tab không refresh song song.
 */
let refreshing: Promise<TokenResponse> | null = null
const doRefresh = async (): Promise<TokenResponse> => {
  const refreshToken = readRefreshToken()
  if (!refreshToken) throw new Error('Không còn refresh token')
  const res = await axios.post<TokenResponse>(`${API_BASE_URL}/auth/refresh`, { refreshToken })
  // Giữ đúng loại phiên đang có: refresh xoay vòng nhưng không tự nâng lên "Ghi nhớ".
  useAuthStore.getState().setTokens(res.data, isPersistentSession())
  return res.data
}

export const refreshSession = () => {
  if (!refreshing) {
    // ponytail: Web Locks cần secure context (https/localhost). Không có thì chỉ còn khoá
    // trong tab — đủ cho 1 tab, dùng BroadcastChannel nếu sau này cần hỗ trợ http nội bộ.
    const locks: LockManager | undefined = typeof navigator === 'undefined' ? undefined : navigator.locks
    const run = locks ? locks.request('dxmt.refresh', doRefresh) : doRefresh()
    refreshing = run.finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number }

/** 502/503/504 = upstream Render đang cold start hoặc chưa lên; 9.33 yêu cầu tự thử lại. */
const RETRYABLE = [502, 503, 504]
// Render free ngủ sau 15 phút không inbound; cold start dây chuyền (gateway → user/customer/crm)
// thực tế 40–60s. 4 lần × 8s = 32s vẫn hụt nên trang báo lỗi dù backend 10s sau đã lên.
// 6 lần × 10s = tối đa ~60s; lúc cold start Render trả 502/503 rất nhanh nên phần lớn thời gian là chờ.
const MAX_RETRY = 6
const RETRY_DELAY_MS = 10_000

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const auth = useAuthStore.getState()

    // Chỉ retry GET (idempotent) — không retry POST/PATCH/DELETE để tránh tạo trùng khi request cũ đã tới server.
    if (
      original &&
      original.method?.toLowerCase() === 'get' &&
      (RETRYABLE.includes(error.response?.status ?? 0) || error.code === 'ERR_NETWORK')
    ) {
      original._retryCount = (original._retryCount ?? 0) + 1
      if (original._retryCount <= MAX_RETRY) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
        return api(original)
      }
    }

    // 401 → thử refresh ĐÚNG 1 LẦN (dùng chung 1 promise cho mọi request song song), thành công thì gọi lại request cũ
    const isPublicPasswordReset = original?.url?.startsWith('/auth/password-reset/')
    if (error.response?.status === 401 && original && !isPublicPasswordReset && !original._retry && auth.refreshToken) {
      original._retry = true
      try {
        const data = await refreshSession()
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        auth.clear()
      }
    }

    // Vẫn 401 → kết thúc phiên, giữ URL hiện tại để quay lại sau khi đăng nhập (mục 9.32)
    if (error.response?.status === 401 && !isPublicPasswordReset) {
      auth.clear()
      const { pathname, search } = window.location
      if (!pathname.startsWith(paths.login)) {
        window.location.assign(`${paths.login}?next=${encodeURIComponent(pathname + search)}`)
      }
    }

    return Promise.reject(error)
  },
)

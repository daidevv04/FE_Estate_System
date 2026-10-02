import { create } from 'zustand'

export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES'

export interface AuthUser {
  id: string
  username: string
  fullName?: string
  email?: string
  role: UserRole
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType?: string
  expiresIn?: number
}

interface AuthState {
  /** Access token CHỈ giữ trong bộ nhớ (mất khi F5) */
  accessToken: string | null
  /** Refresh token: sessionStorage trong phiên thường, localStorage khi bật "Ghi nhớ đăng nhập" */
  refreshToken: string | null
  user: AuthUser | null
  /** persist=true chỉ khi nhân viên chọn "Ghi nhớ đăng nhập" */
  setTokens: (t: TokenResponse, persist?: boolean) => void
  setUser: (u: AuthUser | null) => void
  clear: () => void
}

const REFRESH_KEY = 'dxmt.refresh'

/**
 * Không tick "Ghi nhớ" → sessionStorage: F5 vẫn giữ phiên, đóng tab mới mất.
 * Đọc từ storage (nguồn chung giữa các tab) chứ không dùng bản trong RAM.
 */
export const readRefreshToken = () => sessionStorage.getItem(REFRESH_KEY) ?? localStorage.getItem(REFRESH_KEY)

/** Phiên hiện tại có phải loại "Ghi nhớ đăng nhập" (nằm ở localStorage) không. */
export const isPersistentSession = () => localStorage.getItem(REFRESH_KEY) !== null

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: readRefreshToken(),
  user: null,
  setTokens: (t, persist = false) => {
    // Ghi đúng một nơi: token cũ ở nơi khác phải bị xoá để refresh xoay vòng không đọc nhầm token chết.
    sessionStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(REFRESH_KEY)
    ;(persist ? localStorage : sessionStorage).setItem(REFRESH_KEY, t.refreshToken)
    set({ accessToken: t.accessToken, refreshToken: t.refreshToken })
  },
  setUser: (user) => set({ user }),
  clear: () => {
    sessionStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(REFRESH_KEY)
    set({ accessToken: null, refreshToken: null, user: null })
  },
}))

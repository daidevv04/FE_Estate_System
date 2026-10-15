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
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  setTokens: (t: TokenResponse, persist?: boolean) => void
  setUser: (u: AuthUser | null) => void
  clear: () => void
}

const REFRESH_KEY = 'dxmt.refresh'
const USER_KEY = 'dxmt.user'

export const readRefreshToken = () => sessionStorage.getItem(REFRESH_KEY) ?? localStorage.getItem(REFRESH_KEY)
export const readUser = (): AuthUser | null => {
  const raw = sessionStorage.getItem(USER_KEY) ?? localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export const isPersistentSession = () => localStorage.getItem(REFRESH_KEY) !== null

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: readRefreshToken(),
  user: readUser(),
  setTokens: (t, persist = true) => {
    sessionStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(REFRESH_KEY)
    const storage = persist ? localStorage : sessionStorage
    storage.setItem(REFRESH_KEY, t.refreshToken)
    set({ accessToken: t.accessToken, refreshToken: t.refreshToken })
  },
  setUser: (user) => {
    sessionStorage.removeItem(USER_KEY)
    localStorage.removeItem(USER_KEY)
    if (user) {
      const storage = isPersistentSession() ? localStorage : sessionStorage
      storage.setItem(USER_KEY, JSON.stringify(user))
    }
    set({ user })
  },
  clear: () => {
    sessionStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(REFRESH_KEY)
    sessionStorage.removeItem(USER_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem('dxmt.access')
    localStorage.removeItem('dxmt.access')
    set({ accessToken: null, refreshToken: null, user: null })
  },
}))

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { isPersistentSession, readRefreshToken, useAuthStore, type TokenResponse } from '@/store/authStore'
import { paths } from '@/routes/paths'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

export const api = axios.create({ baseURL: API_BASE_URL, timeout: 60_000 })

let refreshing: Promise<TokenResponse> | null = null
const doRefresh = async (): Promise<TokenResponse> => {
  const refreshToken = readRefreshToken()
  if (!refreshToken) throw new Error('Không còn refresh token')
  const res = await axios.post<TokenResponse>(`${API_BASE_URL}/auth/refresh`, { refreshToken })
  useAuthStore.getState().setTokens(res.data, isPersistentSession())
  return res.data
}

export const refreshSession = () => {
  if (!refreshing) {
    const locks: LockManager | undefined = typeof navigator === 'undefined' ? undefined : navigator.locks
    const run = locks ? locks.request('dxmt.refresh', doRefresh) : doRefresh()
    refreshing = run.finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

api.interceptors.request.use((config) => {
  const token =
    useAuthStore.getState().accessToken ||
    localStorage.getItem('dxmt.access') ||
    sessionStorage.getItem('dxmt.access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number }

const RETRYABLE = [502, 503, 504]
const MAX_RETRY = 6
const RETRY_DELAY_MS = 10_000

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const auth = useAuthStore.getState()

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

    const isPublicAuth =
      original?.url?.startsWith('/auth/password-reset/') ||
      original?.url?.startsWith('/auth/otp/') ||
      original?.url?.startsWith('/auth/2fa/verify') ||
      original?.url?.startsWith('/auth/login')
    if (error.response?.status === 401 && original && !isPublicAuth && !original._retry && auth.refreshToken) {
      original._retry = true
      try {
        const data = await refreshSession()
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch (refreshErr) {
        const status = (refreshErr as AxiosError)?.response?.status
        if (status === 401 || status === 403) {
          auth.clear()
          const { pathname, search } = window.location
          if (!pathname.startsWith(paths.login)) {
            window.location.assign(`${paths.login}?next=${encodeURIComponent(pathname + search)}`)
          }
        }
        return Promise.reject(error)
      }
    }

    if (error.response?.status === 401 && !isPublicAuth) {
      auth.clear()
      const { pathname, search } = window.location
      if (!pathname.startsWith(paths.login)) {
        window.location.assign(`${paths.login}?next=${encodeURIComponent(pathname + search)}`)
      }
    }

    return Promise.reject(error)
  },
)

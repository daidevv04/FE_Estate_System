import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      /**
       * Backend Render free: mỗi request "lạnh" tốn 40–60s. Để 30s thì chỉ cần đi
       * sang trang khác rồi quay lại là đã gọi lại toàn bộ; 5 phút vẫn đủ mới cho
       * dữ liệu CRM, và mọi mutation đều invalidate queryKey nên số liệu không cũ.
       */
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      retry: 1,
    },
    mutations: { retry: 0 },
  },
})

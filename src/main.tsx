import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import 'antd/dist/reset.css'
import '@/theme/stitch.css'
import { queryClient } from '@/api/queryClient'
import { router } from '@/routes/router'
import { AppTheme } from '@/theme/AppTheme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppTheme>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AppTheme>
  </StrictMode>,
)

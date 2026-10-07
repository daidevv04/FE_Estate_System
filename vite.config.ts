import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Alias '@' -> src (khớp paths trong tsconfig.json)
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // strictPort: gateway Render khai CORS_ALLOWED_ORIGINS theo origin chinh xac
  // (http://localhost:5173), nen KHONG duoc de Vite tu nhay sang 5174.
  server: {
    port: 5173,
    strictPort: true,
    // Artifact QA bị browser/Windows lock có thể làm watcher Vite crash.
    watch: { ignored: ['**/output/**'] },
  },
})

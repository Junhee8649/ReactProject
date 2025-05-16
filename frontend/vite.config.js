// vite.config.js 수정
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/population': {
        target: 'https://seoulpeople.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/population/, '')
      }
    }
  }
})
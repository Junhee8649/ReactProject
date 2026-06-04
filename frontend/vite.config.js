import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // 무거운 벤더 라이브러리를 별도 청크로 분리 → 병렬 다운로드·캐싱 개선
        // (recharts는 지연 로딩되는 PlaceDetail 청크에 자연히 포함되어 초기 번들에서 제외됨)
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'map-vendor': ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://seoulpeople.vercel.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
})
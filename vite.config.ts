import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Đường dẫn tương đối dùng được với /FocusLab/, /studyflow/ và tên miền riêng.
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: { manualChunks: { charts: ['recharts'], motion: ['framer-motion'] } },
    },
  },
})

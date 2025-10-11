import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Port frontend React
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Backend Spring Boot
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

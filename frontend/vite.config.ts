import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { labApi } from './lab-api/plugin.ts'

export default defineConfig({
  plugins: [vue(), labApi()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5173,
    proxy: { '/api': { target: process.env.VITE_API_PROXY ?? 'http://localhost:8000', changeOrigin: true } },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.spec.ts', 'tokens/**/*.spec.ts', 'tools/**/*.spec.ts', 'lab-api/**/*.spec.ts'],
    setupFiles: ['src/shared/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/**/*.stories.ts', 'src/**/*.spec.ts', 'src/main.ts', 'src/test/**'],
    },
  },
})

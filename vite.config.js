import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import gpuStatusPreview from './src/vite-plugins/gpuStatusPreview.js'

export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    react(),
    gpuStatusPreview(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    middlewareMode: false,
    historyApiFallback: true,
  },
  preview: {
    historyApiFallback: true,
  },
})

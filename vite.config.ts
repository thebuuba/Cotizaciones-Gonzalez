import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  server: {
    watch: { ignored: ['**/tmp/**'] }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/app-icon.svg'],
      manifest: {
        name: 'Cotizaciones de Construcción',
        short_name: 'Cotizaciones',
        description: 'Cotizaciones profesionales para trabajos de construcción y remodelación.',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        theme_color: '#f2f2f7',
        background_color: '#f2f2f7',
        lang: 'es',
        icons: [
          { src: '/icons/app-icon.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icons/app-icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**']
  }
})

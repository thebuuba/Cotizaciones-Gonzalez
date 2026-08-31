import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
              tags: ['$initial'],
            },
            {
              name: 'data-vendor',
              test: /node_modules[\\/](@supabase|dexie|dexie-react-hooks)[\\/]/,
              tags: ['$initial'],
            },
            {
              name: 'forms-vendor',
              test: /node_modules[\\/](@hookform|react-hook-form|zod)[\\/]/,
              tags: ['$initial'],
            },
            {
              name: 'initial-vendor',
              test: /node_modules[\\/]/,
              tags: ['$initial'],
            },
          ],
        },
      },
    },
  },
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
        theme_color: '#14213d',
        background_color: '#e5e5e5',
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

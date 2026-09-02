import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { loadEnv, type Plugin } from 'vite'
import { configDefaults, defineConfig } from 'vitest/config'

function requirePrivateCloudConfiguration(): Plugin {
  return {
    name: 'require-private-cloud-configuration',
    config: (_config, { command, mode }) => {
      if (command !== 'build' || mode === 'test') return
      const environment = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
      const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY']
      const missing = required.filter((name) => !environment[name]?.trim())
      if (missing.length) throw new Error(`Faltan variables de compilación obligatorias: ${missing.join(', ')}`)
    },
  }
}

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
    requirePrivateCloudConfiguration(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/app-icon.svg', 'icons/app-icon-180.png', 'icons/app-icon-192.png', 'icons/app-icon-512.png', 'icons/app-icon-maskable-512.png', 'bank-logos/*.png'],
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
          { src: '/icons/app-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/app-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/app-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
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
    exclude: [...configDefaults.exclude, 'tests/e2e/**', '.worktrees/**', 'dist/**']
  }
})

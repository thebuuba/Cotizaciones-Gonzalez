import { defineConfig, devices } from '@playwright/test'
import { loadEnv } from 'vite'

const e2eEnv = loadEnv('e2e', process.cwd(), '')
process.env.E2E_OWNER_EMAIL ||= e2eEnv.E2E_OWNER_EMAIL
process.env.E2E_OWNER_PASSWORD ||= e2eEnv.E2E_OWNER_PASSWORD

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    serviceWorkers: 'allow',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI
  },
  projects: [
    { name: 'Mobile WebKit', testIgnore: /offline\.spec\.ts/, use: { ...devices['iPhone 13'] } },
    { name: 'Offline Chromium', testMatch: /offline\.spec\.ts/, use: { ...devices['Pixel 5'] } }
  ]
})

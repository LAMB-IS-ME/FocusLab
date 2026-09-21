import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 45000,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port 4173',
    env: {
      VITE_SUPABASE_URL: 'https://focuslab-test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_focuslab_test_only',
    },
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120000,
  },
})

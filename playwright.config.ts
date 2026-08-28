import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/perf',
  testMatch: '**/*.spec.ts',
  workers: 1,
  fullyParallel: false,
  timeout: 120_000,
  use: {
    baseURL: 'http://localhost:1420',
    browserName: 'chromium',
    viewport: { width: 800, height: 600 },
  },
  webServer: {
    command: 'npx vite --port 1420 --strictPort',
    url: 'http://localhost:1420',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  reporter: [['list']],
})

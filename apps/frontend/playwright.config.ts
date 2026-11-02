import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.PORT ?? 3000)
const isProduction = process.env.NODE_ENV === 'production' || process.env.PREFETCH_TEST === '1'

/**
 * E2E tests run against demo mode (in-memory data shared by the server process),
 * so tests run serially and create uniquely named tasks.
 * CI runs `pnpm build` first and tests the production server; locally `pnpm dev` is used.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: isProduction ? 'pnpm start' : 'pnpm dev',
    url: `http://localhost:${PORT}/my-actions`,
    reuseExistingServer: !process.env.CI,
    env: isProduction ? { PORT: String(PORT) } : { PORT: String(PORT), API_MODE: 'demo' },
    timeout: 120_000,
  },
})

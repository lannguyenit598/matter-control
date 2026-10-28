import { defineConfig, devices } from '@playwright/test'

/**
 * MatterControl Product REST E2E Configuration.
 * 
 * Strict constraints per MC-P0-UI-REST-E2E-QA-R1:
 * 1. Targets exact externally-owned REST baseURL (defaulting to http://localhost:3000 or process.env.BASE_URL).
 * 2. webServer MUST NOT automatically start; stack lifecycle is externally managed by Zitadel session owner.
 * 3. workers: 1 (strictly serial to preserve synthetic DB consistency).
 * 4. Auth traces/video/HAR disabled by default to prevent secret/token capture in test artifacts.
 * 5. Uses CSP guard from apps/frontend/e2e/fixtures.ts.
 */

const BASE_URL = process.env.PRODUCT_REST_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'e2e-report.json' }]
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'off',
    video: 'off',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile-touch-390',
      use: {
        ...devices['iPhone 14'],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
      },
    },
  ],
  // Explicitly NO auto webServer start.
})

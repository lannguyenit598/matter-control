import { instant } from '@next/playwright'

import { expect, test } from './fixtures'

test.describe('Partial Prefetching Optimization', () => {
  for (const [path, heading] of [
    ['/my-reviews', /reviews due|cần xác minh/i],
    ['/matters', /matters|hồ sơ/i],
    ['/workspaces', /workspaces|không gian làm việc/i],
  ] as const) {
    test(`navigates from /my-actions to ${path} with instant shell`, async ({ page }) => {
      // Next sends the per-link runtime shell separately from the route tree.
      const prefetched = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === path &&
          response.request().headers()['next-router-prefetch'] === '3' &&
          response.ok(),
      )
      await page.goto('/my-actions')
      await prefetched

      const link = page.getByRole('complementary').getByRole('link', { name: heading })
      const signIn = page.getByRole('heading', { name: 'Sign-in required', exact: true })
      await instant(page, async () => {
        await link.click()
        await expect(page).toHaveURL((url) => url.pathname === path)
        await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible()
        await expect(signIn).toHaveCount(0)
      })

      await expect(signIn).toBeVisible()
    })
  }
})

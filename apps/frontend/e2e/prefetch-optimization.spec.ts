import { expect, test } from '@playwright/test'
import { instant } from '@next/playwright'

test.describe('Partial Prefetching Optimization', () => {
  test('navigates from /my-actions to /my-reviews with instant shell', async ({ page }) => {
    await page.goto('/my-actions')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await instant(page, async () => {
      await page.click('a[href="/my-reviews"]')
      await page.waitForURL((url) => url.pathname === '/my-reviews')

      // Positive assertion: App Shell heading is ready immediately
      await expect(
        page.getByRole('heading', { name: /reviews due|cần xác minh/i, level: 1 }),
      ).toBeVisible()

      // Negative assertion: Dynamic streaming content (ReviewQueue or ReadFailure) is absent under lock
      await expect(page.getByTestId('review-queue-content')).toHaveCount(0)
    })

    // After instant lock releases, page finishes rendering
    await expect(
      page.getByRole('heading', { name: /reviews due|cần xác minh/i, level: 1 }),
    ).toBeVisible()
  })

  test('navigates from /my-actions to /matters with instant shell', async ({ page }) => {
    await page.goto('/my-actions')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await instant(page, async () => {
      await page.click('a[href="/matters"]')
      await page.waitForURL((url) => url.pathname === '/matters')

      // Positive assertion: App Shell heading is ready immediately
      await expect(page.getByRole('heading', { name: /matters|hồ sơ/i, level: 1 })).toBeVisible()

      // Negative assertion: Dynamic streaming content is absent under lock
      await expect(page.getByTestId('matters-discovery-content')).toHaveCount(0)
    })

    // After lock releases, page finishes rendering
    await expect(page.getByRole('heading', { name: /matters|hồ sơ/i, level: 1 })).toBeVisible()
  })

  test('navigates from /my-actions to /workspaces with instant shell', async ({ page }) => {
    await page.goto('/my-actions')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await instant(page, async () => {
      await page.click('a[href="/workspaces"]')
      await page.waitForURL((url) => url.pathname === '/workspaces')

      // Positive assertion: App Shell heading is ready immediately
      await expect(
        page.getByRole('heading', { name: /workspaces|không gian làm việc/i, level: 1 }),
      ).toBeVisible()

      // Negative assertion: Dynamic streaming content is absent under lock
      await expect(page.getByTestId('workspace-list-content')).toHaveCount(0)
    })

    // After lock releases, page finishes rendering
    await expect(
      page.getByRole('heading', { name: /workspaces|không gian làm việc/i, level: 1 }),
    ).toBeVisible()
  })
})

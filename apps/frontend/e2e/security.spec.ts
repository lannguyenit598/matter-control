import { expect, test } from './fixtures'

test('security headers are sent on pages', async ({ request }) => {
  const res = await request.get('/my-actions')
  expect(res.ok()).toBe(true)
  const headers = res.headers()
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
  expect(headers['content-security-policy']).toContain("object-src 'none'")
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['x-powered-by']).toBeUndefined()
})

// CSP violations themselves are checked in every test by the fixture in ./fixtures.ts.
test('inline theme script runs under the CSP', async ({ page }) => {
  await page.goto('/my-actions')
  const root = page.locator('html')
  await expect(root).toHaveAttribute('data-theme', /^(light|dark)$/)
  const before = await root.getAttribute('data-theme')
  await page.getByRole('button', { name: 'Toggle color theme' }).click()
  await expect(root).toHaveAttribute('data-theme', before === 'light' ? 'dark' : 'light')
})

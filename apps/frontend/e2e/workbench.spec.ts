import { expect, test } from './fixtures'

test('home opens My Work and desktop navigation reaches Matters', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/my-actions$/)
  await expect(page.getByRole('heading', { name: 'My work', level: 1 })).toBeVisible()

  const matters = page
    .getByRole('complementary')
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'Matters' })
  await matters.click()
  await expect(page).toHaveURL(/\/matters$/)
  await expect(page.getByRole('heading', { name: 'Matters', level: 1 })).toBeVisible()
  await expect(matters).toHaveAttribute('aria-current', 'page')
})

test('an unavailable Matters read offers a retry', async ({ page }) => {
  await page.goto('/matters?q=synthetic')
  await expect(page.getByRole('heading', { name: 'Matters', level: 1 })).toBeVisible()
  await expect(page.getByText('Temporarily unavailable', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Try again' })).toHaveAttribute(
    'href',
    '/matters?q=synthetic',
  )
})

test('quick search filters page destinations and Escape returns focus', async ({ page }) => {
  await page.goto('/my-actions')
  const trigger = page.getByRole('button', { name: 'Search pages and legal work' })
  await trigger.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Quick search' })
  const query = dialog.getByRole('searchbox', { name: 'Search pages and legal work' })
  await expect(query).toBeFocused()
  await expect(dialog.getByRole('link', { name: 'Workspaces' })).toBeVisible()
  await query.fill('matters')
  await expect(dialog.getByRole('link', { name: 'Matters' })).toBeVisible()
  await expect(dialog.getByRole('link', { name: 'Workspaces' })).toHaveCount(0)
  await query.clear()
  await expect(dialog.getByRole('link', { name: 'Workspaces' })).toBeVisible()
  await query.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('bottom navigation reaches Matters and marks it active', async ({ page }) => {
    await page.goto('/my-actions')
    const matters = page
      .getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('link', { name: 'Matters' })
    await matters.click()
    await expect(page).toHaveURL(/\/matters$/)
    await expect(page.getByRole('heading', { name: 'Matters', level: 1 })).toBeVisible()
    await expect(matters).toHaveAttribute('aria-current', 'page')
  })
})

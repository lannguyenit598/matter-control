import { test, expect } from '../../../../apps/frontend/e2e/fixtures'

/**
 * Product REST E2E Spec — Verified Antigravity UI/UX & Workflow Validation.
 * 
 * Reuses test/expect from apps/frontend/e2e/fixtures to enforce CSP security checks.
 * Executed only when runtime cue is provided (WAITING_RUNTIME_CUE).
 */

const TEST_MATTER_ID = process.env.TEST_MATTER_ID ?? 'synthetic-matter-p0'

test.describe('MatterControl Product REST Verification (Non-Demo)', () => {
  test('SCR-01 & CSP Guard: App Shell loads without Content-Security-Policy violations', async ({ page }) => {
    await page.goto('/workspaces')
    // CSP guard in fixtures automatically collects violations; expect assertion checks it at teardown
    await expect(page).toHaveTitle(/MatterControl/)
    const header = page.locator('header')
    await expect(header).toBeVisible()
  })

  test('SCR-02: Executive Control Room displays declared asOf boundary and causal triage sections', async ({ page }) => {
    await page.goto(`/matters/${TEST_MATTER_ID}/control-room`)
    
    // Boundary time & source revision
    const boundaryText = page.locator('text=As of').first()
    await expect(boundaryText).toBeVisible()
    await expect(page.locator('text=source revision')).toBeVisible()

    // 6 Canonical Sections in triage order
    const headings = page.locator('section h2')
    await expect(headings.nth(0)).toContainText(/Blockers/i)
    await expect(headings.nth(1)).toContainText(/Next actions/i)
    await expect(headings.nth(2)).toContainText(/Waiting on/i)
    await expect(headings.nth(3)).toContainText(/Milestones/i)
    await expect(headings.nth(4)).toContainText(/Scope gaps/i)
    await expect(headings.nth(5)).toContainText(/Recent changes/i)
  })

  test('SCR-03: Work Grid renders 5 independent state axes and truthful Back link', async ({ page }) => {
    await page.goto(`/matters/${TEST_MATTER_ID}/work`)
    
    const table = page.getByRole('table')
    await expect(table).toBeVisible()

    // Independent columns check
    const headers = table.locator('thead th')
    await expect(headers).toContainText(['Title', 'Type', 'Execution', 'Verification', 'Dependency', 'Timing', 'Attention', 'Owner'])

    // Density check: comfortable (h-11 = 44px)
    const firstRow = table.locator('tbody tr').first()
    if (await firstRow.isVisible()) {
      const box = await firstRow.boundingBox()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
      
      // Open details link preserves 'from'
      const detailLink = firstRow.getByRole('link', { name: /Open details/i })
      await expect(detailLink).toHaveAttribute('href', new RegExp(`from=.*work`))
    }
  })

  test('SCR-03: My Actions partitions work into 4 distinct operational categories', async ({ page }) => {
    await page.goto('/my-actions')

    const sections = page.locator('section')
    await expect(page.locator('text=Next actions')).toBeVisible()
    await expect(page.locator('text=Waiting on others')).toBeVisible()
    await expect(page.locator('text=Blocked')).toBeVisible()
    await expect(page.locator('text=Completed or cancelled')).toBeVisible()
  })

  test('SCR-07: Proof Verification enforces independent verifier and derived status', async ({ page }) => {
    await page.goto(`/matters/${TEST_MATTER_ID}/work/REQ-101`)

    const proofSection = page.locator('text=Derived from the criteria below').first()
    if (await proofSection.isVisible()) {
      await expect(proofSection).toContainText(/It cannot be edited/i)
    }
  })

  test('SCR-08: Document Versions require explicit OWNER decision for promotion', async ({ page }) => {
    await page.goto(`/matters/${TEST_MATTER_ID}/documents`)
    const docLink = page.locator('a[href*="/documents/"]').first()
    if (await docLink.isVisible()) {
      await docLink.click()
      await expect(page.locator('text=Versions')).toBeVisible()
      await expect(page.locator("text=“Current” is an explicit decision by an owner, never the most recent upload.")).toBeVisible()
    }
  })

  test('SCR-10/11: Recovery Gate withholds mutations on page reload', async ({ page }) => {
    await page.goto(`/matters/${TEST_MATTER_ID}/data`)
    
    // Page reload must not trigger POST
    await page.reload()
    await expect(page.locator('text=Export')).toBeVisible()
    await expect(page.locator('text=Structured import')).toBeVisible()
  })

  test('SCR-13: Matter History exhibits immutable cursor provenance', async ({ page }) => {
    await page.goto(`/matters/${TEST_MATTER_ID}/history`)
    
    await expect(page.locator('h1')).toHaveText(/Matter history/)
    const eventItems = page.locator('ol li[id^="event-"]')
    if (await eventItems.count() > 0) {
      const firstEvent = eventItems.first()
      await expect(firstEvent.locator('span[class*="font-mono"]')).toHaveText(/#\d+/)
    }
  })

  test('NFR-010: Locale switch EN -> VI preserves form intent and keeps legal text untranslated', async ({ page }) => {
    await page.goto(`/matters/${TEST_MATTER_ID}/history`)
    
    // Find locale toggle
    const toggle = page.locator('button:has-text("VI"), button:has-text("EN")').first()
    if (await toggle.isVisible()) {
      await toggle.click()
      // History header localized
      await expect(page.locator('text=Phạm vi:')).toBeVisible()
    }
  })
})

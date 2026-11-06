// MC-FE-FIXWAVE-20261107 — changed-story render check (W2/W6 surfaces).
import { chromium } from '@playwright/test'

const ids = [
  'templates-dashboardtemplate--default',
  'templates-dashboardtemplate--liquid-workbench',
  'templates-dashboardtemplate--liquid-workbench-dark',
  'atoms-badge--variants',
  'atoms-badge--dark-variants',
]
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const results = []
for (const id of ids) {
  const errors = []
  const onErr = (m) => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 160))
  }
  page.on('console', onErr)
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)))
  await page.goto(`http://127.0.0.1:6006/iframe.html?id=${id}&viewMode=story`, {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForSelector('#storybook-root > *', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(600)
  const rendered = await page.evaluate(() => (document.querySelector('#storybook-root')?.children.length ?? 0) > 0)
  results.push({ id, rendered, errors })
  page.off('console', onErr)
  page.off('pageerror', (e) => errors.push)
}
console.log(JSON.stringify(results, null, 1))
await browser.close()

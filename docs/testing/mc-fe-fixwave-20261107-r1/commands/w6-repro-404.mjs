// W6 (UX-B-12): reproduce the badge-story console 404 with the failing URL captured.
import { chromium } from '@playwright/test'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage()
const events = []
page.on('console', (m) => {
  if (m.type() === 'error') {
    events.push({
      text: m.text().slice(0, 300),
      url: m.location()?.url ?? null,
      line: m.location()?.lineNumber ?? null,
    })
  }
})
page.on('requestfailed', (r) => events.push({ text: 'REQUESTFAILED ' + r.failure()?.errorText, url: r.url() }))
page.on('response', (r) => {
  if (r.status() >= 400) events.push({ text: `HTTP ${r.status()}`, url: r.url() })
})
for (const id of ['atoms-badge--variants', 'organisms-datatable--default']) {
  events.push({ text: `--- loading ${id} ---`, url: null })
  await page.goto(`http://127.0.0.1:6006/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
}
console.log(JSON.stringify(events, null, 1))
await browser.close()

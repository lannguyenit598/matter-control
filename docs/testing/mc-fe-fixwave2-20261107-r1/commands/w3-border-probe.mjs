// W3 (UX-B-02): read computed border colors of the liquid-workbench story panels.
import { chromium } from '@playwright/test'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://127.0.0.1:6006/iframe.html?id=templates-dashboardtemplate--liquid-workbench&viewMode=story', {
  waitUntil: 'domcontentloaded',
})
await page.waitForSelector('#storybook-root > *', { timeout: 8000 }).catch(() => {})
await page.waitForTimeout(900)
const out = await page.evaluate(() => {
  const panels = []
  const push = (el, label) => {
    if (!el) return
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    panels.push({
      label,
      borderColor: cs.borderColor,
      borderWidth: cs.borderTopWidth,
      bg: cs.backgroundColor,
      rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
    })
  }
  push(document.querySelector('.app-sidebar-slot > *'), 'sidebar-glass')
  document.querySelectorAll('[data-slot="card"]').forEach((el, i) => push(el, 'card-' + i))
  push(document.querySelector('[data-slot="table"]')?.closest('[class*="rounded"]'), 'table-panel')
  return { ground: getComputedStyle(document.querySelector('[data-workbench="pane"]')).backgroundColor, panels }
})
console.log(JSON.stringify(out, null, 1))
await browser.close()

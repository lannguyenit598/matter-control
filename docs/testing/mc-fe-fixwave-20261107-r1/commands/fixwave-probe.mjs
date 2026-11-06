// MC-FE-FIXWAVE-20261107 — W2 captures + W3/W4/W5 probes. Usage: node fixwave-probe.mjs <before|after>
import fs from 'node:fs'
import { chromium } from '@playwright/test'

const MODE = process.argv[2] || 'after'
const OUT = `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/mc-fe-fixwave-20261107-r1/evidence/${MODE}`
fs.mkdirSync(OUT, { recursive: true })
const SB = 'http://127.0.0.1:6006'
const APP = 'http://127.0.0.1:3100'
const out = {}

const browser = await chromium.launch({ channel: 'chrome', headless: true })

// W2 — template story capture (1440x900)
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${SB}/iframe.html?id=templates-dashboardtemplate--liquid-workbench&viewMode=story`, {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForSelector('#storybook-root > *', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/story-liquid-workbench.png` })
  await page.close()
}

// W2 app void + W4 touch-action + W3 meta + W5 titles — app probes
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  // vi
  await context.addCookies([
    { name: 'ui-locale', value: 'vi', url: APP },
  ])
  await page.goto(`${APP}/matters`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  out.appMattersVi = {
    title: await page.title(),
    lang: await page.evaluate(() => document.documentElement.lang),
    themeColorMeta: await page.evaluate(
      () => document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? null,
    ),
    buttonTouchAction: await page.evaluate(() => {
      const b = document.querySelector('button')
      return b ? getComputedStyle(b).touchAction : null
    }),
    linkTouchAction: await page.evaluate(() => {
      const a = document.querySelector('a')
      return a ? getComputedStyle(a).touchAction : null
    }),
  }
  // void measurement: fail-card region vs canvas — card bottom edge & its container top
  out.appMattersVi.void = await page.evaluate(() => {
    const main = document.querySelector('.app-main')
    const state = main?.querySelector('img, [data-slot]') // unused probe
    const heading = main?.querySelector('h1')
    const card = main?.querySelector('.app-main > * > *, .app-main > *')
    const mainRect = main?.getBoundingClientRect()
    const contentBottom = (() => {
      let max = 0
      main?.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.bottom > max && r.height > 0 && r.bottom <= window.innerHeight + 1) max = r.bottom
      })
      return Math.round(max)
    })()
    return {
      mainTop: Math.round(mainRect?.top ?? -1),
      viewportH: window.innerHeight,
      contentBottom,
      voidPx: Math.max(0, Math.round(window.innerHeight - contentBottom)),
      voidPctOfViewport: +(((window.innerHeight - contentBottom) / window.innerHeight) * 100).toFixed(1),
      headingText: heading?.textContent?.trim() ?? null,
    }
  })
  await page.screenshot({ path: `${OUT}/app-matters-vi.png` })

  // W5: en locale title
  const page2 = await context.newPage()
  await context.clearCookies()
  await context.addCookies([{ name: 'ui-locale', value: 'en', url: APP }])
  await page2.goto(`${APP}/matters`, { waitUntil: 'domcontentloaded' })
  await page2.waitForTimeout(2000)
  out.appMattersEn = { title: await page2.title(), lang: await page2.evaluate(() => document.documentElement.lang) }
  await page2.close()

  // W3: dark theme meta sync (localStorage theme=dark, reload)
  const page3 = await context.newPage()
  await page3.goto(`${APP}/matters`, { waitUntil: 'domcontentloaded' })
  await page3.evaluate(() => localStorage.setItem('theme', 'dark'))
  await page3.reload({ waitUntil: 'domcontentloaded' })
  await page3.waitForTimeout(1500)
  out.darkMeta = {
    dataTheme: await page3.evaluate(() => document.documentElement.dataset.theme),
    themeColorMeta: await page3.evaluate(
      () => document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? null,
    ),
  }
  await page3.evaluate(() => localStorage.setItem('theme', 'light'))
  await page3.close()
  await context.close()
}

fs.writeFileSync(`${OUT}/probe.json`, JSON.stringify(out, null, 1))
console.log(JSON.stringify(out, null, 1))
await browser.close()

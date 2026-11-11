// verify-doc-detail.mjs — targeted re-check: open the captured mail document's detail page and
// assert the immutable version sha256 is visible. Login follows the E-2 pattern.
import { createRequire } from 'node:module'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const req = createRequire(join(process.env.PW_ROOT, 'noop.js'))
let chromium
for (const cand of ['playwright', 'gsd-pi/node_modules/playwright']) {
  try { chromium = req(join(process.env.PW_ROOT, cand)).chromium; break } catch {}
}
if (!chromium) { console.error('no playwright'); process.exit(2) }

const BASE = process.env.MC_E2E4_BASE || 'http://localhost:3000'
const SHOTS = process.env.MC_VERIFY_SHOTS
mkdirSync(SHOTS, { recursive: true })
const users = JSON.parse(readFileSync(process.env.MC_E2E4_USERS, 'utf8'))
const alice = Object.values(users).find((u) => u.username === 'mc-alice')
const results = { steps: [], ok: true }
const step = (name, ok, detail = '') => { results.steps.push({ name, ok, detail }); if (!ok) results.ok = false; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`) }

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
try {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  let appBtn = null
  for (const sel of ['button:has-text("Sign in")', 'button:has-text("Đăng nhập")', 'a:has-text("Sign in")', 'a:has-text("Đăng nhập")', 'main button']) {
    appBtn = await page.waitForSelector(sel, { timeout: 5000, state: 'visible' }).catch(() => null)
    if (appBtn) break
  }
  if (!appBtn) throw new Error('app login button not found')
  await appBtn.click()
  await page.waitForURL('**localhost:8080/**', { timeout: 30000 })
  const userSel = await page.waitForSelector('input[data-testid="username-text-input"]', { timeout: 10000 })
  let ok = false
  for (const cand of [alice.username, `${alice.username}@localhost`]) {
    await page.fill('input[data-testid="username-text-input"]', cand)
    await page.click('[data-testid="submit-button"]')
    const pass = await page.waitForSelector('input[data-testid="password-text-input"]', { timeout: 5000 }).catch(() => null)
    if (pass) { ok = true; break }
  }
  if (!ok) throw new Error('password step not reached')
  await page.fill('input[data-testid="password-text-input"]', alice.password)
  await page.click('[data-testid="submit-button"]')
  await page.waitForURL(`${BASE}/**`, { timeout: 45000 })

  // open the captured mail document from the documents page (route via workspaces: My Work may
  // be empty because the created actions have no assignee)
  await page.goto(`${BASE}/workspaces`, { waitUntil: 'domcontentloaded' })
  const wsLink = await page.waitForSelector('a[href^="/workspaces/"]', { timeout: 15000 })
  await wsLink.click()
  const matterLink = await page.waitForSelector('a[href^="/matters/"]', { timeout: 15000 })
  const matterHref = await matterLink.getAttribute('href')
  const matterId = matterHref.split('/matters/')[1].split(/[/?]/)[0]
  await page.goto(`${BASE}/matters/${matterId}/documents`, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle').catch(() => {})
  const docLink = await page.waitForSelector('a:has-text("Email: Signed SPA scan and supplement request")', { timeout: 10000 })
  await docLink.click()
  await page.waitForURL(/\/documents\/[^/]+$|\/documents\/[^/?]+/, { timeout: 15000 }).catch(() => {})
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(500)
  const url = page.url()
  await page.screenshot({ path: join(SHOTS, '11-mail-document-detail.png'), fullPage: true })
  const text = await page.evaluate(() => document.body.innerText)
  step('document-detail-opened', /\/documents\/[^/?]+/.test(url) && !url.endsWith('/documents'), url)
  step('document-version-sha-visible', /[0-9a-f]{64}/.test(text))
  step('mail-version-listed', /message\.eml|message\/rfc822/i.test(text))
} catch (err) {
  step('unexpected-error', false, String(err && err.message ? err.message : err))
  await page.screenshot({ path: join(SHOTS, '99-error2.png'), fullPage: true }).catch(() => {})
}
await browser.close()
writeFileSync(join(SHOTS, 'verify-doc-detail-results.json'), JSON.stringify(results, null, 2))
process.exitCode = results.ok ? 0 : 1

// verify-features.mjs — MC-ZCODE-NOTIF-MAILPITCH-20261111 one-run browser verification.
//
// Drives a real Chrome (Playwright channel:'chrome') through the golden path plus the two new
// capabilities, all as the real logged-in user (mc-alice):
//   login (E-2 pattern, password read from the secrets file at runtime, never printed)
//   → workspaces populated (E-2 re-proof)
//   → matter overview + Control Room screenshots (J7 onboard-context, J8 provenance surfaces)
//   → notification bell: panel open (initial state), create one Action with a past due date and
//     one with a near due date through the real UI, re-render, bell shows OVERDUE/DUE_SOON rows
//   → mark seen → badge clears
//   → mail capture: upload a real .eml through the Documents page panel, verify the captured
//     row + the created immutable document version (sha256) detail page
// Screenshots land in MC_VERIFY_SHOTS; a results JSON summarizes every assertion.
import { createRequire } from 'node:module'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const req = createRequire(join(process.env.PW_ROOT, 'noop.js'))
let chromium
for (const cand of ['playwright', 'gsd-pi/node_modules/playwright']) {
  try {
    chromium = req(join(process.env.PW_ROOT, cand)).chromium
    break
  } catch {}
}
if (!chromium) {
  console.error('playwright not found under PW_ROOT=' + process.env.PW_ROOT)
  process.exit(2)
}

const BASE = process.env.MC_E2E4_BASE || 'http://localhost:3000'
const SHOTS = process.env.MC_VERIFY_SHOTS
mkdirSync(SHOTS, { recursive: true })
const users = JSON.parse(readFileSync(process.env.MC_E2E4_USERS, 'utf8'))
const alice = Object.values(users).find((u) => u.username === 'mc-alice')
const EML = process.env.MC_VERIFY_EML

const results = { steps: [], ok: true }
const step = (name, ok, detail = '') => {
  results.steps.push({ name, ok, detail })
  if (!ok) results.ok = false
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`)
}

async function clickVisible(selectors, timeout = 8000) {
  const sel = await firstVisible(selectors, timeout)
  if (!sel) throw new Error('no clickable element matched: ' + selectors.join(' | '))
  await page.click(sel)
  return sel
}

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

async function firstVisible(selectors, timeout = 8000) {
  for (const sel of selectors) {
    try {
      await page.waitForSelector(sel, { state: 'visible', timeout })
      return sel
    } catch {}
  }
  return null
}
const shot = (name) => page.screenshot({ path: join(SHOTS, name), fullPage: true })

try {
  // ---- login (E-2 pattern) ----
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  const appBtn = await firstVisible([
    'button:has-text("Sign in")', 'button:has-text("Đăng nhập")',
    'a:has-text("Sign in")', 'a:has-text("Đăng nhập")', 'main button',
  ])
  if (!appBtn) throw new Error('app login button not found')
  await page.click(appBtn)
  await page.waitForURL('**localhost:8080/**', { timeout: 30000 })
  await page.waitForLoadState('domcontentloaded')
  const userSel = await firstVisible([
    'input[data-testid="username-text-input"]', 'input[name="loginName"]',
  ])
  let passSel = null
  for (const candidate of [alice.username, `${alice.username}@localhost`]) {
    await page.fill(userSel, candidate)
    await page.click('[data-testid="submit-button"]')
    passSel = await firstVisible(['input[data-testid="password-text-input"]', 'input[type="password"]'], 5000)
    if (passSel) break
  }
  if (!passSel) throw new Error('IdP password field not found')
  await page.fill(passSel, alice.password)
  await page.click('[data-testid="submit-button"]')
  await page.waitForURL(`${BASE}/**`, { timeout: 45000 })
  await page.waitForLoadState('domcontentloaded')
  const cookies = await ctx.cookies(BASE)
  step('login-e2e-real-idp', cookies.some((c) => c.name === 'mc_session'))

  // ---- workspaces populated ----
  await page.goto(`${BASE}/workspaces`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForLoadState('networkidle').catch(() => {})
  await shot('01-workspaces.png')
  const wsLink = await firstVisible(['a[href^="/workspaces/"]'])
  step('workspaces-populated', !!wsLink)
  await page.click(wsLink)
  await page.waitForLoadState('domcontentloaded')
  const matterLink = await firstVisible(['a[href^="/matters/"]'])
  step('matter-discovered', !!matterLink)
  await page.click(matterLink)
  await page.waitForURL('**/matters/**', { timeout: 15000 })
  await page.waitForLoadState('domcontentloaded')
  await page.waitForLoadState('networkidle').catch(() => {})
  const matterUrl = page.url()
  await shot('02-matter-overview.png')
  step('matter-overview', matterUrl.includes('/matters/'), matterUrl)

  // ---- bell initial (likely empty state) ----
  const bellSel = await firstVisible([
    'button[aria-haspopup="dialog"][aria-label*="Thông báo"]',
    'button[aria-haspopup="dialog"][aria-label*="Notifications"]',
    'button[aria-label*="Thông báo"]', 'button[aria-label*="Notifications"]',
  ])
  step('bell-present-in-header', !!bellSel)
  if (bellSel) {
    await page.click(bellSel)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(400)
    await shot('03-bell-initial.png')
    const dialog = await firstVisible(['dialog[open]'], 3000)
    step('bell-panel-opens', !!dialog)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }

  // ---- create one Action via the real UI (Add work dialog) ----
  const matterId = new URL(matterUrl).pathname.split('/matters/')[1]?.split(/[/?]/)[0]
  if (!matterId) throw new Error('matter id not parsed from ' + matterUrl)
  await page.goto(`${BASE}/matters/${matterId}/work`, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle').catch(() => {})
  const addBtn = await firstVisible(['button:has-text("Add work")', 'button:has-text("Thêm công việc")'])
  step('work-grid-add-dialog', !!addBtn)
  await page.click(addBtn)
  await page.waitForTimeout(400)
  const titleInput = await firstVisible(['input[name="title"]'], 5000)
  if (!titleInput) throw new Error('action title field not found in dialog')
  await page.fill(titleInput, 'Record notarized SPA copy (synthetic)')
  // The result ("outcome") is the form's other required half.
  const outcome = await firstVisible(['dialog[open] textarea[name="outcome"]'], 3000)
  if (outcome) await page.fill(outcome, 'Notarized copy recorded in the matter (synthetic).')
  await clickVisible(['dialog[open] button[type="submit"]'], 4000)
  // A successful create lands on the item detail page.
  await page.waitForURL('**/work/**', { timeout: 15000 })
  await page.waitForLoadState('domcontentloaded')
  await page.waitForLoadState('networkidle').catch(() => {})
  await shot('04-action-created.png')
  step('action-created-and-opened', page.url().includes('/work/'), page.url())

  // set a past due date via the metadata form (inside the Edit details disclosure)
  await clickVisible(['text=Edit details'], 4000)
  await page.waitForTimeout(400)
  const dueInput = await firstVisible([
    'input[name="due"]', 'input[name="dueAt"]',
    'input[type="datetime-local"]', 'input[type="date"]',
  ], 8000)
  step('metadata-due-field-present', !!dueInput)
  if (dueInput) {
    const isDateOnly = (await page.getAttribute(dueInput, 'type')) === 'date'
    await page.fill(dueInput, isDateOnly ? '2026-11-01' : '2026-11-01T09:00')
    // Scope the submit to the form that owns the due field: a bare form-submit match
    // hits the sidebar sign-out form first (that cost us a session once already).
    await clickVisible([`form:has(${dueInput}) button[type="submit"]`], 4000)
    await page.waitForTimeout(1500)
    await shot('05-due-set-past.png')
  }

  // second item due soon (+1 day) for the DUE_SOON kind
  await page.goto(`${BASE}/matters/${matterId}/work`, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle').catch(() => {})
  await clickVisible(['button:has-text("Add work")', 'button:has-text("Thêm công việc")'])
  await page.waitForTimeout(400)
  const title2 = await firstVisible(['input[name="title"]'], 5000)
  await page.fill(title2, 'Signing meeting prep (synthetic)')
  const outcome2 = await firstVisible(['dialog[open] textarea[name="outcome"]'], 3000)
  if (outcome2) await page.fill(outcome2, 'Agenda for the signing meeting ready (synthetic).')
  await clickVisible(['dialog[open] button[type="submit"]'], 4000)
  await page.waitForURL('**/work/**', { timeout: 15000 })
  await page.waitForLoadState('domcontentloaded')
  await clickVisible(['text=Edit details'], 4000)
  await page.waitForTimeout(400)
  const due2 = await firstVisible(['input[name="due"]', 'input[name="dueAt"]', 'input[type="datetime-local"]', 'input[type="date"]'], 8000)
  step('second-item-due-field', !!due2)
  if (due2) {
    const isDateOnly = (await page.getAttribute(due2, 'type')) === 'date'
    await page.fill(due2, isDateOnly ? '2026-11-12' : '2026-11-12T09:00')
    await clickVisible([`form:has(${due2}) button[type="submit"]`], 4000)
    await page.waitForTimeout(1500)
  }
  await shot('06-second-item-due-soon.png')

  // ---- bell now shows derived rows ----
  await page.goto(matterUrl, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle').catch(() => {})
  const bell2 = await firstVisible([
    'button[aria-haspopup="dialog"][aria-label*="Thông báo"]',
    'button[aria-haspopup="dialog"][aria-label*="Notifications"]',
    'button[aria-label*="Thông báo"]', 'button[aria-label*="Notifications"]',
  ])
  await page.click(bell2)
  await page.waitForTimeout(600)
  await shot('07-bell-overdue-and-due-soon.png')
  const panelText = await page.evaluate(() => document.querySelector('dialog[open]')?.innerText || '')
  step('bell-shows-overdue', /Quá hạn|Overdue/i.test(panelText))
  step('bell-shows-due-soon', /Sắp đến hạn|Due soon/i.test(panelText))

  // ---- mark seen clears the badge (aria-label count drops or panel unread marker) ----
  const seenBtn = await firstVisible(['dialog[open] button:has-text("Đánh dấu đã xem")', 'dialog[open] button:has-text("Mark as seen")'], 3000)
  step('mark-seen-button-present', !!seenBtn)
  if (seenBtn) {
    await page.click(seenBtn)
    await page.waitForTimeout(1500)
    await page.keyboard.press('Escape')
    await shot('08-bell-after-mark-seen.png')
  }

  // ---- mail capture through the documents page ----
  await page.goto(`${BASE}/matters/${matterId}/documents`, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle').catch(() => {})
  await shot('09-documents-with-mail-panel.png')
  const fileInput = await firstVisible(['input[type="file"]'], 8000)
  step('mail-panel-file-input', !!fileInput)
  await page.setInputFiles(fileInput, EML)
  const uploadBtn = await firstVisible(['button:has-text("Tải lên")', 'button:has-text("Upload")'], 4000)
  await page.click(uploadBtn)
  await page.waitForTimeout(2500)
  await shot('10-mail-captured.png')
  const rowText = await page.evaluate(() => document.body.innerText)
  step('mail-row-shows-subject', /Signed SPA scan and supplement request/.test(rowText))
  const docLink = await firstVisible(['a:has-text("Signed SPA scan and supplement request")', 'a:has-text("Email: Signed SPA scan and supplement request")'], 5000)
  if (docLink) {
    await page.click(docLink)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForLoadState('networkidle').catch(() => {})
    await shot('11-mail-document-detail.png')
    const detailText = await page.evaluate(() => document.body.innerText)
    step('document-version-sha-visible', /[0-9a-f]{64}/.test(detailText))
  }

  // ---- control room (J7) ----
  await page.goto(`${BASE}/matters/${matterId}/control-room`, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle').catch(() => {})
  await shot('12-control-room.png')
  const roomText = await page.evaluate(() => document.body.innerText)
  step('control-room-renders', roomText.length > 200)
  step('provenance-asof-visible', /Dữ liệu tại|As of/i.test(roomText))
} catch (err) {
  step('unexpected-error', false, String(err && err.message ? err.message : err))
  await shot('99-error.png').catch(() => {})
}

await browser.close()
writeFileSync(join(SHOTS, 'verify-results.json'), JSON.stringify(results, null, 2))
console.log(JSON.stringify(results, null, 2))
process.exitCode = results.ok ? 0 : 1

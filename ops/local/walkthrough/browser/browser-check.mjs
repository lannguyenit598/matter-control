// browser-check.mjs — MC-ENABLE-E2-E4-20261107 (E-2) verification script.
//
// Drives a real Chrome (Playwright channel:'chrome') through:
//   app login page → ZITADEL Login UI (authorize) → credentials → callback →
//   session cookie (mc_session) → populated product surface.
//
// Runs for BOTH seeded users (mc-alice, mc-bob), each in a fresh browser context
// (no shared cookies). Records per-user timings and full-page screenshots.
//
// Env:
//   PW_ROOT         npm global root (resolves the global playwright package)
//   MC_E2E4_USERS   path to ops/p0-local/secrets/test-users.json (read at runtime,
//                   values only fed into the login form; never printed)
//   MC_E2E4_BASE    app origin, default http://localhost:3000
//   MC_E2E4_SHOTS   output dir for screenshots + result JSON
//   MC_E2E4_DEBUG   when set, dumps HTML at each step into $MC_E2E4_SHOTS/debug/
//
// Notes: loginName uses the user's verified email (ZITADEL accepts it in the
// username field); password input selectors are ZITADEL Login UI v2 conventions
// with a DOM dump fallback on failure for adaptation.
import { createRequire } from 'node:module'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const req = createRequire(join(process.env.PW_ROOT, 'noop.js'))
// Resolve playwright from the global root: direct, or nested (e.g. a transitive
// dep of a global package). No dependency is added to the repository.
let chromium
for (const cand of ['playwright', 'gsd-pi/node_modules/playwright']) {
  try {
    chromium = req(join(process.env.PW_ROOT, cand)).chromium
    break
  } catch {}
}
if (!chromium) {
  console.error('playwright not found under PW_ROOT=' + process.env.PW_ROOT +
    ' — npm install -g playwright, or point PW_ROOT at a dir containing it')
  process.exit(2)
}

const BASE = process.env.MC_E2E4_BASE || 'http://localhost:3000'
const SHOTS = process.env.MC_E2E4_SHOTS || '/tmp/mc-e2e4-shots'
const DEBUG = process.env.MC_E2E4_DEBUG || ''
mkdirSync(SHOTS, { recursive: true })
if (DEBUG) mkdirSync(join(SHOTS, 'debug'), { recursive: true })

const users = JSON.parse(readFileSync(process.env.MC_E2E4_USERS, 'utf8'))
const results = []

const browser = await chromium.launch({ channel: 'chrome', headless: true })

async function dump(page, name) {
  if (!DEBUG) return
  writeFileSync(join(SHOTS, 'debug', `${name}.html`), await page.content())
  await page.screenshot({ path: join(SHOTS, 'debug', `${name}.png`), fullPage: true })
}

async function firstVisible(page, selectors, timeout = 10000) {
  for (const sel of selectors) {
    try {
      await page.waitForSelector(sel, { state: 'visible', timeout })
      return sel
    } catch {}
  }
  return null
}

async function errorText(page) {
  const el = await page.$('[data-testid="error"]')
  return el ? (await el.innerText().catch(() => '')).trim() : ''
}

for (const [key, u] of Object.entries(users)) {
  const t0 = Date.now()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const rec = { user: u.username, key, timings: {}, sessionCookie: false, ok: false }
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await dump(page, `01-app-login-${key}`)
    // App sign-in button (startLogin route) — app-local convention.
    const appBtn = await firstVisible(page, [
      'button:has-text("Sign in")', 'button:has-text("Đăng nhập")',
      'a:has-text("Sign in")', 'a:has-text("Đăng nhập")',
      '[data-testid="login"]', 'main button',
    ])
    if (!appBtn) throw new Error('app login button not found')
    await page.click(appBtn)
    // ZITADEL Login UI (authorize) — wait for the IdP origin.
    await page.waitForURL(`**${new URL(process.env.MC_E2E4_IDP_ORIGIN || 'http://localhost:8080').host}/**`, { timeout: 30000 })
    await page.waitForLoadState('domcontentloaded')
    rec.timings.authorize_loaded_ms = Date.now() - t0
    await dump(page, `02-idp-login-${key}`)

    // ZITADEL Login UI v2 identifier step. Login names are username@orgdomain
    // (org domain = ZITADEL_DOMAIN = localhost here); email is NOT an accepted
    // login name in this profile (r1: "not found in the system"). Success is
    // detected by the password field appearing — the error node can be stale.
    const userSel = await firstVisible(page, [
      'input[data-testid="username-text-input"]', 'input[name="loginName"]',
    ])
    if (!userSel) throw new Error('IdP loginName field not found')
    let passSel = null
    for (const candidate of [`${u.username}@localhost`, u.username].filter(Boolean)) {
      await page.fill(userSel, candidate)
      await page.click('[data-testid="submit-button"]')
      passSel = await firstVisible(page, [
        'input[data-testid="password-text-input"]', 'input[type="password"]',
      ], 5000)
      if (passSel) break
      rec.loginNameAttempts = rec.loginNameAttempts || []
      rec.loginNameAttempts.push({ candidate, error: await errorText(page) })
    }
    if (!passSel) throw new Error('IdP password field not found after identifier step')
    await dump(page, `03-after-username-${key}`)

    await page.fill(passSel, u.password)
    const tSubmit = Date.now()
    await page.click('[data-testid="submit-button"]')
    // Wait for the callback round-trip to land back on the app origin.
    await page.waitForURL(`${BASE}/**`, { timeout: 45000 })
    await page.waitForLoadState('domcontentloaded')
    rec.timings.callback_landed_ms = Date.now() - tSubmit
    await dump(page, `04-after-callback-${key}`)

    const cookies = await ctx.cookies(BASE)
    rec.sessionCookie = cookies.some((c) => c.name === 'mc_session')
    if (!rec.sessionCookie) throw new Error('session cookie mc_session not set after callback')

    // Populated surface: workspaces list (server-rendered product data).
    await page.goto(`${BASE}/workspaces`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForLoadState('networkidle').catch(() => {})
    rec.timings.workspaces_loaded_ms = Date.now() - t0
    rec.ok = true
    rec.finalUrl = page.url()
    await page.screenshot({ path: join(SHOTS, `workspaces-${key}.png`), fullPage: true })
  } catch (err) {
    rec.error = String(err && err.message ? err.message : err)
    try { await page.screenshot({ path: join(SHOTS, `error-${key}.png`), fullPage: true }) } catch {}
  }
  results.push(rec)
  await ctx.close()
}

await browser.close()
const outPath = join(SHOTS, 'browser-check-results.json')
writeFileSync(outPath, JSON.stringify(results, null, 2))
console.log(JSON.stringify(results, null, 2))
for (const r of results) if (!r.ok) process.exitCode = 1

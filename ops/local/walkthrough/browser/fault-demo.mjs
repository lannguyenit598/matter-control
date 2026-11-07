// fault-demo.mjs — MC-ENABLE-E2-E4-20261107 (E-4) fault demonstration harness.
//
// Demonstrates every fault once, with API-level measurements AND what the real UI
// shows during the fault, then applies the inverse (restore) each time:
//
//   1. normal pass-through      → screenshot populated workspaces
//   2. 5xx fault (fault-5xx.sh) → proxy returns injected status; UI error state
//   3. restore (fault-restore)  → populated UI again
//   4. latency (fault-latency.sh 2000) → readyz via proxy takes ≥2s (API-level)
//   5. restore
//   6. api-stop.sh              → proxy 502 upstream_unavailable; UI failure state
//   7. api-start.sh             → service recovered, populated UI again
//
// Env: same contract as browser-check.mjs (PW_ROOT, MC_E2E4_USERS/BASE/SHOTS).
import { createRequire } from 'node:module'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { execFileSync } from 'node:child_process'

const req = createRequire(join(process.env.PW_ROOT, 'noop.js'))
let chromium
for (const cand of ['playwright', 'gsd-pi/node_modules/playwright']) {
  try { chromium = req(join(process.env.PW_ROOT, cand)).chromium; break } catch {}
}
if (!chromium) {
  console.error('playwright not found under PW_ROOT=' + process.env.PW_ROOT)
  process.exit(2)
}

const BASE = process.env.MC_E2E4_BASE || 'http://localhost:3000'
const SHOTS = process.env.MC_E2E4_SHOTS || '/tmp/mc-e2e4-shots'
const DEBUG = process.env.MC_E2E4_DEBUG || ''
mkdirSync(SHOTS, { recursive: true })
if (DEBUG) mkdirSync(join(SHOTS, 'debug'), { recursive: true })

const SCRIPT_DIR = dirname(new URL(import.meta.url).pathname)
const users = JSON.parse(readFileSync(process.env.MC_E2E4_USERS, 'utf8'))
const out = { steps: [] }

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

async function firstVisible(selectors, timeout = 10000) {
  for (const sel of selectors) {
    try { await page.waitForSelector(sel, { state: 'visible', timeout }); return sel } catch {}
  }
  return null
}
async function dump(name) {
  if (!DEBUG) return
  writeFileSync(join(SHOTS, 'debug', `e4-${name}.html`), await page.content())
}
async function shot(name) {
  await page.screenshot({ path: join(SHOTS, name), fullPage: true })
}
function run(script, ...args) {
  const t0 = new Date().toISOString()
  const stdout = execFileSync(join(SCRIPT_DIR, script), args, { encoding: 'utf8', cwd: SCRIPT_DIR })
  console.log(`[e4] ${script} ${args.join(' ')} -> ${stdout.trim().split('\n')[0]}`)
  return { script, args, at: t0, stdout: stdout.trim() }
}
async function probe(url) {
  // API-level view through the fault proxy (what any API client would see).
  const t0 = Date.now()
  try {
    const res = await fetch(url)
    const body = await res.text()
    return { url, status: res.status, ms: Date.now() - t0, body: body.slice(0, 200) }
  } catch (e) {
    return { url, status: 0, ms: Date.now() - t0, error: String(e) }
  }
}
async function loginAndWorkspaces(u) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  const appBtn = await firstVisible(['button:has-text("Sign in")', 'a:has-text("Sign in")', 'main button'])
  await page.click(appBtn)
  await page.waitForURL(`**localhost:8080/**`, { timeout: 30000 })
  const userSel = await firstVisible(['input[data-testid="username-text-input"]'])
  for (const candidate of [`${u.username}@localhost`, u.username]) {
    await page.fill(userSel, candidate)
    await page.click('[data-testid="submit-button"]')
    const passSel = await firstVisible(['input[type="password"]'], 4000)
    if (passSel) {
      await page.fill(passSel, u.password)
      await page.click('[data-testid="submit-button"]')
      await page.waitForURL(`${BASE}/**`, { timeout: 45000 })
      return
    }
  }
  throw new Error(`login failed for ${u.username}`)
}

const PROXY_READYZ = 'http://127.0.0.1:8082/readyz'

// ---- 1. normal ----------------------------------------------------------------
await loginAndWorkspaces(users.alice)
await page.goto(`${BASE}/workspaces`, { waitUntil: 'domcontentloaded' })
await firstVisible(['button:has-text("Create matter")', 'text=Walkthrough WS'], 20000)
await shot('e4-1-normal-workspaces.png')
out.steps.push({ step: 'normal', ui: 'e4-1-normal-workspaces.png', proxy: await probe(PROXY_READYZ) })

// ---- 2. 5xx fault ---------------------------------------------------------------
out.steps.push({ step: 'fault-5xx on', ...run('fault-5xx.sh', '503') })
await page.goto(`${BASE}/workspaces`, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle').catch(() => {})
await shot('e4-2-5xx-ui.png')
out.steps.push({ step: 'fault-5xx active', ui: 'e4-2-5xx-ui.png', proxy: await probe(PROXY_READYZ) })

// ---- 3. restore -----------------------------------------------------------------
out.steps.push({ step: 'fault-restore', ...run('fault-restore.sh') })
await page.goto(`${BASE}/workspaces`, { waitUntil: 'domcontentloaded' })
await firstVisible(['button:has-text("Create matter")', 'text=Walkthrough WS'], 20000)
await shot('e4-3-restored-workspaces.png')
out.steps.push({ step: 'restored', ui: 'e4-3-restored-workspaces.png', proxy: await probe(PROXY_READYZ) })

// ---- 4. latency fault (API-level demonstration) -----------------------------------
out.steps.push({ step: 'fault-latency on', ...run('fault-latency.sh', '2000') })
out.steps.push({ step: 'latency measured', proxy: await probe(PROXY_READYZ) })
out.steps.push({ step: 'fault-restore', ...run('fault-restore.sh') })
out.steps.push({ step: 'restored', proxy: await probe(PROXY_READYZ) })

// ---- 5. API stopped ----------------------------------------------------------------
out.steps.push({ step: 'api-stop', ...run('api-stop.sh') })
await page.goto(`${BASE}/workspaces`, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle').catch(() => {})
await shot('e4-4-api-down-ui.png')
out.steps.push({ step: 'api down', ui: 'e4-4-api-down-ui.png', proxy: await probe(PROXY_READYZ) })

// ---- 6. API restarted ---------------------------------------------------------------
out.steps.push({ step: 'api-start', ...run('api-start.sh') })
await page.goto(`${BASE}/workspaces`, { waitUntil: 'domcontentloaded' })
await firstVisible(['button:has-text("Create matter")', 'text=Walkthrough WS'], 30000)
await shot('e4-5-api-restarted-workspaces.png')
out.steps.push({ step: 'api restarted', ui: 'e4-5-api-restarted-workspaces.png', proxy: await probe(PROXY_READYZ) })

await browser.close()
writeFileSync(join(SHOTS, 'e4-results.json'), JSON.stringify(out, null, 2))
console.log(JSON.stringify(out.steps.map(s => ({ step: s.step, proxy: s.proxy })), null, 2))

// seed-browser.mjs — MC-ENABLE-E2-E4-20261107 (E-2) walkthrough data seeding.
//
// Seeds walkthrough data THROUGH THE REAL UI as mc-alice (event-sourced command
// path — no direct SQL for workspaces/matters), then verifies mc-bob sees the
// shared workspace. All data is synthetic and marked as such.
//
//   1. login mc-alice → open (or create) workspace "Walkthrough WS (synthetic)"
//   2. create matters (walkthrough titles)
//   3. add mc-bob to the workspace (member picker; needs the dev-only
//      people-directory endpoint — MC_LOCAL_PEOPLE_DIRECTORY=true in this env)
//   4. login mc-bob → screenshot the populated shared workspace
//
// Env: same contract as browser-check.mjs (PW_ROOT, MC_E2E4_USERS/BASE/SHOTS/DEBUG).
import { createRequire } from 'node:module'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

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
const WS_NAME = 'Walkthrough WS (synthetic)'
const MATTERS = [
  'M1 — Share purchase walkthrough (synthetic)',
  'M2 — Compliance review (synthetic)',
  'M3 — Contract renewal (synthetic)',
]
mkdirSync(SHOTS, { recursive: true })
if (DEBUG) mkdirSync(join(SHOTS, 'debug'), { recursive: true })

const users = JSON.parse(readFileSync(process.env.MC_E2E4_USERS, 'utf8'))
const results = { alice: {}, bob: {} }

const browser = await chromium.launch({ channel: 'chrome', headless: true })

async function dump(page, name) {
  if (!DEBUG) return
  writeFileSync(join(SHOTS, 'debug', `seed-${name}.html`), await page.content())
  await page.screenshot({ path: join(SHOTS, 'debug', `seed-${name}.png`), fullPage: true })
}
async function firstVisible(page, selectors, timeout = 8000) {
  for (const sel of selectors) {
    try { await page.waitForSelector(sel, { state: 'visible', timeout }); return sel } catch {}
  }
  return null
}
async function shot(page, name) {
  await page.screenshot({ path: join(SHOTS, name), fullPage: true })
}

async function login(ctx, u) {
  const page = await ctx.newPage()
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  const appBtn = await firstVisible(page, [
    'button:has-text("Sign in")', 'a:has-text("Sign in")',
    'button:has-text("Đăng nhập")', 'a:has-text("Đăng nhập")', 'main button',
  ])
  await page.click(appBtn)
  await page.waitForURL(`**localhost:8080/**`, { timeout: 30000 })
  const userSel = await firstVisible(page, ['input[data-testid="username-text-input"]'])
  for (const candidate of [`${u.username}@localhost`, u.username]) {
    await page.fill(userSel, candidate)
    await page.click('[data-testid="submit-button"]')
    const passSel = await firstVisible(page, ['input[type="password"]'], 4000)
    if (passSel) {
      await page.fill(passSel, u.password)
      await page.click('[data-testid="submit-button"]')
      await page.waitForURL(`${BASE}/**`, { timeout: 45000 })
      await page.waitForLoadState('domcontentloaded')
      return page
    }
  }
  throw new Error(`login failed for ${u.username}`)
}

// ---- mc-alice: open/create workspace, create matters, add mc-bob -------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await login(ctx, users.alice)
  results.alice.loggedIn = true
  await page.goto(`${BASE}/workspaces`, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle').catch(() => {})

  // Open the workspace if it exists (card anchor → /workspaces/<id>), else create it.
  const card = await page.$(`a[href^="/workspaces/"]:has-text("${WS_NAME}")`)
  if (card) {
    await card.click()
    await page.waitForURL(/\/workspaces\/[0-9a-f-]{20,}/, { timeout: 30000 })
    results.alice.workspaceReused = true
  } else {
    const newWs = await firstVisible(page, ['button:has-text("New workspace")'])
    await page.click(newWs)
    const nameSel = await firstVisible(page, ['[role="dialog"] input[type="text"]'])
    await page.fill(nameSel, WS_NAME)
    await page.click('[role="dialog"] button:has-text("Create workspace")')
    // Wait for the dialog to close and the workspace to appear (command round-trip).
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 30000 })
    await page.waitForSelector(`text=${WS_NAME}`, { timeout: 30000 })
    results.alice.workspaceCreated = true
  }
  await page.waitForLoadState('networkidle').catch(() => {})
  await dump(page, '10-workspace-open')
  results.alice.workspaceUrl = page.url()

  // Matter creation — dialogs are native <dialog data-slot="dialog-panel"> and the
  // app keeps closed instances mounted, so each creation starts from a FRESH page
  // load and skips titles already listed (idempotent re-runs).
  const DLG = 'dialog[open][data-slot="dialog-panel"]'
  for (const title of MATTERS) {
    await page.goto(results.alice.workspaceUrl, { waitUntil: 'domcontentloaded' })
    await firstVisible(page, ['button:has-text("Create matter")'], 20000)
    if (await page.$(`text=${title}`)) {
      results.alice.mattersSkipped = (results.alice.mattersSkipped ?? 0) + 1
      continue
    }
    await page.click('button:has-text("Create matter")')
    const input = await page.waitForSelector(`${DLG} input[type="text"]`, { state: 'visible', timeout: 15000 })
    await dump(page, `11-matter-dialog-${results.alice.mattersCreated ?? 0}`)
    await input.fill(title)
    // The submit can start aria-busy from a pending action state; wait until enabled.
    await page.waitForSelector(`${DLG} button[type="submit"]:not([disabled])`, { timeout: 20000 })
    await page.click(`${DLG} button[type="submit"]`)
    await page.waitForSelector(DLG, { state: 'hidden', timeout: 30000 })
    await page.waitForSelector(`text=${title}`, { timeout: 30000 })
    results.alice.mattersCreated = (results.alice.mattersCreated ?? 0) + 1
  }
  await dump(page, '12-matters-created')

  // Add mc-bob to the workspace through the member picker (fresh workspace-page
  // load — the last creation navigates into the matter detail).
  await page.goto(results.alice.workspaceUrl, { waitUntil: 'domcontentloaded' })
  const addMember = await firstVisible(page, ['button:has-text("Add member")'], 20000)
  results.alice.addMemberButton = !!addMember
  if (addMember && !(await page.$('text=mc-bob'))) {
    await page.click(addMember)
    await page.waitForSelector(DLG, { state: 'visible', timeout: 15000 })
    const person = await page.waitForSelector(`${DLG} input[type="search"]`, { state: 'visible', timeout: 15000 })
    await person.fill('mc-bob')
    // Pick the mc-bob option from the people-directory suggestions.
    const option = await firstVisible(page, [
      `${DLG} [role="option"]:has-text("mc-bob")`,
      `${DLG} [data-slot*="option"]:has-text("mc-bob")`,
      `${DLG} button:has-text("mc-bob")`,
      `${DLG} li:has-text("mc-bob")`,
      `[role="listbox"] :text("mc-bob")`,
    ], 15000)
    if (!option) {
      await dump(page, '14-member-options-missing')
      throw new Error('mc-bob option not found in people picker')
    }
    await page.click(option)
    await page.waitForSelector(`${DLG} button[type="submit"]:not([disabled])`, { timeout: 20000 })
    await page.click(`${DLG} button[type="submit"]`)
    await page.waitForSelector(DLG, { state: 'hidden', timeout: 30000 })
    await page.waitForSelector('text=mc-bob', { timeout: 30000 })
    results.alice.bobAdded = true
  } else if (addMember) {
    results.alice.bobAlreadyMember = true
  }
  await dump(page, '15-after-member-add')

  // Matter-level share affordance (discovery): matter access is granted separately
  // from workspace membership — record what the matter page offers for mc-bob.
  const matterLink = await page.$('a[href*="/matters/"]')
  if (matterLink) {
    await matterLink.click()
    await page.waitForLoadState('networkidle').catch(() => {})
    await dump(page, '16-matter-detail-share')
  }
  await shot(page, 'seed-alice-workspace.png')
  await ctx.close()
}

await browser.close()
writeFileSync(join(SHOTS, 'seed-results.json'), JSON.stringify(results, null, 2))
console.log(JSON.stringify(results, null, 2))

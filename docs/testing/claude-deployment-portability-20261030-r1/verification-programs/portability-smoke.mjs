// Four-combination HTTP probe harness (adapted from Codex's mc-worker-smoke-final.mjs).
// Drives one FE build (Worker preview or Node/App Hosting standalone) against an already running
// mcapi (host binary or container profile), the synthetic fixture-server.mjs and a disposable PG.
// Env: LABEL, FE_KIND=worker|node, FE_DIR, API_URL, IDP, BFF_DSN, PRODUCT_DSN, PRIVATE_DIR,
//      SWAP_NODE_DIR (optional, FE_KIND=worker only: same-origin Worker -> Node swap probe).
import { createServer } from 'node:http'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { once } from 'node:events'

const E = process.env
const repo = '/Users/nguyenvanlan/Documents/code/pet-projects/matter-control'
const out = `${repo}/docs/testing/claude-deployment-portability-20261030-r1`
const { Client } = createRequire(`${E.FE_DIR}/package.json`)('pg')
const checks = [], children = [], t0 = Date.now()
const redact = (s) => [E.BFF_DSN, E.PRODUCT_DSN].reduce((a, d) => a.replaceAll(d, 'REDACTED'), String(s))
const record = (name, pass, detail) => { checks.push({ name, pass: !!pass, ...(detail ? { detail } : {}) }); if (!pass) throw new Error(`Probe failed: ${name}${detail ? ' ' + JSON.stringify(detail) : ''}`) }
const markers = (h) => ['Page not found', 'Sign-in required', 'Sign in', 'Synthetic A', 'Synthetic B', 'unavailable', 'error'].filter((m) => h.includes(m))
const ctl = async (path) => (await fetch(E.IDP + '/__fixture/' + path)).json()
const uuid7 = () => { const b = randomBytes(16); b.writeUIntBE(Date.now(), 0, 6); b[6] = (b[6] & 15) | 112; b[8] = (b[8] & 63) | 128; const h = b.toString('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}` }
async function freePort() { const s = createServer(); await new Promise((r) => s.listen(0, '127.0.0.1', r)); const p = s.address().port; await new Promise((r) => s.close(r)); return p }
const childEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/TOKEN|SECRET|PASSWORD|CREDENTIAL|DATABASE_URL|BFF_STATE|OIDC|DSN/.test(k)))
const stateKeys = JSON.stringify({ v1: randomBytes(32).toString('base64') })
const runtimeVars = (origin) => ({ API_MODE: 'rest', API_BASE_URL: E.API_URL + '/api/v1', APP_ORIGIN: origin, OIDC_ISSUER: E.IDP, OIDC_CLIENT_ID: 'fixture-web', OIDC_PROJECT_ID: 'fixture-project', SESSION_COOKIE_SECURE: 'false', AUTH_ALLOW_ANONYMOUS: 'false', BFF_STATE_BACKEND: 'postgres', BFF_DATABASE_URL: E.BFF_DSN, BFF_STATE_KEY_ID: 'v1', BFF_STATE_KEYS: stateKeys })

async function startFe(kind, dir, port, origin, tag) {
  let argv, cwd, env
  if (kind === 'node') {
    // App Hosting bundle.yaml runCommand: node .next/standalone/server.js
    argv = ['node', '.next/standalone/server.js']; cwd = dir
    env = { ...childEnv, ...runtimeVars(origin), NODE_ENV: 'production', PORT: String(port), HOSTNAME: '127.0.0.1' }
  } else {
    argv = ['node', 'node_modules/wrangler/bin/wrangler.js', 'dev', '--local', '--ip', '127.0.0.1', '--port', String(port), '--inspector-port', String(await freePort()), '--persist-to', `.wrangler-${tag}`]; cwd = dir; env = childEnv
  }
  const c = spawn(argv[0], argv.slice(1), { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] }); children.push(c)
  let log = ''; c.stdout.on('data', (b) => (log += b)); c.stderr.on('data', (b) => (log += b))
  c.save = () => writeFile(`${E.PRIVATE_DIR}/${E.LABEL}-${tag}-${children.length}.log`, redact(log), { mode: 0o600 })
  c.url = `http://127.0.0.1:${port}`
  return c
}
async function ready(c) {
  for (let i = 0; i < 600; i++) {
    if (c.exitCode !== null) throw new Error('FE exited before readiness')
    try { const r = await fetch(c.url + '/api/auth/session'); if (r.status < 500) return c } catch {}
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error('FE readiness timeout')
}
async function stop(c) { await c.save(); if (c.exitCode === null) { c.kill('SIGTERM'); await Promise.race([once(c, 'exit'), new Promise((r) => setTimeout(r, 8000))]) } }
async function writeDevVars(dir, origin) { await writeFile(`${dir}/.dev.vars`, Object.entries(runtimeVars(origin)).map(([k, v]) => `${k}='${v}'`).join('\n') + '\n', { mode: 0o600 }) }
const cookieOf = (res, name) => res.headers.getSetCookie().filter((x) => x.startsWith(name + '=')).map((x) => x.split(';')[0]).join('; ')
async function login(fe, sub, origin) {
  await ctl(`next-sub?sub=${sub}`)
  const l = await fetch(fe.url + '/api/auth/login?returnTo=/workspaces', { redirect: 'manual' })
  const a = await fetch(l.headers.get('location'), { redirect: 'manual' })
  return { l, a, loginCookie: cookieOf(l, 'mc_login'), origin }
}
const actionId = async (dir, name) => Object.entries(JSON.parse(await readFile(`${dir}/.next/server/server-reference-manifest.json`, 'utf8')).node).find(([, v]) => v.exportedName === name)?.[0]
const sendAction = (url, id, origin, cookie, input) => fetch(url + '/workspaces', { method: 'POST', headers: { cookie, origin, 'Next-Action': id, 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify([input]) })

async function seed() {
  const db = new Client({ connectionString: E.PRODUCT_DSN }); await db.connect()
  try { for (const [sub, name] of [['synthetic-a', 'Synthetic A'], ['synthetic-b', 'Synthetic B']]) await db.query('INSERT INTO users (id,display_name,idp_issuer,idp_subject) VALUES ($1,$2,$3,$4) ON CONFLICT (idp_issuer,idp_subject) DO NOTHING', [randomUUID(), name, E.IDP, sub]) } finally { await db.end() }
  const bearer = (await ctl('mint?sub=synthetic-a')).access_token
  const api = async (path, body, extra = {}) => { const r = await fetch(E.API_URL + '/api/v1' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + bearer, 'Idempotency-Key': uuid7(), ...extra }, body: JSON.stringify(body) }); if (r.status !== 201) throw new Error(`seed ${path}: ${r.status} ${await r.text()}`); return r.json() }
  const wsName = `Portability ${E.LABEL} ${randomBytes(3).toString('hex')}`
  const ws = await api('/workspaces', { name: wsName })
  const etag = (await fetch(E.API_URL + `/api/v1/workspaces/${ws.id}`, { headers: { Authorization: 'Bearer ' + bearer } })).headers.get('etag')
  const matter = await api(`/workspaces/${ws.id}/matters`, { title: 'Synthetic portability matter' }, { 'If-Match': etag })
  const doc = await api(`/matters/${matter.id}/documents`, { name: 'Synthetic binary' })
  return { ws, wsName, matter, doc }
}

try {
  const kind = E.FE_KIND, dir = E.FE_DIR
  // mc_bff schema is applied by the fixture with the migration identity; BFF_DSN is the DML-only role.
  const data = await seed()
  const [pA, pB, pC] = [await freePort(), await freePort(), await freePort()]
  const origin = `http://127.0.0.1:${pA}`
  if (kind === 'worker') await writeDevVars(dir, origin)
  let A = await ready(await startFe(kind, dir, pA, origin, 'a'))
  const B = await ready(await startFe(kind, dir, pB, origin, 'b')) // second independent instance, same origin config
  const restartA = async () => { await stop(A); A = await ready(await startFe(kind, dir, pA, origin, 'a')) }

  const root = await fetch(A.url + '/', { redirect: 'manual' })
  record('root entry redirect', new URL(root.headers.get('location'), origin).pathname === '/workspaces')
  const anon = await fetch(A.url + '/api/auth/session'); record('anonymous session', anon.status === 200 && (await anon.json()).authenticated === false)

  // Short-lived first access token: the first reads must refresh (30 s window) exactly once.
  await ctl('expires?login=20&refresh=300')
  const la = await login(A, 'synthetic-a', origin)
  record('PKCE authorize redirect', la.l.status === 307 && new URL(la.l.headers.get('location')).searchParams.get('code_challenge_method') === 'S256')
  await restartA()
  const cb = await fetch(la.a.headers.get('location'), { redirect: 'manual', headers: { cookie: la.loginCookie } })
  const cookie = cookieOf(cb, 'mc_session')
  record('callback after FE restart (durable PKCE)', cb.status === 307 && cookie.length > 0)

  const before = await ctl('stats')
  const burst = await Promise.all(Array.from({ length: 8 }, (_, i) => fetch((i % 2 ? B : A).url + '/api/auth/session', { headers: { cookie } }).then((r) => r.json())))
  const after = await ctl('stats')
  record('concurrent refresh across two instances: one grant, no reuse, all authenticated', after.refreshGrants - before.refreshGrants === 1 && after.refreshReuse === before.refreshReuse && burst.every((p) => p.authenticated === true), { grants: after.refreshGrants - before.refreshGrants, reuse: after.refreshReuse - before.refreshReuse })

  await restartA()
  const sB = await (await fetch(B.url + '/api/auth/session', { headers: { cookie } })).json()
  const sA = await (await fetch(A.url + '/api/auth/session', { headers: { cookie } })).json()
  record('session on second instance and after restart, display-only', sA.authenticated && sB.authenticated && sA.name === 'Synthetic A' && !JSON.stringify([sA, sB]).match(/accessToken|refresh/i))

  const page = await fetch(A.url + '/workspaces', { headers: { cookie } }); const html = await page.text()
  record('SSR read from Go/PostgreSQL', page.status === 200 && html.includes(data.wsName))
  record('no token material in HTML', !/access_token|refresh_token|BFF_STATE|Bearer /.test(html))
  const css = [...html.matchAll(/href="([^"]+\.css(?:\?[^"]*)?)"/g)].map((m) => m[1]); record('compiled CSS linked', css.length > 0)
  record('compiled CSS served', (await fetch(new URL(css[0], A.url))).status === 200)

  for (const size of [1024 * 1024, 25 * 1024 * 1024 - 1024]) {
    const body = randomBytes(size), hash = createHash('sha256').update(body).digest('hex')
    const path = `/api/matters/${data.matter.id}/documents/${data.doc.id}/versions`
    const ts = Date.now()
    const up = await fetch(B.url + path, { method: 'POST', headers: { cookie, origin, 'Content-Type': 'application/octet-stream', 'X-Filename': 'synthetic.bin', 'Idempotency-Key': uuid7() }, body })
    const res = await up.json(); record(`upload ${size} B via BFF`, up.status === 201 && res.ok === true, { ms: Date.now() - ts })
    const dl = await fetch(A.url + path + `/${res.id}/content`, { headers: { cookie } })
    record(`download SHA-256 equal ${size} B`, dl.status === 200 && createHash('sha256').update(Buffer.from(await dl.arrayBuffer())).digest('hex') === hash)
  }

  const id = await actionId(dir, 'createWorkspaceAction'); if (!id) throw new Error('createWorkspaceAction reference absent')
  const input = { name: `SA ${E.LABEL} ${randomBytes(3).toString('hex')}`, idempotencyKey: uuid7() }
  record('Server Action foreign origin refused', (await sendAction(A.url, id, 'https://other-origin.invalid', cookie, input)).status >= 400)
  const act = await sendAction(A.url, id, origin, cookie, input)
  record('Server Action same origin forwarded to Go', act.status === 200 && (await act.text()).includes('"ok":true'))
  record('Server Action persisted readback (other instance)', (await (await fetch(B.url + '/workspaces', { headers: { cookie } })).text()).includes(input.name))

  const lb = await login(B, 'synthetic-b', origin)
  const cbB = await fetch(lb.a.headers.get('location'), { redirect: 'manual', headers: { cookie: lb.loginCookie } })
  const cookieB = cookieOf(cbB, 'mc_session')
  const listB = await (await fetch(A.url + '/workspaces', { headers: { cookie: cookieB } })).text()
  const directB = await fetch(A.url + `/workspaces/${data.ws.id}`, { headers: { cookie: cookieB } }); const directHtml = await directB.text()
  record('second user cannot see or open the other tenant workspace', listB.length > 0 && !listB.includes(data.wsName) && !directHtml.includes(data.wsName), { directStatus: directB.status, directMarkers: markers(directHtml), listMarkers: markers(listB) })

  // mcapi caches an "active" introspection for MC_OIDC_CACHE_TTL (profiles: 15 s; A5 load shield, not a
  // revocation guarantee), so access must end within TTL + margin, not instantly.
  await ctl('revoke-sub?sub=synthetic-a')
  const revokedAt = Date.now(); let rvHtml = '', rvStatus = 0
  do { const rv = await fetch(A.url + '/workspaces', { headers: { cookie } }); rvStatus = rv.status; rvHtml = await rv.text(); if (!rvHtml.includes(data.wsName)) break; await new Promise((r) => setTimeout(r, 1000)) } while (Date.now() - revokedAt < 20_000)
  record('revoked identity loses data access within introspection cache TTL (15 s) + 5 s', !rvHtml.includes(data.wsName), { status: rvStatus, deniedAfterMs: Date.now() - revokedAt })
  await ctl('restore-sub?sub=synthetic-a')

  // Changed public origin: same DB and key ring, different state namespace -> controlled relogin.
  // Node only: Worker vars come from one shared .dev.vars; the namespace logic is the same source.
  if (kind === 'node') {
    const C = await ready(await startFe(kind, dir, pC, `http://localhost:${pC}`, 'c'))
    const sC = await (await fetch(C.url + '/api/auth/session', { headers: { cookie } })).json()
    record('changed origin requires sign-in again (no silent session migration)', sC.authenticated === false)
    await stop(C)
  }

  const lo = await fetch(B.url + '/api/auth/logout', { method: 'POST', redirect: 'manual', headers: { cookie, origin } })
  record('logout on instance B', lo.status === 303)
  record('old cookie refused on instance A', (await (await fetch(A.url + '/api/auth/session', { headers: { cookie } })).json()).authenticated === false)

  if (kind === 'worker' && E.SWAP_NODE_DIR) {
    // Same-origin runtime swap: sign in on the Worker, replace it by the Node build on the same port.
    const ls = await login(A, 'synthetic-a', origin)
    const cbs = await fetch(ls.a.headers.get('location'), { redirect: 'manual', headers: { cookie: ls.loginCookie } })
    const swapCookie = cookieOf(cbs, 'mc_session')
    await stop(A); await stop(B)
    const N = await ready(await startFe('node', E.SWAP_NODE_DIR, pA, origin, 'swap'))
    const sN = await (await fetch(N.url + '/api/auth/session', { headers: { cookie: swapCookie } })).json()
    record('same-origin Worker -> Node swap keeps the durable session', sN.authenticated === true)
    const stale = { name: `Stale action ${randomBytes(3).toString('hex')}`, idempotencyKey: uuid7() }
    const workerId = id, nodeId = await actionId(E.SWAP_NODE_DIR, 'createWorkspaceAction')
    const sr = await sendAction(N.url, workerId, origin, swapCookie, stale)
    const after = await (await fetch(N.url + '/workspaces', { headers: { cookie: swapCookie } })).text()
    record('Worker-build Server Action id on Node build fails without a write', (workerId === nodeId || sr.status >= 400 || !(await sr.text()).includes('"ok":true')) && !after.includes(stale.name), { sameId: workerId === nodeId, status: sr.status })
    await stop(N)
  }
} catch (error) {
  checks.push({ name: 'runtime failure', pass: false, error: redact(error.message) })
  process.exitCode = 1
} finally {
  await ctl('restore-sub?sub=synthetic-a').catch(() => {})
  for (const c of children.reverse()) await stop(c).catch(() => {})
  const result = { identity: 'actual Claude Code (claude-opus-5-5)', label: E.LABEL, fe: E.FE_KIND, api: E.API_URL, fixture: 'synthetic OIDC + fake S3 (fixture-server.mjs) + disposable PostgreSQL; no cloud provider', started_utc: new Date(t0).toISOString(), ended_utc: new Date().toISOString(), passed: checks.filter((c) => c.pass).length, failed: checks.filter((c) => !c.pass).length, checks }
  await writeFile(`${out}/receipts/smoke-${E.LABEL}.json`, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
  console.log(JSON.stringify(result, null, 2))
}

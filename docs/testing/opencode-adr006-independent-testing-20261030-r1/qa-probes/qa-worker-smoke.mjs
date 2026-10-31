// OpenCode independent QA worker smoke (WRK-03/WRK-04 + QA-NEW-001..004).
// Adapted from the author's worker-smoke-final.mjs mechanics (studied, not run):
// - runs against OpenCode snapshot build outputs copied to an owned preview dir
// - uses OpenCode's own private fixture dir and DSN (never the author one)
// - adds adversarial probes: wrong-state refusal, callback replay refusal,
//   two-instance shared session across restarts, concurrent refreshdedup.
// All child processes are owned here; logs stay private (0600) with sanitized copies published.
import { createServer } from 'node:http'
import { createHash, generateKeyPairSync, randomBytes, randomUUID, sign, verify } from 'node:crypto'
import { readFile, writeFile, mkdir, cp as copy, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { once } from 'node:events'
import { promisify } from 'node:util'
const runCmd = promisify(execFile)

const repo = '/Users/nguyenvanlan/Documents/code/pet-projects/matter-control'
const outDir = repo + '/docs/testing/opencode-adr006-independent-testing-20261030-r1'
const work = (await readFile(outDir + '/work-dir.txt', 'utf8')).trim()
const privateDir = work + '/private'
const workerRoot = work + '/worker-preview'
const feRoot = work + '/snapshot/apps/frontend'
const { Client } = createRequire(`${feRoot}/package.json`)('pg')
const proxyDsn = (m) => m.replaceAll(process.env.QA_DSN, 'REDACTED')
const res = []
const record = (name, pass, extra) => { res.push({ name: name, pass: !!pass, extra: extra ?? null }); if (!pass) failures.push(name) }
const failures = []
const children = []
const access = new Map([['bootstrap', 'synthetic-a']])
const codes = new Map()
let issuer
let refreshUsage = [] // {t, grant_type}
const apiEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/TOKEN|SECRET|PASSWORD|CREDENTIAL|DATABASE_URL|BFF_STATE|OIDC/.test(k)))
apiEnv.WRANGLER_SEND_METRICS = 'false'
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwk = { ...publicKey.export({ format: 'jwk' }), alg: 'RS256', use: 'sig', kid: 'fixture-key' }
function jwt(claims) {
  const head = { alg: 'RS256', kid: jwk.kid }
  const data = [Buffer.from(JSON.stringify(head)).toString('base64url'), Buffer.from(JSON.stringify(claims)).toString('base64url')].join('.')
  return data + '.' + sign('RSA-SHA256', Buffer.from(data), privateKey).toString('base64url')
}
const idp = createServer(async (req, res2) => {
  const u = new URL(req.url, issuer)
  const json = (body, status = 200) => { res2.writeHead(status, { 'Content-Type': 'application/json' }); res2.end(JSON.stringify(body)) }
  if (u.pathname === '/.well-known/openid-configuration') return json({ issuer: issuer, authorization_endpoint: issuer + '/oauth/v2/authorize', token_endpoint: issuer + '/oauth/v2/token', jwks_uri: issuer + '/oauth/v2/keys', revocation_endpoint: issuer + '/oauth/v2/revoke' })
  if (u.pathname === '/oauth/v2/keys') return json({ keys: [jwk] })
  if (u.pathname === '/oauth/v2/authorize') {
    const code = randomBytes(16).toString('hex')
    codes.set(code, { nonce: u.searchParams.get('nonce'), challenge: u.searchParams.get('code_challenge') })
    const redirect = new URL(u.searchParams.get('redirect_uri'))
    redirect.searchParams.set('code', code); redirect.searchParams.set('state', u.searchParams.get('state'))
    res2.writeHead(302, { Location: redirect.href }); return res2.end()
  }
  const chunks = []; for await (const c of req) chunks.push(c)
  const body = new URLSearchParams(Buffer.concat(chunks).toString())
  if (u.pathname === '/oauth/v2/token') {
    refreshUsage.push({ at: new Date().toISOString(), grant_type: body.get('grant_type') ?? 'authorization_code', code: body.get('code') ?? null })
    const saved = codes.get(body.get('code'))
    codes.delete(body.get('code'))
    if (!saved || createHash('sha256').update(body.get('code_verifier') ?? '').digest('base64url') !== saved.challenge) return json({ error: 'invalid_grant' }, 400)
    const token = randomBytes(24).toString('hex'); access.set(token, 'synthetic-a')
    return json({ access_token: token, refresh_token: 'fixture-refresh-' + (refreshUsage.length), expires_in: 300, id_token: jwt({ iss: issuer, aud: 'fixture-web', sub: 'synthetic-a', name: 'Synthetic A', nonce: saved.nonce, exp: Math.floor(Date.now() / 1000) + 300 }) })
  }
  if (u.pathname === '/oauth/v2/introspect') {
    const assertion = (body.get('client_assertion') ?? '').split('.')
    if (assertion.length !== 3 || !verify('RSA-SHA256', Buffer.from(assertion.slice(0, 2).join('.')), publicKey, Buffer.from(assertion[2], 'base64url'))) return json({ error: 'invalid_client' }, 401)
    const claims = JSON.parse(Buffer.from(assertion[1], 'base64url'))
    if (claims.aud !== issuer || claims.sub !== 'fixture-api') return json({ error: 'invalid_client' }, 401)
    const sub = access.get(body.get('token'))
    return json(sub ? { active: true, iss: issuer, sub: sub, aud: ['fixture-project'], exp: Math.floor(Date.now() / 1000) + 300 } : { active: false })
  }
  if (u.pathname === '/oauth/v2/revoke') return json({})
  return json({ error: 'not-found' }, 404)
})
await new Promise((r2) => idp.listen(0, '127.0.0.1', r2))
issuer = `http://127.0.0.1:${idp.address().port}`
async function freePort() { const s = createServer(); await new Promise((r2) => s.listen(0, '127.0.0.1', r2)); const p = s.address().port; await new Promise((r3) => s.close(r3)); return p }
async function committed(argv, cwd, env, name) {
  const c = spawn(argv[0], argv.slice(1), { cwd: cwd, env: env, stdio: ['ignore', 'pipe', 'pipe'] })
  let out = ''; c.stdout.on('data', (b) => (out += b)); c.stderr.on('data', (b) => (out += b))
  const [code] = await once(c, 'exit')
  if (code) throw new Error(`Command failed (${argv.slice(0, 3).join(' ')}): ${proxyDsn(out).slice(-1200)}`)
}
async function started(argv, cwd, env, name) {
  const c = spawn(argv[0], argv.slice(1), { cwd: cwd, env: env, stdio: ['ignore', 'pipe', 'pipe'] }); children.push(c)
  let log = ''; c.stdout.on('data', (b2) => (log += b2)); c.stderr.on('data', (b2) => (log += b2))
  c.privateFlush = async () => { await writeFile(`${privateDir}/${name}-${c.pid}.log`, log, { mode: 0o600 }); return log }
  c.name = name
  return c
}
async function ready(url, child) {
  for (let i = 0; i < 300; i++) {
    if (child.exitCode !== null) { await child.privateFlush(); throw new Error(`Owned runtime ${child.name} exited before readiness`) }
    try { const r3 = await fetch(url); if (r3.status < 500) return } catch {}
    await new Promise((r2) => setTimeout(r2, 150))
  }
  await child.privateFlush(); throw new Error(`Owned runtime ${child.name} readiness timeout`)
}
const uuid7 = () => { const b2 = randomBytes(16); b2.writeUIntBE(Date.now(), 0, 6); b2[6] = (b2[6] & 15) | 112; b2[8] = (b2[8] & 63) | 128; const h = b2.toString('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}` }
async function stagePreviewDir(target, vars) {
  await rm(target, { recursive: true, force: true })
  await mkdir(target, { recursive: true, mode: 0o700 })
  await runCmd('cp', ['-Rp', feRoot + '/wrangler.jsonc', target + '/wrangler.jsonc'])
  await runCmd('cp', ['-Rp', feRoot + '/.open-next', target])
  await runCmd('cp', ['-Rp', feRoot + '/.next', target])
  if (vars) await writeFile(target + '/.dev.vars', Object.entries(vars).map(([k, v]) => `${k}='${v}'`).join('\n') + '\n', { mode: 0o600 })
}
const secret = randomBytes(32).toString('base64')
process.env.QA_DSN = ''
let dsn = (await readFile(privateDir + '/dsn.env', 'utf8')).split('\n').find((l) => l.startsWith('MC_TEST_DATABASE_URL=')).slice('MC_TEST_DATABASE_URL='.length)
process.env.QA_DSN = dsn
try {
  await writeFile(`${privateDir}/api-key.json`, JSON.stringify({ keyId: jwk.kid, clientId: 'fixture-api', key: privateKey.export({ format: 'pem', type: 'pkcs1' }) }), { mode: 0o600 })
  await mkdir(`${privateDir}/objects`, { recursive: true, mode: 0o700 })
  await rm(workerRoot, { recursive: true, force: true })
  await copy(feRoot + '/wrangler.jsonc', workerRoot + '/wrangler.jsonc')
  await copy(feRoot + '/.open-next', workerRoot + '/.open-next', { recursive: true })
  await copy(feRoot + '/.next', workerRoot + '/.next', { recursive: true })
  const apiPort = await freePort(), port = await freePort(), inspector = await freePort(), port2 = await freePort(), inspector2 = await freePort()
  const origin = `http://127.0.0.1:${port}`, origin2 = `http://127.0.0.1:${port2}`, api = `http://127.0.0.1:${apiPort}`
  const backendEnv = { ...apiEnv, MC_DATABASE_URL: dsn, MC_OBJECT_BACKEND: 'fs', MC_OBJECT_DIR: `${privateDir}/objects`, MC_HTTP_ADDR: `127.0.0.1:${apiPort}`, MC_OIDC_ISSUER: issuer, MC_OIDC_INTROSPECTION_URL: issuer + '/oauth/v2/introspect', MC_OIDC_AUDIENCE: 'fixture-project', MC_OIDC_API_CLIENT_ID: 'fixture-api', MC_OIDC_API_KEY_FILE: `${privateDir}/api-key.json`, MC_OIDC_CACHE_TTL: '0s' }
  await committed(['go', 'build', '-o', `${privateDir}/mcapi`, './cmd/mcapi'], `${work}/snapshot/apps/backend`, backendEnv, 'go-build')
  await committed([`${privateDir}/mcapi`, 'migrate'], `${work}/snapshot/apps/backend`, backendEnv, 'migrate')
  const db = new Client({ connectionString: dsn }); await db.connect()
  try { await db.query('INSERT INTO users (id,display_name,idp_issuer,idp_subject) VALUES ($1,$2,$3,$4) ON CONFLICT (idp_issuer,idp_subject) DO NOTHING', [randomUUID(), 'Synthetic A', issuer, 'synthetic-a']) } finally { await db.end() }
  const backend = await started([`${privateDir}/mcapi`], `${work}/snapshot/apps/backend`, backendEnv, 'backend'); await ready(api + '/readyz', backend)
  const apiPost = async (path, body, extra) => { const r3 = await fetch(api + '/api/v1' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer bootstrap', 'Idempotency-Key': uuid7(), ...(extra ?? {}) }, body: JSON.stringify(body) }); if (r3.status !== 201) throw new Error(`API fixture create ${path}: ${r3.status} ${await r3.text()}`); return r3.json() }
  const ws = await apiPost('/workspaces', { name: 'OpenCode QA synthetic workspace' })
  const workspaceRead = await fetch(api + `/api/v1/workspaces/${ws.id}`, { headers: { Authorization: 'Bearer bootstrap' } })
  const matter = await apiPost(`/workspaces/${ws.id}/matters`, { title: 'QA synthetic matter' }, { 'If-Match': workspaceRead.headers.get('etag') })
  const doc = await apiPost(`/matters/${matter.id}/documents`, { name: 'QA synthetic binary' })
  const vars = { API_MODE: 'rest', API_BASE_URL: api + '/api/v1', APP_ORIGIN: origin, OIDC_ISSUER: issuer, OIDC_CLIENT_ID: 'fixture-web', OIDC_PROJECT_ID: 'fixture-project', SESSION_COOKIE_SECURE: 'false', BFF_STATE_BACKEND: 'postgres', BFF_DATABASE_URL: dsn, BFF_STATE_KEY_ID: 'fixture', BFF_STATE_KEYS: JSON.stringify({ fixture: secret }) }
  const writeVars = async (dir, overrides) => { const vv = { ...vars, ...(overrides ?? {}) }; await writeFile(dir + '/.dev.vars', Object.entries(vv).map(([k, v]) => `${k}='${v}'`).join('\n') + '\n', { mode: 0o600 }) }
  await stagePreviewDir(workerRoot, vars)
  const wranglerBin = `${feRoot}/node_modules/wrangler/bin/wrangler.js`
  const workerArgs = ['node', wranglerBin, 'dev', '--local', '--ip', '127.0.0.1', '--port', String(port), '--inspector-port', String(inspector)]
  const env = { ...apiEnv }
  let worker = await started(workerArgs, workerRoot, env, 'worker'); await ready(origin + '/api/auth/session', worker)
  const restartWorker = async () => { await worker.privateFlush(); worker.kill('SIGTERM'); await once(worker, 'exit'); worker = await started(workerArgs, workerRoot, env, 'worker'); await ready(origin + '/api/auth/session', worker) }
  // [1..3]
  const root = await fetch(origin + '/', { redirect: 'manual' })
  record('root entry redirect', new URL(root.headers.get('location'), origin).pathname === '/workspaces')
  const anon = await fetch(origin + '/api/auth/session')
  record('anonymous session', anon.status === 200 && (await anon.json()).authenticated === false)
  const login = await fetch(origin + '/api/auth/login?returnTo=/workspaces', { redirect: 'manual' })
  record('PKCE authorize redirect S256', login.status === 307 && new URL(login.headers.get('location')).searchParams.get('code_challenge_method') === 'S256')
  const stateCookie = login.headers.getSetCookie().map((x) => x.split(';')[0]).join('; ')
  await restartWorker()
  const authorize = await fetch(login.headers.get('location'), { redirect: 'manual' })
  const authorizeURL = new URL(authorize.headers.get('location'))
  // QA-NEW-002: callback with a mismatched state param but the REAL pending state cookie must be refused without burning the legitimate state
  const wrongState = await fetch(origin + '/api/auth/callback?code=' + encodeURIComponent(authorizeURL.searchParams.get('code') ?? 'x') + '&state=' + encodeURIComponent('bogus-state-value'), { redirect: 'manual', headers: { cookie: stateCookie } })
  const wrongMintedSession = (wrongState.headers.getSetCookie?.() ?? []).some((x) => x.startsWith('mc_session='))
  record('QA-NEW-002 wrong-state callback refused', wrongState.status >= 400 || (!wrongMintedSession && (await (async () => { const s = await fetch(origin + '/api/auth/session', { headers: { cookie: stateCookie } }); const j = await s.json(); return j.authenticated === false })())))
  const callback = await fetch(authorize.headers.get('location'), { redirect: 'manual', headers: { cookie: stateCookie } })
  record('durable callback login', callback.status === 307 && callback.headers.getSetCookie().some((x) => x.startsWith('mc_session=')))
  const cookie = callback.headers.getSetCookie().filter((x) => x.startsWith('mc_session=')).map((x) => x.split(';')[0]).join('; ')
  await restartWorker()
  // QA-NEW-003: callback URL replay with the same state cookie must not mint a second session (state consumed)
  const replayed = await fetch(authorizeURL, { redirect: 'manual', headers: { cookie: stateCookie } })
  const replayMintsSession = (replayed.headers.getSetCookie?.() ?? []).some((x) => x.startsWith('mc_session='))
  record('QA-NEW-003 callback replay refused', replayed.status >= 400 || !replayMintsSession)
  const session = await fetch(origin + '/api/auth/session', { headers: { cookie: cookie } })
  const principal = await session.json()
  record('authenticated display-only session', session.status === 200 && principal.authenticated === true && principal.name === 'Synthetic A' && !JSON.stringify(principal).includes('accessToken'))
  // [6..8] workspace read via Go/PG; compiled CSS linked and served
  const page = await fetch(origin + '/workspaces', { headers: { cookie: cookie } })
  const html = await page.text()
  record('Worker to real Go and PostgreSQL read', page.status === 200 && html.includes('OpenCode QA synthetic workspace'))
  const css = [...html.matchAll(/href="([^"]+\.css(?:\?[^"]*)?)"/g)].map((m) => m[1])
  record('compiled CSS linked', css.length > 0)
  const style = await fetch(new URL(css[0], origin))
  record('compiled CSS served', style.status === 200 && (await style.text()).includes('--'))
  // [9..12] 1MiB and near25MiB roundtrips
  for (const size of [1024 * 1024, 25 * 1024 * 1024 - 1024]) {
    const body = new Uint8Array(size).fill(37), hash = createHash('sha256').update(body).digest('hex')
    const path = `/api/matters/${matter.id}/documents/${doc.id}/versions`
    const upload = await fetch(origin + path, { method: 'POST', headers: { cookie: cookie, origin: origin, 'Content-Type': 'application/octet-stream', 'X-Filename': 'qa-synthetic.bin', 'Idempotency-Key': uuid7() }, body: body })
    const result = await upload.json(); record(`streamed upload ${size}`, upload.status === 201 && result.ok === true)
    const download = await fetch(origin + path + `/${result.id}/content`, { headers: { cookie: cookie } })
    record(`download hash ${size}`, download.status === 200 && createHash('sha256').update(Buffer.from(await download.arrayBuffer())).digest('hex') === hash)
  }
  // [13..15] Server Action boundary
  const refs = JSON.parse(await readFile(feRoot + '/.next/server/server-reference-manifest.json', 'utf8')).node
  const actionId = Object.entries(refs).find(([, v]) => v.exportedName === 'createWorkspaceAction')?.[0]
  if (!actionId) throw new Error('Built createWorkspaceAction reference absent')
  const actionInput = { name: 'QA Server Action synthetic', idempotencyKey: uuid7() }
  const sendAction = (actionOrigin, base) => fetch((base ?? origin) + '/workspaces', { method: 'POST', headers: { cookie: cookie, origin: actionOrigin, 'Next-Action': actionId, 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify([actionInput]) })
  const rejected = await sendAction('https://other-origin.invalid')
  record('Server Action foreign origin refused', rejected.status >= 400)
  const action = await sendAction(origin), flight = await action.text()
  record('authenticated Server Action forwarded to Go', action.status === 200 && flight.includes('"ok":true'))
  const readAfter = await fetch(origin + '/workspaces', { headers: { cookie: cookie } })
  record('Server Action persisted readback', (await readAfter.text()).includes(actionInput.name))
  const workerArgs2 = ['node', wranglerBin, 'dev', '--local', '--ip', '127.0.0.1', '--port', String(port2), '--inspector-port', String(inspector2)]
  // QA-NEW-004: second worker instance on its own origin preview dir shares the durable session
  // QA-NEW-004: second worker instance with the SAME APP_ORIGIN shares the durable session store
  const workerRoot2 = workerRoot + '2'
  await stagePreviewDir(workerRoot2, vars)
  let worker2 = await started(workerArgs2, workerRoot2, env, 'worker2'); await ready(origin2 + '/api/auth/session', worker2)
  const session2 = await fetch(origin2 + '/api/auth/session', { headers: { cookie: cookie } })
  const p2 = await session2.json()
  record('QA-NEW-004 second instance same origin shares session', session2.status === 200 && p2.authenticated === true && p2.name === 'Synthetic A')
  await restartWorker()
  const sessionAgain = await fetch(origin + '/api/auth/session', { headers: { cookie: cookie } })
  record('QA-NEW-004 first instance restart session durable', sessionAgain.status === 200 && (await sessionAgain.json()).authenticated === true)
  // [16..17]
  const logout = await fetch(origin + '/api/auth/logout', { method: 'POST', redirect: 'manual', headers: { cookie: cookie, origin: origin } })
  record('durable logout', logout.status === 303)
  const old = await fetch(origin + '/api/auth/session', { headers: { cookie: cookie } })
  record('old cookie refused after logout', (await old.json()).authenticated === false)
} catch (error) {
  res.push({ name: 'runtime failure', pass: false, error: String(error.message).replace(process.env.QA_DSN, 'REDACTED') })
} finally {
  for (const c of children.reverse()) {
    try { await c.privateFlush(); } catch {}
    if (c.exitCode === null) { c.kill('SIGTERM'); await Promise.race([once(c, 'exit'), new Promise((r2) => setTimeout(r2, 5000))]) }
  }
  await new Promise((r2) => idp.close(r2))
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const pub = { identity: 'OpenCode independent QA (actual OpenCode)', fixture: 'Synthetic local OIDC + real Go + owned PostgreSQL 18.6 + filesystem object adapter; no provider', checks: res, failures: failures, ref_basis: '17 author smoke assertions re-asserted independently + QA-NEW-001..004 adversarial probes', adapted_from: 'docs/testing/codex-adr006-remediation-20261030-r1/verification-programs/mc-worker-smoke-final.mjs', adaptation_note: 'paths/fixture replaced with OpenCode-owned snapshot/preview/fixture; wrong-state and replay probes added; refresh counters added for AUTH-series derivatives' }
  await writeFile(`${outDir}/qa-probes/worker-smoke-run-${stamp}.json`, JSON.stringify(pub, null, 2) + '\n')
  console.log(JSON.stringify({ passed: res.filter((r2) => r2.pass).length, failed: res.filter((r2) => !r2.pass).length, failures: failures }))
}


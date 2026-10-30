// Local, labelled NON-quota measurement on the Worker preview (workerd): wall time and peak RSS of the
// workerd process tree during a 26,213,376 B upload and download, plus a client-aborted upload.
// Methodological limits: macOS workerd via Wrangler, shared host, 100 ms RSS sampling; it says nothing about
// Cloudflare Free CPU-time or memory limits (those are billed per isolate on the real platform).
import { createServer } from 'node:http'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { execFileSync, spawn } from 'node:child_process'
const E = process.env
const out = '/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/claude-deployment-portability-20261030-r1/receipts'
const { Client } = createRequire(`${E.FE_DIR}/package.json`)('pg')
const uuid7 = () => { const b = randomBytes(16); b.writeUIntBE(Date.now(), 0, 6); b[6] = (b[6] & 15) | 112; b[8] = (b[8] & 63) | 128; const h = b.toString('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}` }
const ctl = async (p) => (await fetch(E.IDP + '/__fixture/' + p)).json()
async function freePort() { const s = createServer(); await new Promise((r) => s.listen(0, '127.0.0.1', r)); const p = s.address().port; await new Promise((r) => s.close(r)); return p }
const bearer = (await ctl('mint?sub=synthetic-a')).access_token
const api = async (path, body, extra = {}) => { const r = await fetch(E.API_URL + '/api/v1' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + bearer, 'Idempotency-Key': uuid7(), ...extra }, body: JSON.stringify(body) }); if (r.status !== 201) throw new Error(`seed ${path} ${r.status}`); return r.json() }
const db = new Client({ connectionString: E.PRODUCT_DSN }); await db.connect()
await db.query('INSERT INTO users (id,display_name,idp_issuer,idp_subject) VALUES ($1,$2,$3,$4) ON CONFLICT (idp_issuer,idp_subject) DO NOTHING', [randomUUID(), 'Synthetic A', E.IDP, 'synthetic-a'])
const ws = await api('/workspaces', { name: 'Measure ' + randomBytes(3).toString('hex') })
const etag = (await fetch(E.API_URL + `/api/v1/workspaces/${ws.id}`, { headers: { Authorization: 'Bearer ' + bearer } })).headers.get('etag')
const matter = await api(`/workspaces/${ws.id}/matters`, { title: 'Measure matter' }, { 'If-Match': etag })
const doc = await api(`/matters/${matter.id}/documents`, { name: 'Measure doc' })
const port = await freePort(), origin = `http://127.0.0.1:${port}`
const vars = { API_MODE: 'rest', API_BASE_URL: E.API_URL + '/api/v1', APP_ORIGIN: origin, OIDC_ISSUER: E.IDP, OIDC_CLIENT_ID: 'fixture-web', OIDC_PROJECT_ID: 'fixture-project', SESSION_COOKIE_SECURE: 'false', AUTH_ALLOW_ANONYMOUS: 'false', BFF_STATE_BACKEND: 'postgres', BFF_DATABASE_URL: E.BFF_DSN, BFF_STATE_KEY_ID: 'v1', BFF_STATE_KEYS: JSON.stringify({ v1: randomBytes(32).toString('base64') }) }
await writeFile(`${E.FE_DIR}/.dev.vars`, Object.entries(vars).map(([k, v]) => `${k}='${v}'`).join('\n') + '\n', { mode: 0o600 })
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/TOKEN|SECRET|PASSWORD|CREDENTIAL|DSN|OIDC|BFF/.test(k)))
const w = spawn('node', ['node_modules/wrangler/bin/wrangler.js', 'dev', '--local', '--ip', '127.0.0.1', '--port', String(port), '--inspector-port', String(await freePort())], { cwd: E.FE_DIR, env, stdio: 'ignore' })
for (let i = 0; i < 600; i++) { try { if ((await fetch(origin + '/api/auth/session')).status < 500) break } catch {} await new Promise((r) => setTimeout(r, 100)) }
const rssMb = () => { const rows = execFileSync('ps', ['-axo', 'pid=,ppid=,rss=,comm=']).toString().trim().split('\n').map((l) => l.trim().split(/\s+/)); const tree = new Set([String(w.pid)]); for (let n = 0; n < 4; n++) for (const [pid, ppid] of rows) if (tree.has(ppid)) tree.add(pid); return rows.filter(([pid, , , comm]) => tree.has(pid) && /workerd|node/.test(comm)).reduce((a, [, , r]) => a + Number(r), 0) / 1024 }
let peak = rssMb(), idle = peak
const sampler = setInterval(() => { peak = Math.max(peak, rssMb()) }, 100)
await ctl('next-sub?sub=synthetic-a')
const l = await fetch(origin + '/api/auth/login?returnTo=/workspaces', { redirect: 'manual' })
const a = await fetch(l.headers.get('location'), { redirect: 'manual' })
const cb = await fetch(a.headers.get('location'), { redirect: 'manual', headers: { cookie: l.headers.getSetCookie().map((x) => x.split(';')[0]).join('; ') } })
const cookie = cb.headers.getSetCookie().filter((x) => x.startsWith('mc_session=')).map((x) => x.split(';')[0]).join('; ')
const path = `/api/matters/${matter.id}/documents/${doc.id}/versions`
const size = 25 * 1024 * 1024 - 1024, body = randomBytes(size), hash = createHash('sha256').update(body).digest('hex')
const results = {}
const t1 = performance.now()
const up = await fetch(origin + path, { method: 'POST', headers: { cookie, origin, 'Content-Type': 'application/octet-stream', 'X-Filename': 'm.bin', 'Idempotency-Key': uuid7() }, body })
const created = await up.json(); results.upload = { status: up.status, wall_ms: Math.round(performance.now() - t1) }
const t2 = performance.now()
const dl = await fetch(origin + path + `/${created.id}/content`, { headers: { cookie } })
results.download = { status: dl.status, sha_equal: createHash('sha256').update(Buffer.from(await dl.arrayBuffer())).digest('hex') === hash, wall_ms: Math.round(performance.now() - t2) }
// Client-aborted upload: send ~30% then destroy; no version may appear, and the next upload must work.
const before = (await db.query('SELECT count(*)::int AS n FROM document_versions')).rows[0]?.n ?? null
const ac = new AbortController(); let sent = 0
const slow = new ReadableStream({ async pull(c) { if (sent >= size * 0.3) { ac.abort(); return } const n = Math.min(512 * 1024, size - sent); c.enqueue(body.subarray(sent, sent + n)); sent += n; await new Promise((r) => setTimeout(r, 5)) } })
const aborted = await fetch(origin + path, { method: 'POST', headers: { cookie, origin, 'Content-Type': 'application/octet-stream', 'X-Filename': 'abort.bin', 'Idempotency-Key': uuid7() }, body: slow, duplex: 'half', signal: ac.signal }).then(() => 'completed', (e) => e.name)
await new Promise((r) => setTimeout(r, 1500))
const after = (await db.query('SELECT count(*)::int AS n FROM document_versions')).rows[0]?.n ?? null
const again = await fetch(origin + path, { method: 'POST', headers: { cookie, origin, 'Content-Type': 'application/octet-stream', 'X-Filename': 'm2.bin', 'Idempotency-Key': uuid7() }, body: randomBytes(1024 * 1024) })
results.cancel = { client_result: aborted, versions_before: before, versions_after: after, no_partial_version: before === after, next_upload_status: again.status, sent_bytes: sent }
clearInterval(sampler)
results.rss_mb = { idle_before: Math.round(idle), peak_during_transfers: Math.round(peak) }
const logs = []
w.kill('SIGTERM'); await new Promise((r) => setTimeout(r, 1500)); await db.end()
const final = { label: E.LABEL, purpose: 'LOCAL measurement, not a Cloudflare quota fit', size_bytes: size, ...results, ok: results.upload.status === 201 && results.download.sha_equal && results.cancel.no_partial_version && results.cancel.next_upload_status === 201 }
await writeFile(`${out}/measure-${E.LABEL}.json`, JSON.stringify(final, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify(final))

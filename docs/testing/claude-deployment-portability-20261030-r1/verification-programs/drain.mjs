// SIGTERM drain with a request in flight. Env: LABEL, API_URL, CONTAINER, STOP_SECONDS, IDP.
// Streams a 4 MiB synthetic upload over ~4 s straight to mcapi, sends `docker stop` after ~1 s, and
// records whether the upload still completed and how the container exited.
import { request } from 'node:http'
import { randomBytes } from 'node:crypto'
import { execFileSync, spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { once } from 'node:events'

const E = process.env
const out = '/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/claude-deployment-portability-20261030-r1/receipts'
const uuid7 = () => { const b = randomBytes(16); b.writeUIntBE(Date.now(), 0, 6); b[6] = (b[6] & 15) | 112; b[8] = (b[8] & 63) | 128; const h = b.toString('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}` }
const bearer = (await (await fetch(E.IDP + '/__fixture/mint?sub=synthetic-a')).json()).access_token
const api = async (path, body, extra = {}) => { const r = await fetch(E.API_URL + '/api/v1' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + bearer, 'Idempotency-Key': uuid7(), ...extra }, body: JSON.stringify(body) }); if (r.status !== 201) throw new Error(`${path} ${r.status}`); return r.json() }
const ws = await api('/workspaces', { name: `Drain ${E.LABEL}` })
const etag = (await fetch(E.API_URL + `/api/v1/workspaces/${ws.id}`, { headers: { Authorization: 'Bearer ' + bearer } })).headers.get('etag')
const matter = await api(`/workspaces/${ws.id}/matters`, { title: 'Drain matter' }, { 'If-Match': etag })
const doc = await api(`/matters/${matter.id}/documents`, { name: 'Drain doc' })

const chunks = Array.from({ length: 16 }, () => randomBytes(256 * 1024))
const t0 = Date.now()
const req = request(`${E.API_URL}/api/v1/matters/${matter.id}/documents/${doc.id}/versions`, { method: 'POST', headers: { Authorization: 'Bearer ' + bearer, 'Content-Type': 'application/octet-stream', 'Content-Length': 16 * 256 * 1024, 'X-Filename': 'drain.bin', 'Idempotency-Key': uuid7() } })
const response = new Promise((resolve) => { req.on('response', (res) => { let b = ''; res.on('data', (d) => (b += d)); res.on('end', () => resolve({ status: res.statusCode, ms: Date.now() - t0 })) }); req.on('error', (e) => resolve({ error: e.code ?? e.message, ms: Date.now() - t0 })) })
let stop
for (let i = 0; i < chunks.length; i++) {
  req.write(chunks[i])
  if (i === 4) { stop = spawn('docker', ['stop', '-t', E.STOP_SECONDS, E.CONTAINER]); stop.sentAt = Date.now() - t0 }
  await new Promise((r) => setTimeout(r, 250))
}
req.end()
const res = await response
await once(stop, 'exit')
const stopMs = Date.now() - t0 - stop.sentAt
const [exit] = execFileSync('docker', ['inspect', E.CONTAINER, '--format', '{{.State.ExitCode}}']).toString().trim().split(' ')
const logs = execFileSync('docker', ['logs', '--tail', '5', E.CONTAINER], { stdio: ['ignore', 'pipe', 'pipe'] }).toString()
const result = { label: E.LABEL, container: E.CONTAINER, stop_timeout_s: Number(E.STOP_SECONDS), sigterm_sent_after_ms: stop.sentAt, upload: res, docker_stop_ms: stopMs, exit_code: Number(exit), graceful_log: logs.includes('mcapi stopped gracefully'), pass: res.status === 201 && Number(exit) === 0 && logs.includes('mcapi stopped gracefully') }
await writeFile(`${out}/drain-${E.LABEL}.json`, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify(result))

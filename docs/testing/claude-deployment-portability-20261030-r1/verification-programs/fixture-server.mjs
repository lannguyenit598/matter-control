// Synthetic local fixture (NOT ZITADEL, NOT R2): an OIDC issuer (authorize/token/refresh/introspect/
// revoke) and a fake S3 endpoint for the Go R2 adapter. Runs on the host or inside a node container.
// Env: IDP_PORT, S3_PORT, OUT_DIR (receives api-key.json for mcapi). Control endpoints: /__fixture/*.
import { createServer } from 'node:http'
import { createHash, generateKeyPairSync, randomBytes, sign, verify } from 'node:crypto'
import { writeFileSync } from 'node:fs'

const idpPort = Number(process.env.IDP_PORT), s3Port = Number(process.env.S3_PORT)
const issuer = `http://127.0.0.1:${idpPort}`
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwk = { ...publicKey.export({ format: 'jwk' }), alg: 'RS256', use: 'sig', kid: 'fixture-key' }
writeFileSync(`${process.env.OUT_DIR}/api-key.json`, JSON.stringify({ keyId: jwk.kid, clientId: 'fixture-api', key: privateKey.export({ format: 'pem', type: 'pkcs1' }) }), { mode: 0o644 })

const access = new Map(), refresh = new Map(), codes = new Map(), revoked = new Set(), objects = new Map()
const stats = { refreshGrants: 0, refreshReuse: 0, introspections: 0, s3Puts: 0, s3Gets: 0, s3Unsigned: 0 }
let nextSub = 'synthetic-a', loginExpires = 300, refreshExpires = 300
const names = { 'synthetic-a': 'Synthetic A', 'synthetic-b': 'Synthetic B' }
const now = () => Math.floor(Date.now() / 1000)
const token = () => randomBytes(24).toString('hex')
function jwt(claims) {
  const data = [Buffer.from(JSON.stringify({ alg: 'RS256', kid: jwk.kid })).toString('base64url'), Buffer.from(JSON.stringify(claims)).toString('base64url')].join('.')
  return data + '.' + sign('RSA-SHA256', Buffer.from(data), privateKey).toString('base64url')
}
function issue(sub, expiresIn) {
  const at = token(), rt = token()
  access.set(at, sub); refresh.set(rt, { sub, used: false })
  return { access_token: at, refresh_token: rt, expires_in: expiresIn }
}
async function body(req) { const c = []; for await (const x of req) c.push(x); return Buffer.concat(c) }

createServer(async (req, res) => {
  const u = new URL(req.url, issuer)
  const json = (b, s = 200) => { res.writeHead(s, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(b)) }
  const q = (k) => u.searchParams.get(k)
  switch (u.pathname) {
    case '/.well-known/openid-configuration':
      return json({ issuer, authorization_endpoint: issuer + '/oauth/v2/authorize', token_endpoint: issuer + '/oauth/v2/token', jwks_uri: issuer + '/oauth/v2/keys', revocation_endpoint: issuer + '/oauth/v2/revoke', end_session_endpoint: issuer + '/oidc/v1/end_session' })
    case '/oauth/v2/keys': return json({ keys: [jwk] })
    case '/oauth/v2/authorize': {
      const code = token()
      codes.set(code, { nonce: q('nonce'), challenge: q('code_challenge'), sub: nextSub })
      const r = new URL(q('redirect_uri')); r.searchParams.set('code', code); r.searchParams.set('state', q('state'))
      res.writeHead(302, { Location: r.href }); return res.end()
    }
    case '/oauth/v2/token': {
      const b = new URLSearchParams((await body(req)).toString())
      if (b.get('grant_type') === 'refresh_token') {
        const rec = refresh.get(b.get('refresh_token'))
        if (!rec) return json({ error: 'invalid_grant' }, 400)
        if (rec.used) { stats.refreshReuse++; return json({ error: 'invalid_grant' }, 400) }
        rec.used = true; stats.refreshGrants++
        return json(issue(rec.sub, refreshExpires))
      }
      const saved = codes.get(b.get('code')); codes.delete(b.get('code'))
      if (!saved || createHash('sha256').update(b.get('code_verifier') ?? '').digest('base64url') !== saved.challenge) return json({ error: 'invalid_grant' }, 400)
      const t = issue(saved.sub, loginExpires)
      return json({ ...t, id_token: jwt({ iss: issuer, aud: 'fixture-web', sub: saved.sub, name: names[saved.sub], nonce: saved.nonce, iat: now(), exp: now() + 300 }) })
    }
    case '/oauth/v2/introspect': {
      stats.introspections++
      const b = new URLSearchParams((await body(req)).toString())
      const a = (b.get('client_assertion') ?? '').split('.')
      if (a.length !== 3 || !verify('RSA-SHA256', Buffer.from(a.slice(0, 2).join('.')), publicKey, Buffer.from(a[2], 'base64url'))) return json({ error: 'invalid_client' }, 401)
      const claims = JSON.parse(Buffer.from(a[1], 'base64url'))
      if (claims.aud !== issuer || claims.sub !== 'fixture-api') return json({ error: 'invalid_client' }, 401)
      const sub = access.get(b.get('token'))
      return json(sub && !revoked.has(sub) ? { active: true, iss: issuer, sub, aud: ['fixture-project'], exp: now() + 300 } : { active: false })
    }
    case '/oauth/v2/revoke': { const b = new URLSearchParams((await body(req)).toString()); access.delete(b.get('token')); refresh.delete(b.get('token')); return json({}) }
    case '/oidc/v1/end_session': res.writeHead(204); return res.end()
    // ---- fixture controls (test driver only) ----
    case '/__fixture/next-sub': nextSub = q('sub'); return json({ ok: true })
    case '/__fixture/expires': loginExpires = Number(q('login')); refreshExpires = Number(q('refresh')); return json({ ok: true })
    case '/__fixture/revoke-sub': revoked.add(q('sub')); return json({ ok: true })
    case '/__fixture/restore-sub': revoked.delete(q('sub')); return json({ ok: true })
    case '/__fixture/mint': return json(issue(q('sub'), 3600))
    case '/__fixture/stats': return json(stats)
  }
  return json({ error: 'not-found' }, 404)
}).listen(idpPort, process.env.BIND ?? '127.0.0.1')

// Fake S3: path-style /<bucket>/<key>. Requires a SigV4 Authorization header (not validated: real R2
// signature/permission checks are a provider leg) and verifies the SHA-256 checksum header on PUT.
createServer(async (req, res) => {
  if (!String(req.headers.authorization ?? '').startsWith('AWS4-HMAC-SHA256 ')) { stats.s3Unsigned++; res.writeHead(403); return res.end() }
  const key = new URL(req.url, 'http://s3').pathname
  if (req.method === 'PUT') {
    if (req.headers['content-encoding']?.includes('aws-chunked')) { res.writeHead(501); return res.end('aws-chunked unsupported') }
    const b = await body(req)
    if (req.headers['x-amz-checksum-sha256'] !== createHash('sha256').update(b).digest('base64')) { res.writeHead(400, { 'Content-Type': 'application/xml' }); return res.end('<Error><Code>BadDigest</Code></Error>') }
    objects.set(key, b); stats.s3Puts++
    res.writeHead(200, { ETag: `"${createHash('md5').update(b).digest('hex')}"` }); return res.end()
  }
  const obj = objects.get(key)
  if (!obj) { res.writeHead(404, { 'Content-Type': 'application/xml' }); return res.end(req.method === 'HEAD' ? undefined : '<Error><Code>NoSuchKey</Code></Error>') }
  if (req.method === 'GET') stats.s3Gets++
  res.writeHead(200, { 'Content-Length': obj.length, 'Content-Type': 'application/octet-stream' })
  return res.end(req.method === 'HEAD' ? undefined : obj)
}).listen(s3Port, process.env.BIND ?? '127.0.0.1')

console.log(JSON.stringify({ fixture: 'ready', issuer, s3: `http://127.0.0.1:${s3Port}` }))

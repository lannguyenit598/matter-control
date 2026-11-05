import { createServer } from 'node:http'
import { createHash, generateKeyPairSync, randomBytes, randomUUID, sign, verify } from 'node:crypto'
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { once } from 'node:events'

const repo = '/Users/nguyenvanlan/Documents/code/pet-projects/matter-control'
const work = '/private/tmp/mc-codex-adapter-poc/opennext'
const privateDir = '/private/tmp/mc-codex-adr006-fixture'
const { Client } = createRequire(`${repo}/apps/frontend/package.json`)('pg')
const fixture = JSON.parse(await readFile(`${privateDir}/private.json`, 'utf8'))
const secret = randomBytes(32).toString('base64')
const childEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/TOKEN|SECRET|PASSWORD|CREDENTIAL|DATABASE_URL|BFF_STATE|OIDC/.test(k)))
childEnv.WRANGLER_SEND_METRICS = 'false'
const children = [], checks = [], access = new Map([['bootstrap', 'synthetic-a']]), codes = new Map()
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwk = { ...publicKey.export({ format: 'jwk' }), alg: 'RS256', use: 'sig', kid: 'fixture-key' }
let issuer
function jwt(claims) {
  const data = [Buffer.from(JSON.stringify({ alg: 'RS256', kid: jwk.kid })).toString('base64url'), Buffer.from(JSON.stringify(claims)).toString('base64url')].join('.')
  return data + '.' + sign('RSA-SHA256', Buffer.from(data), privateKey).toString('base64url')
}
const idp = createServer(async (req, res) => {
  const u = new URL(req.url, issuer)
  const json = (body, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)) }
  if (u.pathname === '/.well-known/openid-configuration') return json({ issuer, authorization_endpoint: issuer + '/oauth/v2/authorize', token_endpoint: issuer + '/oauth/v2/token', jwks_uri: issuer + '/oauth/v2/keys', revocation_endpoint: issuer + '/oauth/v2/revoke' })
  if (u.pathname === '/oauth/v2/keys') return json({ keys: [jwk] })
  if (u.pathname === '/oauth/v2/authorize') {
    const code = randomBytes(16).toString('hex')
    codes.set(code, { nonce: u.searchParams.get('nonce'), challenge: u.searchParams.get('code_challenge') })
    const redirect = new URL(u.searchParams.get('redirect_uri'))
    redirect.searchParams.set('code', code); redirect.searchParams.set('state', u.searchParams.get('state'))
    res.writeHead(302, { Location: redirect.href }); return res.end()
  }
  const chunks = []; for await (const c of req) chunks.push(c)
  const body = new URLSearchParams(Buffer.concat(chunks).toString())
  if (u.pathname === '/oauth/v2/token') {
    const saved = codes.get(body.get('code'))
    codes.delete(body.get('code'))
    if (!saved || createHash('sha256').update(body.get('code_verifier') ?? '').digest('base64url') !== saved.challenge) return json({ error: 'invalid_grant' }, 400)
    const token = randomBytes(24).toString('hex'); access.set(token, 'synthetic-a')
    return json({ access_token: token, refresh_token: 'fixture-refresh', expires_in: 300, id_token: jwt({ iss: issuer, aud: 'fixture-web', sub: 'synthetic-a', name: 'Synthetic A', nonce: saved.nonce, exp: Math.floor(Date.now()/1000)+300 }) })
  }
  if (u.pathname === '/oauth/v2/introspect') {
    const assertion = (body.get('client_assertion') ?? '').split('.')
    if (assertion.length !== 3 || !verify('RSA-SHA256', Buffer.from(assertion.slice(0, 2).join('.')), publicKey, Buffer.from(assertion[2], 'base64url'))) return json({ error: 'invalid_client' }, 401)
    const claims = JSON.parse(Buffer.from(assertion[1], 'base64url'))
    if (claims.aud !== issuer || claims.sub !== 'fixture-api') return json({ error: 'invalid_client' }, 401)
    const sub = access.get(body.get('token'))
    return json(sub ? { active: true, iss: issuer, sub, aud: ['fixture-project'], exp: Math.floor(Date.now()/1000)+300 } : { active: false })
  }
  if (u.pathname === '/oauth/v2/revoke') return json({})
  return json({ error: 'not-found' }, 404)
})
await new Promise((resolve) => idp.listen(0, '127.0.0.1', resolve))
issuer = `http://127.0.0.1:${idp.address().port}`
async function freePort() { const s = createServer(); await new Promise(r => s.listen(0, '127.0.0.1', r)); const p = s.address().port; await new Promise(r => s.close(r)); return p }
async function command(argv, cwd, env = childEnv) {
  const c = spawn(argv[0], argv.slice(1), { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''; c.stdout.on('data', b => output += b); c.stderr.on('data', b => output += b)
  const [code] = await once(c, 'exit')
  if (code) throw new Error(`Command failed (${argv.slice(0, 3).join(' ')}): ${output.replaceAll(fixture.dsn, 'REDACTED').slice(-1200)}`)
}
async function start(argv, cwd, env, name) {
  const c = spawn(argv[0], argv.slice(1), { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] }); children.push(c)
  let log = ''; c.stdout.on('data', b => log += b); c.stderr.on('data', b => log += b)
  const index = children.length
  c.privateLog = () => writeFile(`${privateDir}/${name}-${index}.log`, log, { mode: 0o600 })
  return c
}
async function ready(url, child) {
  for (let i=0; i<300; i++) {
    if (child.exitCode !== null) throw new Error('Owned runtime exited before readiness')
    try { const r = await fetch(url); if (r.status < 500) return } catch {}
    await new Promise(r => setTimeout(r, 100))
  }
  throw new Error('Owned runtime readiness timeout')
}
const uuid7 = () => { const b=randomBytes(16); b.writeUIntBE(Date.now(),0,6); b[6]=(b[6]&15)|112; b[8]=(b[8]&63)|128; const h=b.toString('hex'); return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}` }
const record = (name, value) => { checks.push({ name, pass: !!value }); if (!value) throw new Error(`Probe failed: ${name}`) }
try {
  await writeFile(`${privateDir}/api-key.json`, JSON.stringify({ keyId: jwk.kid, clientId: 'fixture-api', key: privateKey.export({ format: 'pem', type: 'pkcs1' }) }), { mode: 0o600 })
  await mkdir(`${privateDir}/objects`, { recursive:true, mode:0o700 })
  const apiPort = await freePort(), port = await freePort(), inspector = await freePort()
  const origin = `http://127.0.0.1:${port}`, api = `http://127.0.0.1:${apiPort}`
  const apiEnv = { ...childEnv, MC_DATABASE_URL: fixture.dsn, MC_OBJECT_BACKEND:'fs', MC_OBJECT_DIR:`${privateDir}/objects`, MC_HTTP_ADDR:`127.0.0.1:${apiPort}`, MC_OIDC_ISSUER:issuer, MC_OIDC_INTROSPECTION_URL:issuer+'/oauth/v2/introspect', MC_OIDC_AUDIENCE:'fixture-project', MC_OIDC_API_CLIENT_ID:'fixture-api', MC_OIDC_API_KEY_FILE:`${privateDir}/api-key.json`, MC_OIDC_CACHE_TTL:'0s', GOCACHE:'/private/tmp/mc-codex-intake-go-cache' }
  await command(['go','build','-o',`${privateDir}/mcapi`,'./cmd/mcapi'],`${repo}/apps/backend`,apiEnv)
  await command([`${privateDir}/mcapi`,'migrate'],repo,apiEnv)
  const db = new Client({ connectionString:fixture.dsn }); await db.connect()
  try { await db.query('INSERT INTO users (id,display_name,idp_issuer,idp_subject) VALUES ($1,$2,$3,$4) ON CONFLICT (idp_issuer,idp_subject) DO NOTHING',[randomUUID(),'Synthetic A',issuer,'synthetic-a']) } finally { await db.end() }
  const backend = await start([`${privateDir}/mcapi`],repo,apiEnv,'backend'); await ready(api+'/readyz',backend)
  const apiPost = async (path, body, extra={}) => { const r=await fetch(api+'/api/v1'+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer bootstrap','Idempotency-Key':uuid7(),...extra},body:JSON.stringify(body)}); if (r.status!==201) throw new Error(`API fixture create ${path}: ${r.status} ${await r.text()}`); return r.json() }
  const ws=await apiPost('/workspaces',{name:'ADR006 synthetic workspace'})
  const workspaceRead=await fetch(api+`/api/v1/workspaces/${ws.id}`,{headers:{Authorization:'Bearer bootstrap'}})
  const matter=await apiPost(`/workspaces/${ws.id}/matters`,{title:'Synthetic local matter'},{'If-Match':workspaceRead.headers.get('etag')})
  const doc=await apiPost(`/matters/${matter.id}/documents`,{name:'Synthetic binary'})
  const vars={API_MODE:'rest',API_BASE_URL:api+'/api/v1',APP_ORIGIN:origin,OIDC_ISSUER:issuer,OIDC_CLIENT_ID:'fixture-web',OIDC_PROJECT_ID:'fixture-project',SESSION_COOKIE_SECURE:'false',BFF_STATE_BACKEND:'postgres',BFF_DATABASE_URL:fixture.dsn,BFF_STATE_KEY_ID:'fixture',BFF_STATE_KEYS:JSON.stringify({fixture:secret})}
  await writeFile(work+'/.dev.vars',Object.entries(vars).map(([k,v])=>`${k}='${v}'`).join('\n')+'\n',{mode:0o600})
  const workerArgs=['node','node_modules/wrangler/bin/wrangler.js','dev','--local','--ip','127.0.0.1','--port',String(port),'--inspector-port',String(inspector)]
  let worker=await start(workerArgs,work,childEnv,'worker')
  const restartWorker = async () => { await worker.privateLog(); worker.kill('SIGTERM'); await once(worker,'exit'); worker=await start(workerArgs,work,childEnv,'worker'); await ready(origin+'/api/auth/session',worker) }
  await ready(origin+'/api/auth/session',worker)
  const root=await fetch(origin+'/',{redirect:'manual'}); record('root entry redirect',new URL(root.headers.get('location'),origin).pathname==='/workspaces')
  const anon=await fetch(origin+'/api/auth/session'); record('anonymous session',anon.status===200 && (await anon.json()).authenticated===false)
  const login=await fetch(origin+'/api/auth/login?returnTo=/workspaces',{redirect:'manual'})
  record('PKCE authorize redirect',login.status===307 && new URL(login.headers.get('location')).searchParams.get('code_challenge_method')==='S256')
  const stateCookie=login.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ')
  await restartWorker()
  const authorize=await fetch(login.headers.get('location'),{redirect:'manual'})
  const callback=await fetch(authorize.headers.get('location'),{redirect:'manual',headers:{cookie:stateCookie}})
  record('durable callback login',callback.status===307 && callback.headers.getSetCookie().some(x=>x.startsWith('mc_session=')))
  const cookie=callback.headers.getSetCookie().filter(x=>x.startsWith('mc_session=')).map(x=>x.split(';')[0]).join('; ')
  await restartWorker()
  const session=await fetch(origin+'/api/auth/session',{headers:{cookie}}); const principal=await session.json()
  record('authenticated display-only session',session.status===200 && principal.authenticated===true && principal.name==='Synthetic A' && !JSON.stringify(principal).includes('accessToken'))
  const page=await fetch(origin+'/workspaces',{headers:{cookie}}); const html=await page.text()
  record('Worker to real Go and PostgreSQL read',page.status===200 && html.includes('ADR006 synthetic workspace'))
  const css=[...html.matchAll(/href="([^\"]+\.css(?:\?[^\"]*)?)"/g)].map(m=>m[1]); record('compiled CSS linked',css.length>0)
  const style=await fetch(new URL(css[0],origin)); record('compiled CSS served',style.status===200 && (await style.text()).includes('--'))
  for (const size of [1024*1024,25*1024*1024-1024]) {
    const body=new Uint8Array(size).fill(37), hash=createHash('sha256').update(body).digest('hex')
    const path=`/api/matters/${matter.id}/documents/${doc.id}/versions`
    const upload=await fetch(origin+path,{method:'POST',headers:{cookie,origin,'Content-Type':'application/octet-stream','X-Filename':'synthetic.bin','Idempotency-Key':uuid7()},body})
    const result=await upload.json(); record(`streamed upload ${size}`,upload.status===201 && result.ok===true)
    const download=await fetch(origin+path+`/${result.id}/content`,{headers:{cookie}})
    record(`download hash ${size}`,download.status===200 && createHash('sha256').update(Buffer.from(await download.arrayBuffer())).digest('hex')===hash)
  }
  const refs=JSON.parse(await readFile(work+'/.next/server/server-reference-manifest.json','utf8')).node
  const actionId=Object.entries(refs).find(([,v])=>v.exportedName==='createWorkspaceAction')?.[0]
  if (!actionId) throw new Error('Built createWorkspaceAction reference absent')
  const actionInput={name:'Worker Server Action synthetic',idempotencyKey:uuid7()}
  const sendAction=(actionOrigin)=>fetch(origin+'/workspaces',{method:'POST',headers:{cookie,origin:actionOrigin,'Next-Action':actionId,'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify([actionInput])})
  const rejected=await sendAction('https://other-origin.invalid')
  record('Server Action foreign origin refused',rejected.status>=400)
  const action=await sendAction(origin), flight=await action.text()
  record('authenticated Server Action forwarded to Go',action.status===200 && flight.includes('"ok":true'))
  const readAfter=await fetch(origin+'/workspaces',{headers:{cookie}})
  record('Server Action persisted readback',(await readAfter.text()).includes(actionInput.name))
  const logout=await fetch(origin+'/api/auth/logout',{method:'POST',redirect:'manual',headers:{cookie,origin}}); record('durable logout',logout.status===303)
  const old=await fetch(origin+'/api/auth/session',{headers:{cookie}}); record('old cookie refused after logout',(await old.json()).authenticated===false)
} catch(error) {
  checks.push({ name:'runtime failure', pass:false, error:String(error.message).replaceAll(fixture.dsn,'REDACTED') })
  process.exitCode=1
} finally {
  for (const c of children.reverse()) {
    await c.privateLog(); if (c.exitCode===null) { c.kill('SIGTERM'); await Promise.race([once(c,'exit'),new Promise(r=>setTimeout(r,5000))]); }
  }
  await new Promise(r=>idp.close(r))
  const out=`${repo}/docs/testing/codex-adr006-remediation-20261030-r1/worker-smoke-${Date.now()}.json`
  await writeFile(out,JSON.stringify({identity:'Actual Local Codex',fixture:'Synthetic local OIDC + real Go + owned PostgreSQL + filesystem object adapter; no cloud provider',checks},null,2)+'\n')
  console.log(JSON.stringify(checks,null,2))
}

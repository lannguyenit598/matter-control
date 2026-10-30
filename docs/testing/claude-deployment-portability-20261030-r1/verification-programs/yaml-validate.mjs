// Parses rendered templates with a real YAML parser (yaml from the frontend dependency tree) and asserts
// structure; also cross-checks the regex env parser used by deploy-profiles.test.ts against the real parse.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const repo = '/Users/nguyenvanlan/Documents/code/pet-projects/matter-control'
const req = createRequire(`${repo}/apps/frontend/package.json`)
const YAML = req(req.resolve('yaml', { paths: [`${repo}/apps/frontend/node_modules/.pnpm/yaml@2.9.1/node_modules/yaml`] }) )
const { render } = await import(`${repo}/ops/deploy/profiles.mjs`)
const digest = '@sha256:' + 'a'.repeat(64)
const common = { IMAGE: 'asia-southeast1-docker.pkg.dev/mc-synthetic/mattercontrol/mcapi' + digest, OIDC_ISSUER: 'https://issuer.synthetic.test', OIDC_INTROSPECTION_URL: 'https://issuer.synthetic.test/oauth/v2/introspect', OIDC_AUDIENCE: '123', OIDC_API_CLIENT_ID: 'api-client-1', R2_ENDPOINT: 'https://0123abcd.r2.cloudflarestorage.com', R2_BUCKET: 'mc-synthetic', DATABASE_URL_SECRET: 'mcapi-database-url', MIGRATE_DATABASE_URL_SECRET: 'mcapi-migrate-database-url', R2_ACCESS_KEY_ID_SECRET: 'r2-id', R2_SECRET_ACCESS_KEY_SECRET: 'r2-key', OIDC_KEY_SECRET: 'oidc-key' }
const cr = await render('cloud-run', { ...common, SERVICE_NAME: 'mcapi', REGION: 'asia-southeast1', SERVICE_ACCOUNT: 'mcapi-run@mc-synthetic.iam.gserviceaccount.com', MAX_INSTANCES: '3' })
const caddyImage = 'docker.io/library/caddy:2.11.7-alpine@sha256:eb4d35b7452d1ab6171fbdbe8d9275b2301dad6dad92115d91e19fb9b24d510f'
const vm = await render('compute-engine', { ...common, PROJECT_ID: 'mc-synthetic', API_HOSTNAME: 'api.synthetic.test', REGISTRY_HOST: 'asia-southeast1-docker.pkg.dev', GCLOUD_IMAGE: 'gcr.io/google.com/cloudsdktool/google-cloud-cli:590.0.1-stable' + digest, CADDY_IMAGE: caddyImage })
const checks = []
const ok = (name, fn) => { fn(); checks.push(name) }

const svc = YAML.parse(cr['service.yaml'])
const c = svc.spec.template.spec.containers[0]
ok('service.yaml: Knative Service, ingress all, timeout 75, concurrency 10', () => { assert.equal(svc.kind, 'Service'); assert.equal(svc.metadata.annotations['run.googleapis.com/ingress'], 'all'); assert.equal(svc.spec.template.spec.timeoutSeconds, 75); assert.equal(svc.spec.template.spec.containerConcurrency, 10) })
ok('service.yaml: image digest, port 8080, probes on /readyz and /healthz', () => { assert.equal(c.image, common.IMAGE); assert.equal(c.ports[0].containerPort, 8080); assert.equal(c.startupProbe.httpGet.path, '/readyz'); assert.equal(c.livenessProbe.httpGet.path, '/healthz') })
const env = Object.fromEntries(c.env.map((e) => [e.name, e]))
ok('service.yaml: MC_HTTP_ADDR/backend/shutdown values', () => { assert.equal(env.MC_HTTP_ADDR.value, '0.0.0.0:8080'); assert.equal(env.MC_OBJECT_BACKEND.value, 'r2'); assert.equal(env.MC_SHUTDOWN_TIMEOUT.value, '8s'); assert.equal(env.MC_MAX_IN_FLIGHT.value, '10') })
ok('service.yaml: secrets only via secretKeyRef; no secret-named var has a literal value', () => { for (const e of c.env) if (/DATABASE_URL|ACCESS_KEY|SECRET/.test(e.name)) { assert.ok(e.valueFrom?.secretKeyRef, e.name); assert.equal(e.value, undefined) } })
ok('service.yaml: key file volume read-only at the configured path', () => { assert.equal(c.volumeMounts[0].readOnly, true); assert.equal(env.MC_OIDC_API_KEY_FILE.value, c.volumeMounts[0].mountPath + '/api-key.json') })
const job = YAML.parse(cr['migrate-job.yaml'])
const jc = job.spec.template.spec.template.spec.containers[0]
ok('migrate-job.yaml: args [migrate], separate migrate role secret, no listener var', () => { assert.deepEqual(jc.args, ['migrate']); assert.ok(jc.env.some((e) => e.name === 'MC_MIGRATE_DATABASE_URL' && e.valueFrom.secretKeyRef)); assert.ok(!jc.env.some((e) => e.name === 'MC_HTTP_ADDR')) })

const init = YAML.parse(vm['cloud-init.yaml'])
const files = Object.fromEntries(init.write_files.map((f) => [f.path, f]))
ok('cloud-init: parses; units and files present with intended modes', () => { for (const p of ['/etc/mattercontrol/mcapi.env', '/etc/mattercontrol/fetch-secrets.sh', '/etc/systemd/system/mcapi.service', '/etc/systemd/system/mcapi-migrate.service', '/etc/systemd/system/mc-secrets.service', '/etc/systemd/system/caddy.service', '/etc/mattercontrol/Caddyfile']) assert.ok(files[p], p); assert.equal(files['/etc/mattercontrol/fetch-secrets.sh'].permissions, '0700') })
ok('cloud-init: non-secret env file holds no secret keys', () => { const keys = files['/etc/mattercontrol/mcapi.env'].content.trim().split('\n').map((l) => l.split('=')[0]); for (const k of keys) assert.ok(!/DATABASE_URL|ACCESS_KEY|SECRET/.test(k), k); assert.ok(keys.includes('MC_OBJECT_BACKEND')) })
ok('cloud-init: runcmd never starts the migration unit', () => assert.ok(!init.runcmd.join(' ').includes('mcapi-migrate')))
ok('cloud-init: fetch script fail-closed (set -e, no echo $(get))', () => { const t = files['/etc/mattercontrol/fetch-secrets.sh'].content; assert.match(t, /set -euo pipefail/); assert.doesNotMatch(t, /echo .*\$\(get/) })
const mcapiUnit = files['/etc/systemd/system/mcapi.service'].content
ok('mcapi.service: Restart=always, TimeoutStopSec > stop budget', () => { assert.match(mcapiUnit, /^Restart=always$/m); assert.match(mcapiUnit, /^TimeoutStopSec=90$/m); assert.match(mcapiUnit, /docker stop -t 75 mcapi/) })

// Cross-check: the regex parser in deploy-profiles.test.ts must agree with the real YAML parse.
const ah = readFileSync(`${repo}/apps/frontend/apphosting.yaml`, 'utf8')
const real = YAML.parse(ah)
const testSrc = readFileSync(`${repo}/apps/frontend/src/lib/mc/deploy-profiles.test.ts`, 'utf8')
const fn = testSrc.match(/function envEntries[\s\S]*?\n}\n/)[0].replace('function envEntries(text: string): Entry[]', 'function envEntries(text)').replace(/ as Entry/g, '').replace(/const entry: Record<string, string> = \{\}/, 'const entry = {}').replace(/\[1\]!/g, '[1]').replace(/\[2\]!/g, '[2]')
const regexEntries = new Function(`${fn}; return envEntries`)()(ah)
ok('apphosting.yaml: real parse equals the test regex parse (name/value/secret/availability)', () => {
  const norm = (e) => ({ variable: e.variable, value: e.value === undefined ? undefined : String(e.value), secret: e.secret, availability: e.availability === undefined ? undefined : Array.isArray(e.availability) ? `[${e.availability.join(', ')}]` : e.availability })
  assert.deepEqual(regexEntries.map(norm), real.env.map(norm))
})
ok('apphosting.yaml: every secret entry availability is exactly [RUNTIME]; no scripts override', () => { for (const e of real.env) if (e.secret) assert.deepEqual(e.availability, ['RUNTIME']); assert.equal(real.scripts, undefined); assert.equal(real.runConfig.maxInstances, 2) })

// caddy validate on the rendered Caddyfile with the pinned image (no network at validate time; hostname is a synthetic .test name)
const dir = mkdtempSync(join(tmpdir(), 'mc-caddy-'))
writeFileSync(join(dir, 'Caddyfile'), files['/etc/mattercontrol/Caddyfile'].content)
let caddy
try { caddy = execFileSync('docker', ['run', '--rm', '--network', 'none', '-v', `${dir}/Caddyfile:/etc/caddy/Caddyfile:ro`, caddyImage, 'caddy', 'validate', '--config', '/etc/caddy/Caddyfile', '--adapter', 'caddyfile'], { stdio: ['ignore', 'pipe', 'pipe'] }).toString() } catch (e) { caddy = 'FAILED: ' + e.stderr?.toString().slice(-600) }
console.log(JSON.stringify({ yaml_checks_passed: checks.length, checks, caddy_validate: caddy.slice(-400) }, null, 1))
if (caddy.startsWith('FAILED')) process.exitCode = 1

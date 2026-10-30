// node --test ops/deploy/profiles.test.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import { problems, render } from './profiles.mjs'

const digest = '@sha256:' + 'a'.repeat(64)
const common = {
  IMAGE: 'asia-southeast1-docker.pkg.dev/mc-synthetic/mattercontrol/mcapi' + digest,
  OIDC_ISSUER: 'https://issuer.synthetic.test', OIDC_INTROSPECTION_URL: 'https://issuer.synthetic.test/oauth/v2/introspect',
  OIDC_AUDIENCE: '123456789', OIDC_API_CLIENT_ID: 'api-client-1',
  R2_ENDPOINT: 'https://0123abcd.r2.cloudflarestorage.com', R2_BUCKET: 'mc-synthetic',
  DATABASE_URL_SECRET: 'mcapi-database-url', MIGRATE_DATABASE_URL_SECRET: 'mcapi-migrate-database-url',
  R2_ACCESS_KEY_ID_SECRET: 'mcapi-r2-access-key-id', R2_SECRET_ACCESS_KEY_SECRET: 'mcapi-r2-secret-access-key', OIDC_KEY_SECRET: 'mcapi-oidc-api-key',
}
const cloudRun = { ...common, SERVICE_NAME: 'mcapi', REGION: 'asia-southeast1', SERVICE_ACCOUNT: 'mcapi-run@mc-synthetic.iam.gserviceaccount.com', MAX_INSTANCES: '3' }
const vm = { ...common, PROJECT_ID: 'mc-synthetic', API_HOSTNAME: 'api.synthetic.test', REGISTRY_HOST: 'asia-southeast1-docker.pkg.dev', GCLOUD_IMAGE: 'gcr.io/google.com/cloudsdktool/google-cloud-cli:590.0.1-stable' + digest, CADDY_IMAGE: 'docker.io/library/caddy:2.11.7-alpine' + digest }

test('renders both profiles with no placeholder left and the same image', async () => {
  for (const [profile, values] of [['cloud-run', cloudRun], ['compute-engine', vm]]) {
    const files = await render(profile, values)
    for (const text of Object.values(files)) {
      assert.doesNotMatch(text, /\{\{/)
      assert.ok(text.includes(values.IMAGE))
    }
  }
})

test('A -> B -> A renders are byte-identical (no state carried between profiles)', async () => {
  const a1 = await render('cloud-run', cloudRun)
  await render('compute-engine', vm)
  assert.deepEqual(await render('cloud-run', cloudRun), a1)
})

test('fails closed with key names only', () => {
  assert.match(problems('kubernetes', cloudRun)[0], /unknown profile "kubernetes"/)
  const cases = [
    [{ ...cloudRun, IMAGE: 'asia-southeast1-docker.pkg.dev/p/r/mcapi:latest' }, 'IMAGE: must be pinned by @sha256 digest'],
    [{ ...cloudRun, R2_ENDPOINT: 'http://0123abcd.r2.cloudflarestorage.com' }, 'R2_ENDPOINT: must be an https URL without credentials'],
    [{ ...cloudRun, DATABASE_URL_SECRET: 'postgresql://u:synthetic-pw@db.synthetic.test/postgres' }, 'DATABASE_URL_SECRET: looks like a secret value; use a Secret Manager name'],
    [{ ...cloudRun, OIDC_KEY_SECRET: '-----BEGIN PRIVATE KEY-----' }, 'OIDC_KEY_SECRET: looks like a secret value; use a Secret Manager name'],
    [{ ...cloudRun, MAX_INSTANCES: '50' }, 'MAX_INSTANCES: must be 1..10 (pgx MaxConns 10 per instance)'],
    [{ ...cloudRun, API_HOSTNAME: 'api.synthetic.test' }, 'API_HOSTNAME: not used by cloud-run'],
    [{ ...vm, CADDY_IMAGE: undefined }, 'CADDY_IMAGE: required'],
    [{ ...vm, OIDC_ISSUER: 'https://REPLACE_ISSUER_HOST' }, 'OIDC_ISSUER: placeholder or unsafe characters'],
  ]
  for (const [values, expected] of cases) {
    const profile = 'API_HOSTNAME' in values && values.PROJECT_ID ? 'compute-engine' : 'cloud-run'
    const got = problems(profile, values)
    assert.ok(got.includes(expected), `${expected} not in ${JSON.stringify(got)}`)
    assert.ok(!JSON.stringify(got).includes('synthetic-pw'))
  }
})

test('committed example values are rejected until an operator fills them', async () => {
  for (const profile of ['cloud-run', 'compute-engine']) {
    const values = JSON.parse(await readFile(new URL(`./${profile}.values.example.json`, import.meta.url), 'utf8'))
    assert.ok(problems(profile, values).length > 0)
  }
})

test('profile timing and isolation invariants', async () => {
  const run = (await render('cloud-run', cloudRun))['service.yaml']
  assert.match(run, /timeoutSeconds: 75/) // >= transfer timeout 60 s
  assert.match(run, /MC_SHUTDOWN_TIMEOUT, value: 8s/) // < 10 s SIGTERM grace
  assert.match(run, /MC_OBJECT_BACKEND, value: r2/)
  const init = (await render('compute-engine', vm))['cloud-init.yaml']
  const execStart = init.match(/ExecStart=(\/usr\/bin\/docker run --name mcapi .*)/)[1]
  for (const flag of ['--read-only', '--cap-drop ALL', '--security-opt no-new-privileges', '--memory 512m', '-p 127.0.0.1:8081:8081', 'readonly'])
    assert.ok(execStart.includes(flag), flag)
  assert.match(init, /MC_OBJECT_BACKEND=r2/)
  assert.match(init, /MC_SHUTDOWN_TIMEOUT=65s/)
  assert.match(init, /docker stop -t 75 mcapi/)
  // Boot never applies DDL: migration is an operator step.
  assert.doesNotMatch(init.split('\nruncmd:')[1], /mcapi-migrate/)
})

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
const cloudRun = { ...common, SERVICE_NAME: 'mcapi', REGION: 'asia-southeast1', SERVICE_ACCOUNT: 'mcapi-run@mc-synthetic.iam.gserviceaccount.com', MIGRATOR_SERVICE_ACCOUNT: 'mcapi-migrate@mc-synthetic.iam.gserviceaccount.com', MAX_INSTANCES: '3' }
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

test('migration identity is separate from the serving identity (PI-02)', async () => {
  // The renderer refuses one shared service account before anything is written.
  const shared = { ...cloudRun, MIGRATOR_SERVICE_ACCOUNT: cloudRun.SERVICE_ACCOUNT }
  assert.ok(problems('cloud-run', shared).includes('MIGRATOR_SERVICE_ACCOUNT: must differ from SERVICE_ACCOUNT (separate migration identity)'))
  const files = await render('cloud-run', cloudRun)
  // The migrate job runs as the migrator identity and carries the migration secret; the serving
  // service never references either.
  assert.match(files['migrate-job.yaml'], new RegExp(`serviceAccountName: ${cloudRun.MIGRATOR_SERVICE_ACCOUNT}`))
  assert.match(files['migrate-job.yaml'], /MC_MIGRATE_DATABASE_URL/)
  assert.ok(!files['migrate-job.yaml'].includes(cloudRun.SERVICE_ACCOUNT), 'migrate job must not use the serving identity')
  assert.ok(!files['service.yaml'].includes('MC_MIGRATE_DATABASE_URL'), 'serving container must not hold the migration secret')
  assert.ok(!files['service.yaml'].includes(cloudRun.MIGRATOR_SERVICE_ACCOUNT), 'serving service must not use the migration identity')
  // VM profile: the migrate unit is the only reader of the migration secret's env file.
  const init = (await render('compute-engine', vm))['cloud-init.yaml']
  const serviceUnit = init.match(/mcapi\.service[\s\S]*?(?=\n  - path)/)[0]
  const migrateUnit = init.match(/mcapi-migrate\.service[\s\S]*$/)[0]
  assert.doesNotMatch(serviceUnit, /migrate-secrets\.env/)
  assert.match(migrateUnit, /migrate-secrets\.env/)
  assert.match(migrateUnit, /mc-migrate-secrets\.service/)
  assert.match(init, /fetch-migrate-secrets\.sh/)
})

test('profile timing and isolation invariants', async () => {
  const run = (await render('cloud-run', cloudRun))['service.yaml']
  assert.match(run, /timeoutSeconds: 75/) // >= transfer timeout 60 s
  assert.match(run, /MC_SHUTDOWN_TIMEOUT, value: 8s/) // < 10 s SIGTERM grace
  assert.match(run, /MC_OBJECT_BACKEND, value: r2/)
  assert.match(run, /MC_OIDC_CACHE_TTL, value: 30s/) // ADR-004 decision 4
  const init = (await render('compute-engine', vm))['cloud-init.yaml']
  assert.match(init, /MC_OIDC_CACHE_TTL=30s/) // ADR-004 decision 4
  const execStart = init.match(/ExecStart=(\/usr\/bin\/docker run --name mcapi .*)/)[1]
  for (const flag of ['--read-only', '--cap-drop ALL', '--security-opt no-new-privileges', '--memory 512m', '-p 127.0.0.1:8081:8081', 'readonly'])
    assert.ok(execStart.includes(flag), flag)
  assert.match(init, /MC_OBJECT_BACKEND=r2/)
  assert.match(init, /MC_SHUTDOWN_TIMEOUT=65s/)
  assert.match(init, /docker stop -t 75 mcapi/)
  // Boot never applies DDL: migration is an operator step.
  assert.doesNotMatch(init.split('\nruncmd:')[1], /mcapi-migrate/)
})

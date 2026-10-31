// node --test scripts/release-preflight.test.mjs
// PI-03: the preflight must reject the real leak classes on an actual artifact tree — including
// the observed App Hosting behaviour of copying .env.local/.dev.vars into the standalone bundle —
// and must pass a clean artifact. Findings name paths and secret KEY names, never values.
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { test } from 'node:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { forbiddenFileName, scanFiles } from './release-preflight.mjs'

const cleanTree = async (root) => {
  await mkdir(join(root, 'assets'), { recursive: true })
  await writeFile(join(root, 'worker.js'), 'export default {}')
  await writeFile(join(root, 'assets', 'chunk.txt'), 'plain content')
}

test('clean tracked set and clean artifact pass', async () => {
  const root = await mkdtemp(join(tmpdir(), 'preflight-clean-'))
  try {
    await cleanTree(root)
    const findings = await scanFiles(['worker.js', 'assets/chunk.txt'], async (rel) => ({
      name: forbiddenFileName(rel.split('/').pop()),
      key: null,
      content: rel === 'worker.js' ? 'export default {}' : 'plain content',
    }))
    assert.deepEqual(findings, [])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('env/dev-vars/key files planted in an artifact are rejected by name', async () => {
  for (const [name, why] of [
    ['.env.local', 'env file'],
    ['.env.production', 'env file'],
    ['.dev.vars', 'dev-vars file'],
    ['oidc-api-key.json', 'API key JSON'],
    ['server.pem', 'private-key material (PEM)'],
    ['tls.key', 'private-key material (key file)'],
  ]) {
    assert.equal(forbiddenFileName(name), why, name)
  }
  // Documentation examples stay allowed.
  assert.equal(forbiddenFileName('.env.example'), null)
  assert.equal(forbiddenFileName('.dev.vars.example'), null)
})

test('a copied .env.local with a runtime secret is found and only the key is named', async () => {
  const root = await mkdtemp(join(tmpdir(), 'preflight-leak-'))
  try {
    await cleanTree(root)
    await writeFile(
      join(root, '.env.local'),
      'BFF_STATE_KEYS={"v1":"synthetic-32-byte-value"}\nNEXT_PUBLIC_OK=1\n',
    )
    const findings = await scanFiles(['worker.js', '.env.local'], async (rel) => ({
      name: forbiddenFileName(rel.split('/').pop()),
      key: rel === '.env.local' ? 'BFF_STATE_KEYS' : null,
      content: null,
    }))
    assert.equal(findings.length, 1)
    assert.match(findings[0], /\.env\.local: env file; runtime secret key BFF_STATE_KEYS present/)
    assert.ok(
      !findings.join('\n').includes('synthetic-32-byte-value'),
      'values must never be printed',
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('content sentinels are caught in any file', async () => {
  const findings = await scanFiles(['assets/note.txt'], async () => ({
    name: null,
    key: null,
    content: 'scratch note mentioning MC-RELEASE-SENTINEL planted by QA',
  }))
  assert.deepEqual(findings, ['assets/note.txt: release sentinel marker'])
  const pem = await scanFiles(['bundle.js'], async () => ({
    name: null,
    key: null,
    content: 'const k = `-----BEGIN PRIVATE KEY-----`',
  }))
  assert.deepEqual(pem, ['bundle.js: PEM private key block'])
})

test('plain env files without secret-shaped keys pass the key scan but not the name scan', async () => {
  const findings = await scanFiles(['.env.local'], async () => ({
    name: 'env file',
    key: null,
    content: null,
  }))
  assert.deepEqual(findings, ['.env.local: env file'])
})

// node --test scripts/release-preflight-integration.test.mjs
// OV-R8-01 integration test (fix-wave #2 G2): the CLI wiring itself, not just the scanFiles core.
// The old wiring handed probeFactory probe-shaped objects, which made both scan paths
// content-blind (sentinels never matched, clean exit 0) and crashed with a bare TypeError on the
// first forbidden filename. Running main() for real against a planted artifact pins the contract:
// every finding listed, no values printed, no crash.
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { test } from 'node:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { main } from './release-preflight.mjs'

// Runtime-assembled so this tracked source never matches the scanner's own content sentinels.
const PEM = '-----BEGIN ' + 'PRIVATE KEY-----\nMIIB\n-----END PRIVATE ' + 'KEY-----\n'
const SENTINEL = 'MC-RELEASE-' + 'SENTINEL'

async function planted() {
  const dir = await mkdtemp(join(tmpdir(), 'r8-preflight-'))
  await mkdir(join(dir, 'nested'), { recursive: true })
  await writeFile(join(dir, 'trace.txt'), SENTINEL + '\n')
  await writeFile(join(dir, 'nested', 'leak.pem'), PEM)
  await writeFile(join(dir, '.env.local'), 'MC_PLANT_SECRET=QA-PLANT-VALUE-DO-NOT-PRINT-9c41\n')
  return dir
}

async function capture(fn) {
  const lines = []
  const orig = { error: console.error, log: console.log, warn: console.warn }
  console.error = (...xs) => lines.push(xs.join(' '))
  console.log = (...xs) => lines.push(xs.join(' '))
  console.warn = (...xs) => lines.push(xs.join(' '))
  try {
    await fn()
  } finally {
    console.error = orig.error
    console.log = orig.log
    console.warn = orig.warn
  }
  return lines.join('\n')
}

test('lists sentinel, PEM and env findings from a planted artifact and exits non-zero', async () => {
  const dir = await planted()
  try {
    const before = process.exitCode
    const out = await capture(() => main([dir]))
    assert.equal(process.exitCode, 1)
    assert.match(out, /forbidden finding\(s\)/)
    assert.match(out, /trace\.txt: release sentinel marker/)
    assert.match(out, /leak\.pem: private-key material \(PEM\)/)
    assert.match(out, /\.env\.local: env file/)
    // The secret KEY name is printed by design; the VALUE never is.
    assert.match(out, /MC_PLANT_SECRET/)
    assert.doesNotMatch(out, /QA-PLANT-VALUE-DO-NOT-PRINT-9c41/)
    assert.doesNotMatch(out, /TypeError/)
    process.exitCode = before
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('reports a single .env.local as a finding instead of crashing', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'r8-preflight-env-'))
  try {
    const before = process.exitCode
    await writeFile(join(dir, '.env.local'), 'MC_PLANT_SECRET=value\n')
    const out = await capture(() => main([dir]))
    assert.equal(process.exitCode, 1)
    assert.match(out, /\.env\.local: env file/)
    assert.doesNotMatch(out, /TypeError/)
    process.exitCode = before
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('stays clean on an artifact without findings', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'r8-preflight-clean-'))
  try {
    const before = process.exitCode
    await writeFile(join(dir, 'bundle.js'), 'console.log("ok")\n')
    const out = await capture(() => main([dir]))
    assert.equal(process.exitCode, before)
    assert.match(out, /release preflight: clean/)
    process.exitCode = before
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('the real CLI also inspects content and env names in the git-tracked scan', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'r8-tracked-'))
  const exec = promisify(execFile)
  try {
    await mkdir(join(dir, 'scripts'))
    for (const name of ['release-preflight.mjs', 'worker-build-env.mjs']) {
      await writeFile(join(dir, 'scripts', name), await readFile(new URL(name, import.meta.url)))
    }
    await writeFile(join(dir, 'trace.txt'), SENTINEL)
    await writeFile(join(dir, 'settings.dat'), PEM)
    await writeFile(join(dir, '.env.local'), 'MC_PLANT_SECRET=TRACKED-SYNTHETIC-VALUE\n')
    await exec('git', ['init', '--quiet'], { cwd: dir })
    await exec('git', ['add', 'trace.txt', 'settings.dat', '.env.local'], { cwd: dir })
    await assert.rejects(
      exec(process.execPath, ['scripts/release-preflight.mjs'], { cwd: dir }),
      (error) => {
        assert.equal(error.code, 1)
        assert.match(error.stderr, /trace\.txt: release sentinel marker/)
        assert.match(error.stderr, /settings\.dat: PEM private key block/)
        assert.match(error.stderr, /\.env\.local: env file/)
        assert.doesNotMatch(error.stderr, /TRACKED-SYNTHETIC-VALUE|TypeError/)
        return true
      },
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

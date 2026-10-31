// Release preflight (PI-03): a deployable artifact must not carry secret-shaped files.
// Scans (1) the files git tracks and (2) any given build-artifact directories (.open-next,
// .next/standalone — the App Hosting adapter was observed copying local .env*/.dev.vars into the
// standalone bundle, so the artifact itself is inspected, not a .gitignore string).
//
//   node scripts/release-preflight.mjs [<artifact-dir> ...]
//
// Failing findings name paths and (for env-shaped files) secret KEY names — never values. Exit 0
// only when every scanned set is clean. A `--require-artifacts` flag makes missing artifact
// directories an error instead of a warning, for CI jobs that must not pass on an empty build.
import { readdir, readFile, stat } from 'node:fs/promises'
import { basename, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findRuntimeSecret } from './worker-build-env.mjs'

const frontendRoot = fileURLToPath(new URL('../', import.meta.url))

/** Forbidden file-name classes. *.example env files are intentional documentation, not secrets. */
export function forbiddenFileName(name) {
  if (/^\.env($|\.)[^/]*$/.test(name) && !/\.example$/.test(name)) return 'env file'
  if (/^\.dev\.vars($|\.)[^/]*$/.test(name) && !/\.example$/.test(name)) return 'dev-vars file'
  if (/\.pem$/.test(name)) return 'private-key material (PEM)'
  if (/\.key$/.test(name)) return 'private-key material (key file)'
  if (/api-key.*\.json$/.test(name)) return 'API key JSON'
  return null
}

/** Content sentinels any file may never carry; findings name the shape, never the value. */
const contentShapes = [
  { name: 'PEM private key block', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'release sentinel marker', re: /MC-RELEASE-SENTINEL/ },
]

/**
 * Pure scan core so tests can exercise it without git or a real build.
 * @param {string[]} files relative paths
 * @param {(rel: string) => Promise<{ name: string | null, key: string | null, content: string | null }>} probe
 */
export async function scanFiles(files, probe) {
  const findings = []
  for (const rel of files) {
    const info = await probe(rel)
    if (info.name || info.key) {
      const parts = []
      if (info.name) parts.push(info.name)
      if (info.key) parts.push(`runtime secret key ${info.key} present (value withheld)`)
      findings.push(`${rel}: ${parts.join('; ')}`)
      continue
    }
    if (info.content) {
      for (const shape of contentShapes) {
        if (shape.re.test(info.content)) findings.push(`${rel}: ${shape.name}`)
      }
    }
  }
  return findings
}

// Env-shaped and key files are read for the offending KEY name; other files are only checked
// against the content sentinels.
function probeFactory(read) {
  return async (rel) => {
    const name = forbiddenFileName(basename(rel))
    if (!name) {
      const content = await read(rel)
      return { name: null, key: null, content }
    }
    const content = await read(rel)
    return { name, key: content ? findRuntimeSecret(content) : null, content }
  }
}

async function walk(dir, base = dir, out = []) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return null // caller decides whether a missing artifact directory is fatal
  }
  for (const entry of entries) {
    const p = join(base, entry.name)
    if (entry.isDirectory()) await walk(p, base, out)
    else out.push(relative(base, p))
  }
  return out
}

async function main() {
  const args = process.argv.slice(2)
  const requireArtifacts = args.includes('--require-artifacts')
  const artifactDirs = args.filter((a) => !a.startsWith('--'))
  const findings = []

  // 1. What git tracks: a forbidden file in the repository fails the release regardless of build.
  try {
    const { execFile } = await import('node:child_process')
    const { promisify } = await import('node:util')
    const run = promisify(execFile)
    const tracked = (await run('git', ['-C', frontendRoot, 'ls-files', '--full-name'])).stdout
      .split('\n')
      .filter(Boolean)
    const root = (
      await run('git', ['-C', frontendRoot, 'rev-parse', '--show-toplevel'])
    ).stdout.trim()
    findings.push(
      ...(await scanFiles(
        tracked,
        probeFactory(async (rel) => {
          const content = await readFile(join(root, rel), 'utf8').catch(() => null)
          return { name: null, key: content ? findRuntimeSecret(content) : null, content }
        }),
      )),
    )
  } catch {
    console.warn('warning: not a git checkout; skipping the tracked-files scan')
  }

  // 2. Build artifacts, byte-inspected on disk.
  for (const dir of artifactDirs) {
    const files = await walk(dir)
    if (files === null) {
      if (requireArtifacts) findings.push(`${dir}: artifact directory missing (build did not run?)`)
      else console.warn(`warning: artifact directory ${dir} not found; skipping`)
      continue
    }
    const info = await stat(dir)
    if (!info.isDirectory()) findings.push(`${dir}: not a directory`)
    findings.push(
      ...(await scanFiles(
        files,
        probeFactory(async (rel) => {
          const content = await readFile(join(dir, rel), 'utf8').catch(() => null)
          return { name: null, key: content ? findRuntimeSecret(content) : null, content }
        }),
      )),
    )
  }

  if (findings.length) {
    console.error(`release preflight: ${findings.length} forbidden finding(s):`)
    for (const f of findings) console.error(`  ${f}`)
    console.error(
      'Values are never printed. Remove the files from the artifact/source, not from this scan.',
    )
    process.exitCode = 1
    return
  }
  console.log(
    'release preflight: clean (tracked files' +
      (artifactDirs.length ? ` + ${artifactDirs.join(', ')}` : '') +
      ')',
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main()
}

import { readdir, readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { findRuntimeSecret, isRuntimeSecretKey } from './worker-build-env.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
// OpenNext captures .env files for the bundle. Runtime secrets belong in secret bindings
// (.dev.vars for local preview), never in a file consumed by the production build.
for (const name of await readdir(root)) {
  if (
    !/^\.env(?:\.(?:local|production|production\.local|development|development\.local))?$/.test(
      name,
    )
  )
    continue
  const text = await readFile(new URL(`../${name}`, import.meta.url), 'utf8')
  const key = findRuntimeSecret(text)
  if (key) throw new Error(`Move runtime secret ${key} out of ${name} before building the Worker`)
}
const env = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !isRuntimeSecretKey(key)),
)
const child = spawn(
  process.execPath,
  ['node_modules/@opennextjs/cloudflare/dist/cli/index.js', 'build'],
  {
    cwd: root,
    env: {
      ...env,
      MC_WORKER_BUILD: '1',
      API_MODE: 'rest',
      API_BASE_URL: 'https://unconfigured.invalid/api/v1',
      WRANGLER_SEND_METRICS: 'false',
    },
    stdio: 'inherit',
  },
)
child.on('error', () => {
  process.exitCode = 1
})
child.on('exit', (code) => {
  process.exitCode = code ?? 1
})

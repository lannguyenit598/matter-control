// Renders and validates a deployment profile (ADR-007): backend cloud-run/compute-engine and the
// non-secret frontend Worker variables. It never deploys, authenticates or calls a provider: it
// writes reviewed files into a new directory and prints the operator commands. Values are
// non-secret: secrets are secret-store *names*. Errors name keys, never values.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const here = (p) => fileURLToPath(new URL(p, import.meta.url))
const common = ['IMAGE', 'OIDC_ISSUER', 'OIDC_INTROSPECTION_URL', 'OIDC_AUDIENCE', 'OIDC_API_CLIENT_ID', 'R2_ENDPOINT', 'R2_BUCKET', 'DATABASE_URL_SECRET', 'MIGRATE_DATABASE_URL_SECRET', 'R2_ACCESS_KEY_ID_SECRET', 'R2_SECRET_ACCESS_KEY_SECRET', 'OIDC_KEY_SECRET']
export const PROFILES = {
  'cloud-run': { keys: [...common, 'SERVICE_NAME', 'REGION', 'SERVICE_ACCOUNT', 'MIGRATOR_SERVICE_ACCOUNT', 'MAX_INSTANCES'], files: ['cloud-run/service.yaml', 'cloud-run/migrate-job.yaml'] },
  'compute-engine': { keys: [...common, 'PROJECT_ID', 'API_HOSTNAME', 'REGISTRY_HOST', 'GCLOUD_IMAGE', 'CADDY_IMAGE'], files: ['compute-engine/cloud-init.yaml'] },
  // Worker (frontend/BFF) non-secret variables. The pilot deploys them via `wrangler deploy --var`
  // flags rendered here — tracked wrangler.jsonc is never hand-edited after the release SHA is
  // pinned (A9/F8). Secrets (BFF_DATABASE_URL, BFF_STATE_KEYS, optional BFF_DATABASE_CA) are
  // supplied separately via `wrangler secret put` and are never part of this profile.
  worker: { keys: ['API_MODE', 'API_BASE_URL', 'AUTH_ALLOW_ANONYMOUS', 'SESSION_COOKIE_SECURE', 'BFF_STATE_BACKEND', 'APP_ORIGIN', 'OIDC_ISSUER', 'OIDC_CLIENT_ID', 'OIDC_PROJECT_ID', 'BFF_STATE_KEY_ID'], files: ['worker/wrangler.vars.json'] },
}
// Optional keys: absent means the rendered output omits the feature block entirely (the template
// marks those blocks with {{#KEY}}...{{/KEY}}). Present values are validated like required ones.
// - MC_SEARCH_CURSOR_KEY (A7/plan): Metadata Quick Search stays honestly unavailable when unset;
//   the value is a Secret Manager name only, never the key itself.
// - DATABASE_CA_SECRET (A3/plan): mounts the /secrets/dbca volume for pgx sslrootcert paths in the
//   service AND the migrate job; unset means the operator DSN must not reference /secrets/dbca.
const optionalByProfile = { 'cloud-run': ['MC_SEARCH_CURSOR_KEY', 'DATABASE_CA_SECRET'], 'compute-engine': [], worker: [] }
const rules = [
  [/(^|_)IMAGE$/, /^[a-z0-9.-]+(:\d+)?\/[a-z0-9._\/-]+(:[\w.-]+)?@sha256:[0-9a-f]{64}$/, 'must be pinned by @sha256 digest'],
  [/^(OIDC_ISSUER|OIDC_INTROSPECTION_URL|R2_ENDPOINT|API_BASE_URL)$/, /^https:\/\/[a-z0-9.-]+(:\d+)?(\/[\w./-]*)?$/i, 'must be an https URL without credentials'],
  [/^APP_ORIGIN$/, /^https:\/\/[a-z0-9.-]+(:\d+)?$/i, 'must be the bare https origin (no path; redirect and post-logout URIs derive from it)'],
  [/_SECRET$|^(MC_SEARCH_CURSOR_KEY|DATABASE_CA_SECRET)$/, /^[A-Za-z0-9_-]{1,255}$/, 'must be a Secret Manager secret name, not a value'],
  [/^MAX_INSTANCES$/, /^([1-9]|10)$/, 'must be 1..10 (pgx MaxConns 10 per instance)'],
  [/^REGION$/, /^[a-z]+-[a-z]+\d+$/, 'must be a region id'],
  [/^SERVICE_ACCOUNT$/, /^[a-z][a-z0-9-]{4,28}[a-z0-9]@[a-z0-9-]+\.iam\.gserviceaccount\.com$/, 'must be a service account email'],
  [/^(API_HOSTNAME|REGISTRY_HOST)$/, /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/, 'must be a DNS hostname'],
  [/^(SERVICE_NAME|PROJECT_ID|R2_BUCKET)$/, /^[a-z][a-z0-9-]{2,61}[a-z0-9]$/, 'must be a lowercase resource id'],
  [/^BFF_STATE_KEY_ID$/, /^[A-Za-z0-9_-]{1,32}$/, 'must be 1-32 ASCII letters/digits/underscore/hyphen'],
]

/** Every problem with a values object for a profile; empty means renderable. */
export function problems(profile, values) {
  const spec = PROFILES[profile]
  if (!spec) return [`unknown profile "${profile}" (expected ${Object.keys(PROFILES).join(' or ')})`]
  if (!values || typeof values !== 'object' || Array.isArray(values)) return ['values must be a JSON object']
  const optional = new Set(optionalByProfile[profile] ?? [])
  const out = Object.keys(values)
    .filter((k) => !spec.keys.includes(k) && !optional.has(k))
    .map((k) => `${k}: not used by ${profile}`)
  for (const key of [...spec.keys, ...optional]) {
    const v = values[key]
    if (v === undefined) {
      if (!optional.has(key)) out.push(`${key}: required`)
      continue
    }
    if (typeof v !== 'string' || v.trim() === '') { out.push(`${key}: required`); continue }
    if (/REPLACE|CHANGEME|unconfigured|example\.(com|invalid)|\{\{|[\r\n'"]/i.test(v)) { out.push(`${key}: placeholder or unsafe characters`); continue }
    if (/PRIVATE KEY|:\/\/[^/@\s]*@/.test(v)) { out.push(`${key}: looks like a secret value; use a Secret Manager name`); continue }
    for (const [name, pattern, message] of rules) if (name.test(key) && !pattern.test(v)) out.push(`${key}: ${message}`)
  }
  // PI-02: the migration identity is separate from the serving identity. One shared service
  // account would give the serving container the migration secret's IAM scope, so the renderer
  // refuses equal values before anything is written.
  if ('SERVICE_ACCOUNT' in values && 'MIGRATOR_SERVICE_ACCOUNT' in values &&
      values.SERVICE_ACCOUNT === values.MIGRATOR_SERVICE_ACCOUNT && typeof values.SERVICE_ACCOUNT === 'string' && values.SERVICE_ACCOUNT.trim() !== '') {
    out.push('MIGRATOR_SERVICE_ACCOUNT: must differ from SERVICE_ACCOUNT (separate migration identity)')
  }
  // Worker pilot profile: the fail-closed posture is the point of these pins, so the renderer
  // refuses drift toward open/demo/local values rather than rendering an unsafe variant.
  const pins = { API_MODE: 'rest', AUTH_ALLOW_ANONYMOUS: 'false', SESSION_COOKIE_SECURE: 'true', BFF_STATE_BACKEND: 'postgres' }
  for (const [key, want] of Object.entries(pins)) {
    if (profile === 'worker' && key in values && values[key] !== want) out.push(`${key}: must be "${want}" for the pilot profile`)
  }
  if (profile === 'worker' && typeof values.API_BASE_URL === 'string' && values.API_BASE_URL !== '' &&
      !values.API_BASE_URL.replace(/\/+$/, '').endsWith('/api/v1')) {
    out.push('API_BASE_URL: must point at the backend /api/v1 base path')
  }
  return out
}

/** Rendered files for a valid profile: { relativePath: text }. */
export async function render(profile, values) {
  const errors = problems(profile, values)
  if (errors.length) throw new Error(`invalid ${profile} values:\n- ${errors.join('\n- ')}`)
  const optional = new Set(optionalByProfile[profile] ?? [])
  const files = {}
  for (const rel of PROFILES[profile].files) {
    let text = await readFile(here(rel), 'utf8')
    // Optional blocks: {{#KEY}}...{{/KEY}} on their own lines. Absent key -> the block is removed;
    // present key -> markers are stripped and {{KEY}} inside is substituted below.
    for (const key of optional) {
      const block = new RegExp(`^\\{\\{#${key}\\}\\}\\n[\\s\\S]*?^\\{\\{/${key}\\}\\}\\n`, 'gm')
      if (!(key in values)) text = text.replace(block, '')
    }
    text = text.replace(/^\{\{[#/][A-Z0-9_]+\}\}\n/gm, '')
    text = text.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, k) => {
      if (!(k in values)) throw new Error(`template ${rel} uses ${k}, which ${profile} does not declare`)
      return values[k]
    })
    if (/\{\{[#/]?/.test(text)) throw new Error(`template ${rel} still contains an unresolved marker`)
    files[rel.split('/').pop()] = text
  }
  return files
}

const varFlags = (v) => Object.entries(v).map(([k, val]) => `--var ${k}:${val}`).join(' ')
const commands = {
  'cloud-run': (v) => [
    `gcloud run jobs replace migrate-job.yaml --region ${v.REGION}`,
    `gcloud run jobs execute ${v.SERVICE_NAME}-migrate --region ${v.REGION} --wait`,
    `gcloud run services replace service.yaml --region ${v.REGION}`,
  ],
  'compute-engine': () => [
    'gcloud compute instances create ... --image-family=cos-stable --image-project=cos-cloud --metadata-from-file=user-data=cloud-init.yaml (see docs/deployment/portability-runbook.md)',
    'sudo systemctl start mcapi-migrate   # on the VM, before serving a new schema',
  ],
  worker: (v) => [
    `cd apps/frontend && pnpm exec wrangler deploy ${varFlags(v)}`,
    '# Secrets stay separate (never --var): pnpm exec wrangler secret put BFF_DATABASE_URL | BFF_STATE_KEYS | [BFF_DATABASE_CA]',
  ],
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [profile, valuesPath, outDir] = process.argv.slice(2)
  try {
    if (!profile || !valuesPath || !outDir) throw new Error('usage: node ops/deploy/profiles.mjs <cloud-run|compute-engine|worker> <values.json> <new-out-dir>')
    if (!PROFILES[profile]) throw new Error(problems(profile, {})[0])
    const values = JSON.parse(await readFile(valuesPath, 'utf8'))
    const files = await render(profile, values)
    // A fresh directory per render: one profile's output can never contaminate another's.
    await mkdir(outDir, { recursive: false })
    for (const [name, text] of Object.entries(files)) await writeFile(`${outDir}/${name}`, text, { flag: 'wx' })
    console.log(`Rendered ${profile} into ${outDir}. Nothing was deployed. After authorization, from the repository root:`)
    for (const c of commands[profile](values)) console.log(`  ${c}`)
  } catch (error) {
    console.error(error.code === 'EEXIST' ? `refusing to reuse existing ${outDir}` : error.message)
    process.exitCode = 1
  }
}

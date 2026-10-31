// Renders and validates a backend deployment profile (ADR-007). It never deploys, authenticates or
// calls a provider: it writes reviewed files into a new directory and prints the operator commands.
//   node ops/deploy/profiles.mjs <cloud-run|compute-engine> <values.json> <new-out-dir>
// Values are non-secret: secrets are Secret Manager *names*. Errors name keys, never values.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const here = (p) => fileURLToPath(new URL(p, import.meta.url))
const common = ['IMAGE', 'OIDC_ISSUER', 'OIDC_INTROSPECTION_URL', 'OIDC_AUDIENCE', 'OIDC_API_CLIENT_ID', 'R2_ENDPOINT', 'R2_BUCKET', 'DATABASE_URL_SECRET', 'MIGRATE_DATABASE_URL_SECRET', 'R2_ACCESS_KEY_ID_SECRET', 'R2_SECRET_ACCESS_KEY_SECRET', 'OIDC_KEY_SECRET']
export const PROFILES = {
  'cloud-run': { keys: [...common, 'SERVICE_NAME', 'REGION', 'SERVICE_ACCOUNT', 'MIGRATOR_SERVICE_ACCOUNT', 'MAX_INSTANCES'], files: ['cloud-run/service.yaml', 'cloud-run/migrate-job.yaml'] },
  'compute-engine': { keys: [...common, 'PROJECT_ID', 'API_HOSTNAME', 'REGISTRY_HOST', 'GCLOUD_IMAGE', 'CADDY_IMAGE'], files: ['compute-engine/cloud-init.yaml'] },
}
const rules = [
  [/(^|_)IMAGE$/, /^[a-z0-9.-]+(:\d+)?\/[a-z0-9._\/-]+(:[\w.-]+)?@sha256:[0-9a-f]{64}$/, 'must be pinned by @sha256 digest'],
  [/^(OIDC_ISSUER|OIDC_INTROSPECTION_URL|R2_ENDPOINT)$/, /^https:\/\/[a-z0-9.-]+(:\d+)?(\/[\w./-]*)?$/i, 'must be an https URL without credentials'],
  [/_SECRET$/, /^[A-Za-z0-9_-]{1,255}$/, 'must be a Secret Manager secret name, not a value'],
  [/^MAX_INSTANCES$/, /^([1-9]|10)$/, 'must be 1..10 (pgx MaxConns 10 per instance)'],
  [/^REGION$/, /^[a-z]+-[a-z]+\d+$/, 'must be a region id'],
  [/^SERVICE_ACCOUNT$/, /^[a-z][a-z0-9-]{4,28}[a-z0-9]@[a-z0-9-]+\.iam\.gserviceaccount\.com$/, 'must be a service account email'],
  [/^(API_HOSTNAME|REGISTRY_HOST)$/, /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/, 'must be a DNS hostname'],
  [/^(SERVICE_NAME|PROJECT_ID|R2_BUCKET)$/, /^[a-z][a-z0-9-]{2,61}[a-z0-9]$/, 'must be a lowercase resource id'],
]

/** Every problem with a values object for a profile; empty means renderable. */
export function problems(profile, values) {
  const spec = PROFILES[profile]
  if (!spec) return [`unknown profile "${profile}" (expected ${Object.keys(PROFILES).join(' or ')})`]
  if (!values || typeof values !== 'object' || Array.isArray(values)) return ['values must be a JSON object']
  const out = Object.keys(values).filter((k) => !spec.keys.includes(k)).map((k) => `${k}: not used by ${profile}`)
  for (const key of spec.keys) {
    const v = values[key]
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
  return out
}

/** Rendered files for a valid profile: { relativePath: text }. */
export async function render(profile, values) {
  const errors = problems(profile, values)
  if (errors.length) throw new Error(`invalid ${profile} values:\n- ${errors.join('\n- ')}`)
  const files = {}
  for (const rel of PROFILES[profile].files) {
    const text = (await readFile(here(rel), 'utf8')).replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, k) => {
      if (!(k in values)) throw new Error(`template ${rel} uses ${k}, which ${profile} does not declare`)
      return values[k]
    })
    files[rel.split('/').pop()] = text
  }
  return files
}

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
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [profile, valuesPath, outDir] = process.argv.slice(2)
  try {
    if (!profile || !valuesPath || !outDir) throw new Error('usage: node ops/deploy/profiles.mjs <cloud-run|compute-engine> <values.json> <new-out-dir>')
    if (!PROFILES[profile]) throw new Error(problems(profile, {})[0])
    const values = JSON.parse(await readFile(valuesPath, 'utf8'))
    const files = await render(profile, values)
    // A fresh directory per render: one profile's output can never contaminate another's.
    await mkdir(outDir, { recursive: false })
    for (const [name, text] of Object.entries(files)) await writeFile(`${outDir}/${name}`, text, { flag: 'wx' })
    console.log(`Rendered ${profile} into ${outDir}. Nothing was deployed. After authorization, from that directory:`)
    for (const c of commands[profile](values)) console.log(`  ${c}`)
  } catch (error) {
    console.error(error.code === 'EEXIST' ? `refusing to reuse existing ${outDir}` : error.message)
    process.exitCode = 1
  }
}

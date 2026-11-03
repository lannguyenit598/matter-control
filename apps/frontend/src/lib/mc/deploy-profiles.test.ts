import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { isRuntimeSecretKey } from '../../../scripts/worker-build-env.mjs'

const read = (name: string) => readFileSync(join(__dirname, '../../..', name), 'utf8')

type Entry = { variable: string; value?: string; secret?: string; availability?: string }

/** Parses the flat `env:` list this repository writes in apphosting.yaml (no anchors, one key per line). */
function envEntries(text: string): Entry[] {
  const body = text.split(/^env:\s*$/m)[1] ?? ''
  return body
    .split(/^\s*-\s+(?=variable:)/m)
    .slice(1)
    .map((chunk) => {
      const entry: Record<string, string> = {}
      for (const m of chunk.matchAll(/^\s*(variable|value|secret|availability):\s*(.+?)\s*$/gm))
        entry[m[1]!] = m[2]!.replace(/^'(.*)'$/, '$1')
      return entry as Entry
    })
}

/** App Hosting invariants (ADR-007): every problem, by variable name only, never by value. */
function appHostingProblems(text: string): string[] {
  const problems: string[] = []
  if (/^\s*(buildCommand|runCommand):/m.test(text))
    problems.push('scripts override opts out of the Next.js adapter')
  const max = Number(text.match(/^\s*maxInstances:\s*(\d+)/m)?.[1])
  if (!(max >= 1 && max <= 10)) problems.push('runConfig.maxInstances must be set and small')
  const entries = envEntries(text)
  if (entries.length !== (text.match(/^\s*-\s+variable:/gm) ?? []).length)
    problems.push('unparsed env entry')
  const byName = new Map(entries.map((e) => [e.variable, e]))
  for (const e of entries) {
    // Omitted availability means BUILD and RUNTIME on App Hosting.
    if (!e.availability) problems.push(`${e.variable}: availability must be explicit`)
    if (e.secret !== undefined && e.availability !== '[RUNTIME]')
      problems.push(`${e.variable}: secrets must be RUNTIME only`)
    if (e.value !== undefined && isRuntimeSecretKey(e.variable))
      problems.push(`${e.variable}: secret-like variable must be a secret reference`)
    if (e.variable.startsWith('NEXT_PUBLIC_') && e.secret !== undefined)
      problems.push(`${e.variable}: secret in a browser variable`)
  }
  const expect = {
    BFF_STATE_BACKEND: 'postgres',
    AUTH_ALLOW_ANONYMOUS: 'false',
    SESSION_COOKIE_SECURE: 'true',
  }
  for (const [name, value] of Object.entries(expect))
    if (byName.get(name)?.value !== value) problems.push(`${name} must be ${value}`)
  for (const name of ['BFF_DATABASE_URL', 'BFF_STATE_KEYS'])
    if (byName.get(name)?.secret === undefined) problems.push(`${name} must be a secret reference`)
  return problems
}

describe('deployment profiles', () => {
  it('keeps the App Hosting profile durable, fail-closed and secrets runtime-only', () => {
    expect(appHostingProblems(read('apphosting.yaml'))).toEqual([])
  })

  it('rejects unsafe App Hosting variants', () => {
    const good = read('apphosting.yaml')
    const cases: [string, string][] = [
      [
        good.replace(
          /(secret: mc-bff-state-keys\n\s*availability:) \[RUNTIME\]/,
          '$1 [BUILD, RUNTIME]',
        ),
        'BFF_STATE_KEYS: secrets must be RUNTIME only',
      ],
      [
        good.replace(/\n\s*availability: \[RUNTIME\]\n(\s*- variable: BFF_STATE_KEYS)/, '\n$1'),
        'BFF_DATABASE_URL: availability must be explicit',
      ],
      [good.replace('value: postgres', 'value: memory'), 'BFF_STATE_BACKEND must be postgres'],
      [
        good + '  - variable: BFF_DATABASE_CA_X\n    value: x\n    availability: [RUNTIME]\n',
        'BFF_DATABASE_CA_X: secret-like variable must be a secret reference',
      ],
      [
        good.replace('runConfig:', 'scripts:\n  buildCommand: next build\nrunConfig:'),
        'scripts override opts out of the Next.js adapter',
      ],
      [good.replace(/maxInstances: \d+/, ''), 'runConfig.maxInstances must be set and small'],
    ]
    for (const [text, problem] of cases) expect(appHostingProblems(text)).toContain(problem)
  })

  it('keeps local secret files out of git, the App Hosting source (ADR-007)', () => {
    // The App Hosting adapter copies every app-root file into the server bundle, so a deployable
    // source tree must never contain these files.
    const ignored = read('.gitignore').split('\n')
    for (const line of ['.env*', '.dev.vars', '/.apphosting/']) expect(ignored).toContain(line)
  })

  it('keeps the Worker profile durable and free of secret vars', () => {
    const vars = JSON.parse(read('wrangler.jsonc').replace(/,(\s*[}\]])/g, '$1')).vars as Record<
      string,
      string
    >
    expect(vars.BFF_STATE_BACKEND).toBe('postgres')
    expect(vars.AUTH_ALLOW_ANONYMOUS).toBe('false')
    expect(Object.keys(vars).filter(isRuntimeSecretKey)).toEqual([])
  })
})

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const SRC = join(__dirname, '../..')
const TAG = /<ReadFailure\b[^>]*?\/>/g

function callers() {
  const out: { file: string; tag: string }[] = []
  for (const rel of readdirSync(SRC, { recursive: true, encoding: 'utf8' })) {
    if (!/\.tsx$/.test(rel) || /\.(test|stories)\.tsx$/.test(rel)) continue
    if (rel.endsWith('organisms/read-failure.tsx')) continue
    for (const tag of readFileSync(join(SRC, rel), 'utf8').match(TAG) ?? [])
      out.push({ file: rel, tag })
  }
  return out
}

/**
 * `partial` keeps drafts when a denial hits only a section of a page the user can still read.
 * Dropping it over-purges; putting it on a primary read lets a revoked scope's drafts revive.
 * Neither shows up in the component's own tests, so the placement is pinned here.
 */
describe('ReadFailure partial placement', () => {
  it('finds the primary and section call sites', () => {
    expect(callers().length).toBeGreaterThan(20)
  })

  it('is used only by the proof section of the work-item page', () => {
    const partial = callers().filter(({ tag }) => /\bpartial\b/.test(tag))
    expect(partial.map(({ file }) => file.replaceAll('\\', '/'))).toEqual([
      'app/(app)/matters/[matterId]/work/[itemId]/page.tsx',
    ])
    expect(partial[0]!.tag).toContain('subject="proof"')
  })
})

import { McError, codeFromType } from '@/lib/mc/errors'
import { GROUPS, searchInputSchema, searchResponseSchema, type SearchInput } from './schemas'

export async function searchRecords(input: SearchInput, signal: AbortSignal) {
  const checked = searchInputSchema.parse(input)
  const res = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(checked),
    signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { type?: unknown }
    throw new McError(codeFromType(body.type), res.status)
  }
  const parsed = searchResponseSchema.safeParse(await res.json())
  if (!parsed.success) throw new McError('internal', 502)
  const expected = checked.types ?? GROUPS
  if (
    Object.keys(parsed.data.groups).length !== expected.length ||
    expected.some((group) => !parsed.data.groups[group])
  )
    throw new McError('internal', 502)
  return parsed.data
}

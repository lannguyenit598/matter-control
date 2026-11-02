import { McError } from '@/lib/mc/errors'
import type { MyActions } from '../schemas'
import type { FocusTarget } from './model'

type Reads = {
  readActions(): Promise<{ actions: MyActions; asOf: string | null }>
  readTarget(target: FocusTarget): Promise<{ item: { kind: string } }>
  readMatterName(matterId: string): Promise<string>
}
export async function classifyFocus(input: { target?: FocusTarget; query?: string }, reads: Reads) {
  const { actions, asOf } = await reads.readActions()
  const names = new Map<string, string>()
  const describe = async (entry: MyActions['next'][number]) => {
    if (!names.has(entry.matterId))
      names.set(entry.matterId, await reads.readMatterName(entry.matterId))
    return {
      matterId: entry.matterId,
      actionId: entry.item.id,
      title: entry.item.title,
      matterName: names.get(entry.matterId)!,
      reason: entry.reason,
    }
  }
  if (input.target) {
    const target = input.target
    const match = (entry: MyActions['next'][number]) =>
      entry.matterId === target.matterId && entry.item.id === target.actionId
    const ready = actions.next.find(match)
    if (ready?.item.kind === 'ACTION')
      return { kind: 'eligible' as const, target: await describe(ready), asOf }
    try {
      await reads.readTarget(target)
      const classified = [...actions.waiting, ...actions.blocked, ...actions.historical].find(match)
      return { kind: 'ineligible' as const, asOf, reason: classified?.class ?? 'REASSIGNED' }
    } catch (error) {
      if (error instanceof McError && ['forbidden', 'not-found'].includes(error.code))
        return { kind: 'access-lost' as const, asOf }
      throw error
    }
  }
  const query = (input.query ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
  const matching = actions.next.filter(
    (entry) =>
      entry.item.kind === 'ACTION' &&
      entry.item.title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .toLowerCase()
        .includes(query),
  )
  const candidates = []
  for (const entry of matching.slice(0, 20)) candidates.push(await describe(entry))
  return { kind: 'candidates' as const, candidates, truncated: matching.length > 20, asOf }
}

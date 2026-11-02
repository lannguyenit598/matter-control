import { expect, it } from 'vitest'
import { classifyFocus } from './eligibility'
import { McError } from '@/lib/mc/errors'
import type { Assigned, MyActions } from '../schemas'

const entry = (id: string): Assigned =>
  ({
    matterId: 'matter',
    item: { id, title: `Action ${id}`, kind: 'ACTION' },
    class: 'ELIGIBLE',
    reason: 'ready',
  }) as Assigned
const actions = (next: Assigned[]): MyActions => ({
  next,
  waiting: [],
  blocked: [],
  historical: [],
})
it('starts an exact eligible Action beyond the picker cap, preserving server order', async () => {
  const next = Array.from({ length: 22 }, (_, i) => entry(`a${i}`))
  const reads = {
    readActions: async () => ({ actions: actions(next), asOf: 'now' }),
    readTarget: async () => {
      throw new Error('not needed')
    },
    readMatterName: async () => 'Atlas',
  }
  expect(
    await classifyFocus({ target: { matterId: 'matter', actionId: 'a21' } }, reads),
  ).toMatchObject({
    kind: 'eligible',
    target: { actionId: 'a21', title: 'Action a21', matterName: 'Atlas' },
  })
  expect(await classifyFocus({}, reads)).toMatchObject({
    kind: 'candidates',
    truncated: true,
    candidates: next.slice(0, 20).map((x) => ({ actionId: x.item.id })),
  })
})
it('does not equate absence or failed name read with revocation', async () => {
  const reads = {
    readActions: async () => ({ actions: actions([]), asOf: 'now' }),
    readTarget: async () => ({ item: { kind: 'ACTION' } }),
    readMatterName: async () => 'Atlas',
  }
  expect(
    await classifyFocus({ target: { matterId: 'matter', actionId: 'a' } }, reads),
  ).toMatchObject({ kind: 'ineligible' })
  expect(
    await classifyFocus(
      { target: { matterId: 'matter', actionId: 'a' } },
      {
        ...reads,
        readTarget: async () => {
          throw new McError('not-found', 404)
        },
      },
    ),
  ).toMatchObject({ kind: 'access-lost' })
  await expect(
    classifyFocus(
      { target: { matterId: 'matter', actionId: 'a' } },
      {
        ...reads,
        readActions: async () => ({ actions: actions([entry('a')]), asOf: 'now' }),
        readMatterName: async () => {
          throw new McError('unavailable', 503)
        },
      },
    ),
  ).rejects.toMatchObject({ code: 'unavailable' })
})

import { z } from 'zod'
import { McError, codeFromType } from '@/lib/mc/errors'
import { uiSessionSchema } from '@/lib/ui-session'
import { targetSchema, type FocusTarget } from './model'

export const focusDescriptionSchema = targetSchema.extend({
  title: z.string(),
  matterName: z.string(),
  reason: z.string(),
})
const base = z.object({
  identity: uiSessionSchema,
  checkedAt: z.iso.datetime(),
  asOf: z.string().nullable(),
})
export const focusReplySchema = z.discriminatedUnion('kind', [
  base.extend({ kind: z.literal('eligible'), target: focusDescriptionSchema }),
  base.extend({
    kind: z.literal('candidates'),
    candidates: z.array(focusDescriptionSchema).max(20),
    truncated: z.boolean(),
  }),
  base.extend({ kind: z.literal('ineligible'), reason: z.string() }),
  base.extend({ kind: z.literal('access-lost') }),
])
export type FocusDescription = z.infer<typeof focusDescriptionSchema>
export async function readFocus(
  epoch: string,
  target?: FocusTarget,
  query?: string,
  signal?: AbortSignal,
) {
  const response = await fetch('/api/focus/eligibility', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      epoch,
      target: target ? { matterId: target.matterId, actionId: target.actionId } : undefined,
      query,
    }),
    signal: AbortSignal.any([AbortSignal.timeout(10_000), ...(signal ? [signal] : [])]),
    cache: 'no-store',
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { type?: unknown }
    throw new McError(codeFromType(body.type), response.status)
  }
  const parsed = focusReplySchema.safeParse(await response.json())
  if (!parsed.success) throw new McError('internal', 502)
  return parsed.data
}

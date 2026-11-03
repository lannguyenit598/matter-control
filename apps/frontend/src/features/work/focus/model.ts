import { z } from 'zod'
import { uiSessionSchema, type UiSession } from '@/lib/ui-session'
import { idSchema } from '@/lib/mc/schemas'

export const targetSchema = z.object({ matterId: idSchema, actionId: idSchema }).strict()
export type FocusTarget = z.infer<typeof targetSchema>
const safeTime = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const activeSchema = uiSessionSchema
  .extend({
    sessionId: z.string().min(1).max(100),
    matterId: idSchema,
    actionId: idSchema,
    state: z.enum(['RUNNING', 'PAUSED', 'SUSPENDED']),
    remainingMs: safeTime,
    deadlineWallMs: safeTime.optional(),
    writtenAtWallMs: safeTime,
  })
  .strict()
  .refine((a) =>
    a.state === 'RUNNING'
      ? Number.isSafeInteger(a.writtenAtWallMs + a.remainingMs) &&
        a.deadlineWallMs === a.writtenAtWallMs + a.remainingMs
      : a.deadlineWallMs === undefined,
  )
export const slotSchema = z
  .object({
    schema: z.literal(1),
    generation: z.string().min(1).max(100),
    revision: safeTime,
    active: activeSchema.nullable(),
  })
  .strict()
export type FocusSlot = z.infer<typeof slotSchema>
export type FocusActive = z.infer<typeof activeSchema>
export type FocusCommand =
  | { type: 'start'; target: FocusTarget; minutes: 15 | 25 | 50 }
  | { type: 'pause' | 'resume' | 'extend' | 'end' | 'suspend' | 'dismiss' }

export const emptySlot = (generation: string): FocusSlot => ({
  schema: 1,
  generation,
  revision: 0,
  active: null,
})
export function remaining(active: FocusActive, now: number): number {
  return Math.max(
    0,
    Math.min(
      active.remainingMs,
      active.state === 'RUNNING' ? (active.deadlineWallMs ?? now) - now : active.remainingMs,
    ),
  )
}

/** A successful shared commit, never an interval tick, advances the revision. */
export function transition(
  slot: FocusSlot,
  command: FocusCommand,
  identity: UiSession,
  now: number,
  nonce: string,
  eligible: boolean,
): FocusSlot | null {
  if (
    !slotSchema.safeParse(slot).success ||
    !uiSessionSchema.safeParse(identity).success ||
    !Number.isSafeInteger(now) ||
    now < 0 ||
    slot.revision === Number.MAX_SAFE_INTEGER
  )
    return null
  const active = slot.active
  if (active && (active.principalKey !== identity.principalKey || active.epoch !== identity.epoch))
    return null
  if (command.type === 'end' || command.type === 'dismiss') {
    return { schema: 1, generation: nonce, revision: slot.revision + 1, active: null }
  }
  if (Date.parse(identity.validUntil) <= now) return null
  let next: FocusActive
  if (command.type === 'start') {
    if (
      active ||
      !eligible ||
      ![15, 25, 50].includes(command.minutes) ||
      !targetSchema.safeParse(command.target).success
    )
      return null
    next = {
      ...identity,
      ...command.target,
      sessionId: nonce,
      state: 'RUNNING',
      remainingMs: command.minutes * 60_000,
      deadlineWallMs: now + command.minutes * 60_000,
      writtenAtWallMs: now,
    }
  } else {
    if (!active || remaining(active, now) <= 0) return null
    if (command.type === 'suspend' && active.state === 'SUSPENDED') return slot
    if (now < active.writtenAtWallMs && command.type !== 'suspend') return null
    const left = Math.min(active.remainingMs, remaining(active, now))
    next = { ...active, ...identity, remainingMs: left, writtenAtWallMs: now }
    delete next.deadlineWallMs
    if (command.type === 'pause') {
      if (active.state !== 'RUNNING') return null
      next.state = 'PAUSED'
    } else if (command.type === 'suspend') {
      next.state = 'SUSPENDED'
    } else if (command.type === 'resume') {
      if (active.state === 'RUNNING' || !eligible) return null
      next.state = 'RUNNING'
      next.deadlineWallMs = now + left
    } else if (command.type === 'extend') {
      if (active.state === 'SUSPENDED') return null
      next.remainingMs += 300_000
      if (next.state === 'RUNNING') next.deadlineWallMs = now + next.remainingMs
    }
  }
  const result = { ...slot, revision: slot.revision + 1, active: next }
  return slotSchema.safeParse(result).success ? result : null
}

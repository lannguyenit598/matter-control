import 'server-only'

import { createHash, randomBytes } from 'node:crypto'

import { oidcConfig } from '@/lib/oidc/config'
import { durableState } from '@/lib/oidc/durable-state'
import { withPersistentSession } from '@/lib/oidc/session-persistence'
import { McError } from '@/lib/mc/errors'

import { reconcileOutcomes, type RowOutcome } from './intent'
import type { BulkCommitInput, ImportPlan } from './schemas'

export type PendingAttempt = { matterId: string } & (
  | { kind: 'bulk'; input: BulkCommitInput }
  | {
      kind: 'import'
      upload: { sourceName: string; format: string; content: Uint8Array }
      plan: ImportPlan
    }
)
type Slot = {
  attempt?: PendingAttempt
  blocked?: string
  running?: boolean
  settled?: boolean
  results?: RowOutcome[]
  executionId?: string
  runningUntil?: number
}
const g = globalThis as typeof globalThis & {
  __mcPendingTransfers?: WeakMap<object, Map<string, Slot>>
}
const sessions = (g.__mcPendingTransfers ??= new WeakMap<object, Map<string, Slot>>())

// shortcut: follows the local process-only BFF session lifetime; production restart recovery needs durable storage.
// Two bounded slots per session. No legal payload or tokens are written to browser storage or logs.
export function attemptSlots(session: object) {
  let slots = sessions.get(session)
  if (!slots) {
    slots = new Map()
    sessions.set(session, slots)
  }
  return slots
}

export function attemptRows(attempt: PendingAttempt) {
  return attempt.kind === 'bulk'
    ? attempt.input.rows.map((row) => row.rowKey)
    : Object.keys(attempt.plan.rowKeys)
}

function identity(attempt: PendingAttempt) {
  return JSON.stringify(
    attempt.kind === 'bulk'
      ? [attempt.matterId, attempt.input]
      : [
          attempt.matterId,
          attempt.plan,
          attempt.upload.sourceName,
          attempt.upload.format,
          createHash('sha256').update(attempt.upload.content).digest('hex'),
        ],
  )
}

export function beginAttempt(session: object, proposed: PendingAttempt): PendingAttempt | null {
  const slots = attemptSlots(session)
  const slot = slots.get(proposed.kind)
  if (slot?.blocked || slot?.running || slot?.settled || slot?.results) return null
  if (slot?.attempt && identity(slot.attempt) !== identity(proposed)) return null
  const attempt = slot?.attempt ?? structuredClone(proposed)
  slots.set(proposed.kind, { attempt, running: true })
  return attempt
}

export function endAttempt(session: object, attempt: PendingAttempt, results?: RowOutcome[]) {
  const slots = attemptSlots(session)
  const slot = slots.get(attempt.kind)
  if (slot?.attempt !== attempt) return
  slot.running = false
  if (
    results &&
    !reconcileOutcomes(results, attemptRows(attempt)).some((row) => row.status === 'UNKNOWN')
  ) {
    slot.settled = true
    slot.results = structuredClone(reconcileOutcomes(results, attemptRows(attempt)))
  }
}

export function revokeAttempts(session: object, matterId: string) {
  for (const [kind, slot] of attemptSlots(session)) {
    if (slot.attempt?.matterId === matterId) {
      // Purge protected data permanently; retain only a refusal marker, never revive on re-grant.
      attemptSlots(session).set(kind, { blocked: matterId })
    }
  }
}

/** Only the caller that received a complete result may acknowledge and release the payload. */
export function acknowledgeAttempt(
  session: object,
  kind: 'bulk' | 'import',
  matterId: string,
  key: string,
) {
  const slots = attemptSlots(session),
    slot = slots.get(kind),
    attempt = slot?.attempt
  if (!slot?.settled || !attempt || attempt.matterId !== matterId) return false
  if ((attempt.kind === 'bulk' ? attempt.input.attemptKey : attempt.plan.runKey) !== key)
    return false
  slots.delete(kind)
  return true
}

type DurableIdentity = object & { sessionHandle?: string }
const executions = new WeakMap<PendingAttempt, string>()

/** Every durable update also checks the parent session under its logout lock. */
async function withSlots<R>(session: DurableIdentity, write: boolean, body: (local: object) => R) {
  const store = durableState()
  if (!store) return body(session)
  const cfg = oidcConfig()
  if (!cfg || !session.sessionHandle) throw new McError('unauthenticated', 401)
  const result = await withPersistentSession(
    cfg,
    session.sessionHandle,
    store,
    async (tx, key, rec) => {
      const local = {}
      const slots = new Map<string, Slot>()
      for (const kind of ['bulk', 'import']) {
        const slot = await tx.read<Slot>(`${key}:attempt:${kind}`)
        if (slot) slots.set(kind, slot)
      }
      sessions.set(local, slots)
      const value = body(local)
      if (write) {
        for (const kind of ['bulk', 'import']) {
          const slot = slots.get(kind)
          const slotKey = `${key}:attempt:${kind}`
          if (slot) await tx.write(slotKey, slot, rec.createdAt + cfg.absoluteMs)
          else await tx.removeFamily(slotKey)
        }
      }
      return { value }
    },
  )
  if (!result) throw new McError('unauthenticated', 401)
  return result.value
}

export async function beginAttemptAsync(session: DurableIdentity, proposed: PendingAttempt) {
  if (!durableState()) return beginAttempt(session, proposed)
  return withSlots(session, true, (local) => {
    const slots = attemptSlots(local)
    const slot = slots.get(proposed.kind)
    // Only an explicit retry enters here. A crashed dispatcher retains the SAME payload/keys.
    if (slot?.running && slot.runningUntil && slot.runningUntil <= Date.now()) slot.running = false
    const attempt = beginAttempt(local, proposed)
    if (attempt) {
      const id = randomBytes(16).toString('hex')
      const current = slots.get(proposed.kind)!
      current.executionId = id
      current.runningUntil = Date.now() + 90_000
      executions.set(attempt, id)
    }
    return attempt
  })
}

export async function endAttemptAsync(
  session: DurableIdentity,
  attempt: PendingAttempt,
  results?: RowOutcome[],
) {
  if (!durableState()) return endAttempt(session, attempt, results)
  return withSlots(session, true, (local) => {
    const slot = attemptSlots(local).get(attempt.kind)
    if (
      !slot?.attempt ||
      slot.executionId !== executions.get(attempt) ||
      identity(slot.attempt) !== identity(attempt)
    )
      return
    // The durable copy has a different object identity after deserialization.
    slot.attempt = attempt
    endAttempt(local, attempt, results)
    delete slot.executionId
    delete slot.runningUntil
  })
}

export async function attemptSlotsAsync(session: DurableIdentity) {
  return withSlots(session, false, (local) => attemptSlots(local))
}

export async function revokeAttemptsAsync(session: DurableIdentity, matterId: string) {
  return withSlots(session, true, (local) => revokeAttempts(local, matterId))
}

export async function acknowledgeAttemptAsync(
  session: DurableIdentity,
  kind: 'bulk' | 'import',
  matterId: string,
  key: string,
) {
  return withSlots(session, true, (local) => acknowledgeAttempt(local, kind, matterId, key))
}

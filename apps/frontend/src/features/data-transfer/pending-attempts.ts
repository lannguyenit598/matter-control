import 'server-only'

import { createHash } from 'node:crypto'

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

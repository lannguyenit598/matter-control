import { McError, type McRejection } from './errors'

/**
 * Serializable result of a product Server Action. `kind` drives the recovery the UI offers:
 *  - outcome-unknown, receipted creation (`retrySameKey`): no rollback is asserted; the SAME
 *    request with the SAME idempotency key is safe (the server replays or reconciles)
 *  - outcome-unknown, CAS-only command (`requiresReread`): no rollback is asserted AND it must
 *    not be resent. The caller re-reads current state with its own rights and decides a NEW
 *    intent; a current state or a 412 proves nothing about the earlier attempt
 *  - stale: the resource changed; reload, then decide again
 *  - unavailable: the service is down; the session is fine, try again later
 */
export type McActionResult =
  | { ok: true; id?: string; replayed?: boolean }
  | {
      ok: false
      kind:
        | 'validation'
        | 'unauthenticated'
        | 'forbidden'
        | 'not-found'
        | 'stale'
        | 'unavailable'
        | 'outcome-unknown'
        | 'key-conflict'
        | 'last-owner'
        | 'rejected'
        | 'error'
      error: string
      fieldErrors?: Record<string, string[]>
      /** True when resubmitting the identical request (same key) is the correct recovery. */
      retrySameKey?: boolean
      /** True when resending is NOT safe and the caller must re-read before a new intent. */
      requiresReread?: boolean
      /** For `rejected`: the domain's own reason, allowed alternatives, failed gates, cycle path. */
      rejection?: McRejection
    }

export const MESSAGES = {
  unauthenticated: 'Your session has ended. Sign in again to continue.',
  forbidden: 'You do not have permission to do this.',
  'not-found': 'This item no longer exists or you no longer have access to it.',
  stale: 'This changed since you opened it. Reload to see the latest version, then try again.',
  unavailable:
    'The service is temporarily unavailable. Your session is unaffected; try again shortly.',
  'outcome-unknown':
    'We could not confirm whether this was saved, and we are not assuming it failed. Retry to confirm: the same request is safe to send again.',
  'outcome-unknown-reread':
    'We could not confirm whether this change was applied, and we are not assuming it failed or was rolled back. It must not be sent again. Reload to read the current state, then decide whether a new change is still needed. If the change removed your access, you may not be able to read it back.',
  'key-conflict':
    'This form was already submitted with different content. Reload the page to start again.',
  'last-owner': 'The last owner cannot be removed. Transfer ownership to another member first.',
  error: 'Something went wrong. Please try again.',
} as const

function fieldMap(error: McError): Record<string, string[]> | undefined {
  if (error.fieldErrors.length === 0) return undefined
  const out: Record<string, string[]> = {}
  for (const f of error.fieldErrors) (out[f.field] ??= []).push(f.message)
  return out
}

function unknownOutcome(receipted: boolean): McActionResult & { ok: false } {
  return receipted
    ? { ok: false, kind: 'outcome-unknown', error: MESSAGES['outcome-unknown'], retrySameKey: true }
    : {
        ok: false,
        kind: 'outcome-unknown',
        error: MESSAGES['outcome-unknown-reread'],
        requiresReread: true,
      }
}

/** Maps any thrown error to a safe, user-facing result. Messages come from this table only. */
export function toMcFailure(error: unknown): McActionResult & { ok: false } {
  // AuthError (src/lib/auth.ts is server-only): matched by name, like the template's action-result.
  if (error instanceof Error && error.name === 'AuthError') {
    const forbidden = (error as Error & { reason?: string }).reason === 'forbidden'
    const kind = forbidden ? 'forbidden' : 'unauthenticated'
    return { ok: false, kind, error: MESSAGES[kind] }
  }
  if (!(error instanceof McError)) {
    console.error(error)
    return { ok: false, kind: 'error', error: MESSAGES.error }
  }
  switch (error.code) {
    case 'unauthenticated':
      return { ok: false, kind: 'unauthenticated', error: MESSAGES.unauthenticated }
    case 'forbidden':
      return { ok: false, kind: 'forbidden', error: MESSAGES.forbidden }
    case 'not-found':
      return { ok: false, kind: 'not-found', error: MESSAGES['not-found'] }
    case 'precondition-failed':
      return { ok: false, kind: 'stale', error: MESSAGES.stale }
    case 'validation':
      return {
        ok: false,
        kind: 'validation',
        error: 'Please fix the highlighted fields.',
        fieldErrors: fieldMap(error),
      }
    case 'idempotency-key-reuse':
    case 'idempotency-key-expired':
      return { ok: false, kind: 'key-conflict', error: MESSAGES['key-conflict'] }
    case 'last-owner':
      return { ok: false, kind: 'last-owner', error: MESSAGES['last-owner'] }
    case 'rejected': {
      const rejection = error.rejection
      return {
        ok: false,
        kind: 'rejected',
        error: describeRejection(rejection?.code ?? 'rejected'),
        rejection,
      }
    }
    case 'payload-too-large':
      return {
        ok: false,
        kind: 'validation',
        error: 'That file is larger than the upload limit. Nothing was stored.',
        fieldErrors: { file: ['The file is larger than the upload limit.'] },
      }
    case 'unavailable':
    case 'content-unavailable':
    case 'boundary-due':
      return { ok: false, kind: 'unavailable', error: MESSAGES.unavailable }
    case 'outcome-unknown':
      return unknownOutcome(error.receipted)
    default:
      // precondition-required / malformed / bad-request mean a frontend bug, not a user error.
      console.error(error)
      return { ok: false, kind: 'error', error: MESSAGES.error }
  }
}

/**
 * Client wrapper for a Server Action call. A rejected call for a command (network drop, deploy
 * skew) is an UNKNOWN outcome: the request may have reached the server, never "it failed".
 * What recovery is allowed depends on the command: `receipted` commands (creation with an
 * idempotency key) may retry with the same key; CAS-only commands may not be resent.
 */
export async function callMcAction(
  action: () => Promise<McActionResult>,
  options: { receipted: boolean },
): Promise<McActionResult> {
  try {
    return await action()
  } catch (error) {
    console.error(error)
    return unknownOutcome(options.receipted)
  }
}

/**
 * User-facing wording per stable rejection code. Only this table reaches the screen: server
 * text is never echoed. Unknown codes fall back to a generic refusal that still says nothing
 * was changed.
 */
export function describeRejection(code: string): string {
  switch (code) {
    case 'dependency-blocked':
      return 'This cannot proceed yet: prerequisites are not satisfied. Nothing was changed.'
    case 'transition-not-allowed':
      return 'That change of status is not allowed from the current status. Nothing was changed.'
    case 'waiting-details-required':
      return 'Waiting needs the party you are waiting on and the condition. Nothing was changed.'
    case 'waiting-owner-required':
      return 'Waiting needs a responsible internal owner. Assign an owner first. Nothing was changed.'
    case 'reason-required':
      return 'A reason is required for this change. Nothing was changed.'
    case 'completion-time-required':
      return 'Enter when the work was actually completed. Nothing was changed.'
    case 'completion-in-future':
      return 'The completion time cannot be in the future. Nothing was changed.'
    case 'owner-not-member':
      return 'The assignee must already be an active member of this matter. Assignment never grants access. Nothing was changed.'
    case 'unknown-workstream':
      return 'That workstream does not exist in this matter. Nothing was changed.'
    case 'unknown-party':
      return 'That external party does not exist in this matter. Nothing was changed.'
    case 'cycle':
      return 'That dependency would create a loop between records. Nothing was changed.'
    case 'self-edge':
      return 'A record cannot depend on itself. Nothing was changed.'
    case 'duplicate-edge':
      return 'That dependency already exists. Nothing was changed.'
    case 'cross-matter':
      return 'Both records must belong to this matter. Nothing was changed.'
    case 'invalid-gate':
      return 'Choose either a completion gate or a proof gate. Nothing was changed.'
    case 'prerequisite-not-requirement':
      return 'Milestone prerequisites must be Requirements of this matter. Nothing was changed.'
    case 'not-verifier':
      return 'Only a designated verifier may review proof. Nothing was changed.'
    case 'self-evidence':
    case 'self-claim':
      return 'Nobody reviews proof they supplied or offered. Nothing was changed.'
    case 'stale-review':
      return 'The record was reopened since you read it. Reload and review the current proof. Nothing was changed.'
    case 'stale-criterion-revision':
      return 'The criterion changed after this claim. Offer the evidence again. Nothing was changed.'
    case 'evidence-withdrawn':
      return 'Withdrawn evidence cannot be used. Nothing was changed.'
    case 'version-not-current':
      return 'This criterion needs the current version, which is not the one assessed. Nothing was changed.'
    case 'assessed-version-mismatch':
      return 'State the exact version you assessed; it must be the evidence’s version. Nothing was changed.'
    case 'version-mismatch':
    case 'evidence-kind-incompatible':
      return 'That evidence does not fit the version this criterion requires. Nothing was changed.'
    case 'impact-acknowledgement-required':
      return 'Acknowledge the impact of promoting exactly this version. Nothing was changed.'
    case 'mandatory-criteria-exist':
      return 'Retire the mandatory criteria before declaring proof not required. Nothing was changed.'
    case 'open-dispute':
    case 'already-disputed':
      return 'There is an unresolved dispute. Resolve it first. Nothing was changed.'
    case 'invalid-filename':
      return 'The file name is empty, too long or contains a path or control characters. Nothing was stored.'
    case 'proof-not-required':
      return 'This record does not require proof. Nothing was changed.'
    case 'verifier-role':
    case 'verifier-not-member':
      return 'A verifier must be an active matter member with the Editor or Owner role. Nothing was changed.'
    default:
      return 'The change was refused. Nothing was changed.'
  }
}

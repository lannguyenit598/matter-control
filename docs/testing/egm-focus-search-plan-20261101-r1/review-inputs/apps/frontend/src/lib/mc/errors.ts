/**
 * Product API problems (contract §3), shared by server and client code. A problem's `type` is a
 * stable URN (`urn:mc:<code>`); the UI decides from the code, never from message text.
 */
export type McCode =
  | 'unauthenticated'
  | 'forbidden'
  | 'last-owner'
  | 'not-found'
  | 'precondition-failed'
  | 'precondition-required'
  | 'precondition-not-applicable'
  | 'validation'
  | 'idempotency-key-reuse'
  | 'idempotency-key-expired'
  | 'malformed-body'
  | 'bad-request'
  | 'unsupported-media-type'
  | 'payload-too-large'
  | 'content-unavailable'
  | 'rejected'
  | 'unavailable'
  | 'boundary-due'
  | 'outcome-unknown'
  | 'brief-unreconstructable'
  | 'invalid-window'
  | 'internal'
  | 'unknown'

export type McFieldError = { field: string; message: string }

/** A guarded domain refusal (409 urn:mc:rejected): nothing was changed, and the body says why. */
export type McRejection = {
  code: string
  message: string
  /** Execution states the item may move to instead. */
  alternatives: string[]
  /** Failed dependency gates; the completion gate and the proof gate stay distinguishable. */
  gates: { edgeId: string; sourceId: string; gate: string; code: string }[]
  /** The cycle a refused edge would have closed, as record ids. */
  path: string[]
}

export class McError extends Error {
  readonly status: number
  readonly code: McCode
  readonly retryable: boolean
  readonly fieldErrors: McFieldError[]
  /**
   * For `outcome-unknown`: whether the command carried an idempotency key, i.e. is receipted
   * (contract §2.1). Only then can the same request be replayed or reconciled. Membership
   * commands are CAS/audit only: their unknown outcome is never a safe resend.
   */
  readonly receipted: boolean
  readonly rejection?: McRejection

  constructor(
    code: McCode,
    status: number,
    options: {
      retryable?: boolean
      fieldErrors?: McFieldError[]
      receipted?: boolean
      rejection?: McRejection
      cause?: unknown
    } = {},
  ) {
    super(`product API problem: ${code}`, { cause: options.cause })
    this.name = 'McError'
    this.code = code
    this.status = status
    this.retryable = options.retryable ?? false
    this.fieldErrors = options.fieldErrors ?? []
    this.receipted = options.receipted ?? false
    this.rejection = options.rejection
  }
}

const KNOWN = new Set<McCode>([
  'unauthenticated',
  'forbidden',
  'last-owner',
  'not-found',
  'precondition-failed',
  'precondition-required',
  'precondition-not-applicable',
  'validation',
  'idempotency-key-reuse',
  'idempotency-key-expired',
  'malformed-body',
  'bad-request',
  'unsupported-media-type',
  'payload-too-large',
  'content-unavailable',
  'rejected',
  'unavailable',
  'boundary-due',
  'outcome-unknown',
  'brief-unreconstructable',
  'invalid-window',
  'internal',
])

/** `urn:mc:not-found` -> `not-found`; anything else is `unknown` (never trusted for display). */
export function codeFromType(type: unknown): McCode {
  if (typeof type !== 'string' || !type.startsWith('urn:mc:')) return 'unknown'
  const code = type.slice('urn:mc:'.length) as McCode
  return KNOWN.has(code) ? code : 'unknown'
}

/** How a read failure should be presented; one mapping for every page. */
export type ReadFailureKind = 'sign-in' | 'forbidden' | 'not-found' | 'unavailable' | 'error'

export function readFailureKind(error: unknown): ReadFailureKind {
  if (error instanceof Error && error.name === 'AuthError') return 'sign-in'
  if (!(error instanceof McError)) return 'error'
  switch (error.code) {
    case 'unauthenticated':
      return 'sign-in'
    case 'forbidden':
      return 'forbidden'
    case 'not-found':
      return 'not-found'
    case 'unavailable':
    case 'content-unavailable':
    case 'boundary-due':
      return 'unavailable'
    default:
      return 'error'
  }
}

export type Attempt<T> = { ok: true; value: T } | { ok: false; kind: ReadFailureKind }

/**
 * Runs a read and turns a failure into the state to render, so pages never build JSX inside
 * try/catch. Unexpected errors are logged once, server-side, and shown as a generic state.
 */
export async function attempt<T>(read: () => Promise<T>): Promise<Attempt<T>> {
  try {
    return { ok: true, value: await read() }
  } catch (error) {
    const kind = readFailureKind(error)
    if (kind === 'error') console.error(error)
    return { ok: false, kind }
  }
}

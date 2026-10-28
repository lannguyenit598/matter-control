import 'server-only'

import type { z } from 'zod'

import { requireSession } from '@/lib/auth'
import { serverEnv } from '@/lib/env'

import { codeFromType, McError, type McFieldError, type McRejection } from './errors'

export type McResponse<T> = {
  data: T
  /** Strong ETag of the exact representation; send it back as If-Match. */
  etag: string | null
  status: number
  /** Read instant of the snapshot (MC-As-Of), when the API reports one. */
  asOf: string | null
  /** True when the API replayed a stored outcome for this idempotency key. */
  replayed: boolean
}

export type McRequest<T> = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT'
  query?: Record<string, string | number | undefined>
  body?: unknown
  /** A raw (non-JSON) request body, e.g. a document upload streamed through the BFF. */
  raw?: { body: BodyInit; contentType: string; headers?: Record<string, string> }
  ifMatch?: string | null
  idempotencyKey?: string
  /**
   * The command is receipted although it carries no Idempotency-Key header (bulk and import send
   * one key per row inside the body): an unknown outcome is then recoverable by resending the same
   * keys.
   */
  receiptedInBody?: boolean
  schema: z.ZodType<T>
  timeoutMs?: number
}

const ID = /^[A-Za-z0-9_-]{1,100}$/

/** Ids interpolated into API paths use the allowlist (R-SEC-4); anything else never leaves the server. */
export function pathId(id: string): string {
  if (!ID.test(id)) throw new McError('not-found', 404)
  return id
}

/**
 * Calls the product API from the server with the signed-in user's own token. The browser never
 * sees the bearer. A failed COMMAND whose answer was lost (timeout, dropped connection) is an
 * unknown outcome, never a plain failure: the caller must retry with the SAME key.
 */
export async function mcRequest<T>(path: string, req: McRequest<T>): Promise<McResponse<T>> {
  if (serverEnv.API_MODE !== 'rest') throw new McError('unavailable', 503)
  const session = await requireSession()
  const method = req.method ?? 'GET'
  const url = new URL(`${serverEnv.API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`)
  for (const [k, v] of Object.entries(req.query ?? {}))
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v))

  const headers = new Headers({ Accept: 'application/json' })
  const token = session.accessToken
  if (!token) throw new McError('unauthenticated', 401)
  headers.set('Authorization', `Bearer ${token}`)
  if (req.body !== undefined) headers.set('Content-Type', 'application/json')
  if (req.raw) {
    headers.set('Content-Type', req.raw.contentType)
    for (const [k, v] of Object.entries(req.raw.headers ?? {})) headers.set(k, v)
  }
  if (req.ifMatch) headers.set('If-Match', req.ifMatch)
  if (req.idempotencyKey) headers.set('Idempotency-Key', req.idempotencyKey)

  const command = method !== 'GET'
  const receipted = req.idempotencyKey !== undefined || req.receiptedInBody === true
  // A lost or unusable answer is UNKNOWN for a command (it may have committed) and plain
  // unavailability for a read. Only transport/body-consumption failures are caught here:
  // programmer errors elsewhere propagate.
  const lost = (cause: unknown) =>
    command
      ? new McError('outcome-unknown', 503, { receipted, cause })
      : new McError('unavailable', 503, { retryable: true, cause })

  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers,
      body: req.raw ? req.raw.body : req.body === undefined ? undefined : JSON.stringify(req.body),
      // A streamed request body needs half-duplex fetch (undici); it is not in lib.dom's types.
      ...(req.raw && typeof req.raw.body !== 'string' ? { duplex: 'half' } : {}),
      signal: AbortSignal.timeout(req.timeoutMs ?? serverEnv.API_TIMEOUT_MS),
      cache: 'no-store',
    })
  } catch (cause) {
    throw lost(cause)
  }

  let text: string | undefined
  try {
    text = await res.text()
  } catch (cause) {
    // The status is known but the body was lost. A success cannot be used, and may have
    // committed: unknown. A definite refusal (4xx) keeps its status-derived meaning; a
    // 5xx on a command says nothing about whether it committed: unknown.
    if (res.ok || res.status >= 500) throw lost(cause)
    throw problemFrom(res.status, undefined, { command, receipted })
  }
  let json: unknown
  try {
    json = text ? JSON.parse(text) : undefined
  } catch {
    // skip: a non-JSON body (proxy error page) is classified by status or treated as unusable
    json = undefined
    if (res.ok) throw lost(new SyntaxError('unusable response body'))
  }

  if (!res.ok) throw problemFrom(res.status, json, { command, receipted })

  const parsed = req.schema.safeParse(json)
  if (!parsed.success) {
    // A committed command whose answer cannot be used is unknown to the caller; a read that
    // violates the contract is an internal contract error, not an outage.
    throw command ? lost(parsed.error) : new McError('internal', 502, { cause: parsed.error })
  }
  return {
    data: parsed.data,
    etag: res.headers.get('ETag'),
    status: res.status,
    asOf: res.headers.get('MC-As-Of'),
    replayed: res.headers.get('Idempotent-Replayed') === 'true',
  }
}

/**
 * Streams a document's bytes through the BFF. Only the response headers that describe the
 * download are passed on; the body is never buffered or rendered here. A refusal is mapped like
 * any other API answer (session ended, no access, content unavailable).
 */
export async function mcDownload(path: string, timeoutMs?: number): Promise<Response> {
  if (serverEnv.API_MODE !== 'rest') throw new McError('unavailable', 503)
  const session = await requireSession()
  if (!session.accessToken) throw new McError('unauthenticated', 401)
  const url = `${serverEnv.API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
  let res: Response
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      signal: AbortSignal.timeout(timeoutMs ?? serverEnv.API_TIMEOUT_MS),
      cache: 'no-store',
    })
  } catch (cause) {
    throw new McError('unavailable', 503, { retryable: true, cause })
  }
  if (!res.ok) {
    let json: unknown
    try {
      json = await res.json()
    } catch {
      // skip: a non-JSON refusal is classified by status alone
      json = undefined
    }
    throw problemFrom(res.status, json)
  }
  return res
}

export function problemFrom(
  status: number,
  json: unknown,
  ctx: { command?: boolean; receipted?: boolean } = {},
): McError {
  const p = (json && typeof json === 'object' ? json : {}) as Record<string, unknown>
  let code = codeFromType(p.type)
  if (code === 'unknown') {
    // No product problem body: classify by status only. A 5xx on a command is not proof of
    // rollback, so it is unknown; on a read it is unavailability.
    if (status === 401) code = 'unauthenticated'
    else if (status === 403) code = 'forbidden'
    else if (status === 404) code = 'not-found'
    else if (status === 412) code = 'precondition-failed'
    else if (status === 428) code = 'precondition-required'
    else if (status === 422) code = 'validation'
    else if (status === 413) code = 'payload-too-large'
    else if (status >= 500) code = ctx.command ? 'outcome-unknown' : 'unavailable'
  }
  const fieldErrors: McFieldError[] = Array.isArray(p.errors)
    ? (p.errors as unknown[]).flatMap((e) => {
        const r = e as Record<string, unknown>
        return typeof r?.field === 'string' && typeof r.message === 'string'
          ? [{ field: r.field, message: r.message }]
          : []
      })
    : []
  return new McError(code, status, {
    retryable: p.retryable === true,
    fieldErrors,
    receipted: code === 'outcome-unknown' && ctx.receipted === true,
    rejection: code === 'rejected' ? rejectionFrom(p) : undefined,
  })
}

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

function rejectionFrom(p: Record<string, unknown>): McRejection {
  const gates = Array.isArray(p.gates)
    ? (p.gates as unknown[]).flatMap((g) => {
        const r = g as Record<string, unknown>
        return typeof r?.edgeId === 'string' &&
          typeof r.sourceId === 'string' &&
          typeof r.gate === 'string' &&
          typeof r.code === 'string'
          ? [{ edgeId: r.edgeId, sourceId: r.sourceId, gate: r.gate, code: r.code }]
          : []
      })
    : []
  return {
    code: typeof p.code === 'string' ? p.code : 'rejected',
    message: typeof p.detail === 'string' ? p.detail : '',
    alternatives: strings(p.alternatives),
    gates,
    path: strings(p.path),
  }
}

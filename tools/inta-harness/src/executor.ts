import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { httpRequest, ApiError } from '/tmp/mc002-inta-fe/src/lib/api/http-client'
import { buildHarnessEnvelope, type HarnessEnvelope, type HarnessOutcome } from './envelope'
import {
  getFixturesForRun,
  FIXED_MISSING_UUID,
  T4_MALFORMED_LITERAL,
  T4_UPPERCASE_LITERAL,
} from './fixtures'
import { nativeUserSchema, type CaseId } from './schemas'
import type { RequestIdGenerator } from './request-id'

export type ExecuteParams = {
  runId: string
  caseId: CaseId
  refId?: string
  reqIdGen: RequestIdGenerator
  goBaseUrl: string
  nextVersion?: string
  harnessRevision?: string
}

export type ExecutionResult = {
  runId: string
  caseId: CaseId
  substeps: HarnessEnvelope[]
}

const WIRE_HEADER_ALLOWLIST = [
  'content-type',
  'location',
  'etag',
  'x-request-id',
  'retry-after',
]

/**
 * Dynamically measures installed Next.js version from node_modules metadata (INTA-FE-R04, F03).
 * Refuses literal fallbacks or unvalidated overrides.
 */
export function getInstalledNextVersion(): string {
  const candidatePaths = [
    path.join(process.cwd(), 'node_modules/next/package.json'),
    '/tmp/mc002-inta-fe/node_modules/next/package.json',
  ]
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const pkg = JSON.parse(fs.readFileSync(p, 'utf-8'))
        if (typeof pkg.version === 'string' && pkg.version.trim() !== '') {
          return pkg.version.trim()
        }
      }
    } catch {
      // Continue to next candidate
    }
  }
  return 'unmeasured:next-package-json-not-found'
}

/**
 * Dynamically resolves actual harness commit or archive identity (INTA-FE-R04, F03).
 * Refuses literal fallbacks or unvalidated overrides.
 */
export function getHarnessRevision(): string {
  try {
    const rev = execSync('git rev-parse HEAD', {
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    if (/^[0-9a-f]{40}$/.test(rev)) {
      return rev
    }
  } catch {
    // In archive / export environment without .git
  }

  const stampPath = path.join(process.cwd(), '.harness-revision')
  if (fs.existsSync(stampPath)) {
    try {
      const stamp = fs.readFileSync(stampPath, 'utf-8').trim()
      if (/^[0-9a-f]{40}$/.test(stamp) || /^[0-9a-f]{64}$/.test(stamp)) {
        return stamp
      }
    } catch {}
  }

  return 'unmeasured:git-rev-parse-failed'
}

async function runClientSubstep(params: {
  runId: string
  caseId: string
  requestId: string
  method: string
  url: string
  routeTemplate: string
  body?: unknown
  headers?: Record<string, string>
  schema?: any
  nextVersion: string
  harnessRevision: string
}): Promise<HarnessEnvelope> {
  const startedAtUTC = new Date().toISOString()
  const startMs = Date.now()
  let outcome: HarnessOutcome = 'value'
  let classification: string | null = 'success'
  let value: unknown = null
  let apiError: HarnessEnvelope['apiError'] = null

  try {
    const data = await httpRequest(params.url, {
      method: params.method as any,
      body: params.body,
      headers: {
        ...params.headers,
        'X-Request-ID': params.requestId,
      },
      schema: params.schema,
      init: { cache: 'no-store' },
    })
    value = data
    classification = 'success'
  } catch (err: any) {
    outcome = 'apiError'
    if (err instanceof ApiError) {
      apiError = {
        status: err.status,
        code: err.code,
        message: err.message,
        details: err.details,
      }
      // Outage classification per proposal §5.5 and matrix T11a/b/c/T12
      if (err.status === 503 || err.status === 0 || err.code === 'NETWORK_ERROR') {
        classification = 'unavailable'
      } else {
        classification = null
      }
    } else {
      apiError = {
        status: 0,
        code: 'NETWORK_ERROR',
        message: String(err.message ?? err),
      }
      classification = 'unavailable'
    }
  }

  const latencyMs = Date.now() - startMs
  return buildHarnessEnvelope({
    runId: params.runId,
    caseId: params.caseId,
    requestId: params.requestId,
    mode: 'app-client',
    method: params.method,
    routeTemplate: params.routeTemplate,
    startedAtUTC,
    latencyMs,
    actualNextVersion: params.nextVersion,
    harnessRevision: params.harnessRevision,
    outcome,
    classification,
    value,
    apiError,
    wire: {
      status: null,
      headers: null,
      note: 'not-observable-via-client',
    },
    truncated: false,
  })
}

async function runWireSubstep(params: {
  runId: string
  caseId: string
  requestId: string
  method: string
  url: string
  routeTemplate: string
  body?: BodyInit
  headers?: Record<string, string>
  nextVersion: string
  harnessRevision: string
  timeoutMs?: number
}): Promise<HarnessEnvelope> {
  const startedAtUTC = new Date().toISOString()
  const startMs = Date.now()
  let outcome: HarnessOutcome = 'value'
  let classification: string | null = null
  let value: unknown = null
  let apiError: HarnessEnvelope['apiError'] = null
  let wireStatus: number | null = null
  let wireHeaders: Record<string, string> = {}

  const timeoutMs = params.timeoutMs ?? 10000

  try {
    const reqHeaders = new Headers(params.headers)
    reqHeaders.set('X-Request-ID', params.requestId)

    const response = await fetch(params.url, {
      method: params.method,
      headers: reqHeaders,
      body: params.body,
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    })

    wireStatus = response.status
    for (const [k, v] of response.headers.entries()) {
      if (WIRE_HEADER_ALLOWLIST.includes(k.toLowerCase())) {
        wireHeaders[k.toLowerCase()] = v
      }
    }

    const text = await response.text()
    let parsedBody: unknown
    try {
      parsedBody = JSON.parse(text)
    } catch {
      parsedBody = text
    }

    if (response.ok) {
      outcome = 'value'
      classification = 'success'
      value = parsedBody
      apiError = null
    } else {
      outcome = 'apiError'
      classification = response.status === 503 ? 'unavailable' : null
      value = null
      apiError = {
        status: response.status,
        code: response.status === 404 ? 'NOT_FOUND' : 'HTTP_ERROR',
        message: `HTTP ${response.status}`,
        details: parsedBody,
      }
    }
  } catch (err: any) {
    outcome = 'apiError'
    value = null
    if (err?.name === 'TimeoutError') {
      apiError = {
        status: 0,
        code: 'TIMEOUT',
        message: `Request timed out after ${timeoutMs}ms`,
      }
      classification = 'unavailable'
    } else {
      apiError = {
        status: 0,
        code: 'NETWORK_ERROR',
        message: String(err?.message ?? err),
      }
      classification = 'unavailable'
    }
  }

  const latencyMs = Date.now() - startMs
  return buildHarnessEnvelope({
    runId: params.runId,
    caseId: params.caseId,
    requestId: params.requestId,
    mode: 'wire',
    method: params.method,
    routeTemplate: params.routeTemplate,
    startedAtUTC,
    latencyMs,
    actualNextVersion: params.nextVersion,
    harnessRevision: params.harnessRevision,
    outcome,
    classification,
    value,
    apiError,
    wire: {
      status: wireStatus,
      headers: wireHeaders,
    },
    truncated: false,
  })
}

export async function executeCase(params: ExecuteParams): Promise<ExecutionResult> {
  const { runId, caseId, refId, reqIdGen, goBaseUrl } = params
  const nextVersion = params.nextVersion ?? getInstalledNextVersion()
  const harnessRevision = params.harnessRevision ?? getHarnessRevision()

  if (nextVersion.startsWith('unmeasured:')) {
    throw new Error(`Upstream execution refused: unmeasured Next.js version (${nextVersion})`)
  }
  if (harnessRevision.startsWith('unmeasured:')) {
    throw new Error(`Upstream execution refused: unmeasured harness revision (${harnessRevision})`)
  }
  const f = getFixturesForRun(runId)
  const substeps: HarnessEnvelope[] = []

  switch (caseId) {
    case 'T1': {
      const envelope = await runClientSubstep({
        runId,
        caseId: 'T1',
        requestId: reqIdGen.next('T1'),
        method: 'POST',
        url: `${goBaseUrl}/api/v1/users`,
        routeTemplate: '/api/v1/users',
        body: f.userA.initial,
        schema: nativeUserSchema,
        nextVersion,
        harnessRevision,
      })
      substeps.push(envelope)
      break
    }

    case 'T2': {
      // refId validated as required by schema
      const envelope = await runClientSubstep({
        runId,
        caseId: 'T2',
        requestId: reqIdGen.next('T2'),
        method: 'GET',
        url: `${goBaseUrl}/api/v1/users/${refId}`,
        routeTemplate: '/api/v1/users/{id}',
        schema: nativeUserSchema,
        nextVersion,
        harnessRevision,
      })
      substeps.push(envelope)
      break
    }

    case 'T3': {
      const envelope = await runClientSubstep({
        runId,
        caseId: 'T3',
        requestId: reqIdGen.next('T3'),
        method: 'GET',
        url: `${goBaseUrl}/api/v1/users/${FIXED_MISSING_UUID}`,
        routeTemplate: '/api/v1/users/{id}',
        nextVersion,
        harnessRevision,
      })
      substeps.push(envelope)
      break
    }

    case 'T4': {
      // Substep 1: malformed literal
      const step1 = await runClientSubstep({
        runId,
        caseId: 'T4',
        requestId: reqIdGen.next('T4'),
        method: 'GET',
        url: `${goBaseUrl}/api/v1/users/${T4_MALFORMED_LITERAL}`,
        routeTemplate: '/api/v1/users/{id}',
        nextVersion,
        harnessRevision,
      })
      substeps.push(step1)

      // Substep 2: uppercase literal
      const step2 = await runClientSubstep({
        runId,
        caseId: 'T4',
        requestId: reqIdGen.next('T4'),
        method: 'GET',
        url: `${goBaseUrl}/api/v1/users/${T4_UPPERCASE_LITERAL}`,
        routeTemplate: '/api/v1/users/{id}',
        nextVersion,
        harnessRevision,
      })
      substeps.push(step2)
      break
    }

    case 'T5': {
      // Substep 1: POST with empty name -> 422 VALIDATION_ERROR
      const step1 = await runClientSubstep({
        runId,
        caseId: 'T5',
        requestId: reqIdGen.next('T5'),
        method: 'POST',
        url: `${goBaseUrl}/api/v1/users`,
        routeTemplate: '/api/v1/users',
        body: f.invalidT5,
        nextVersion,
        harnessRevision,
      })
      substeps.push(step1)

      // Substep 2: Mandatory readback GET A unchanged (refId guaranteed present by schema)
      const step2 = await runClientSubstep({
        runId,
        caseId: 'T5',
        requestId: reqIdGen.next('T5'),
        method: 'GET',
        url: `${goBaseUrl}/api/v1/users/${refId}`,
        routeTemplate: '/api/v1/users/{id}',
        schema: nativeUserSchema,
        nextVersion,
        harnessRevision,
      })
      substeps.push(step2)
      break
    }

    case 'T8': {
      // Substep 1: POST with A's email and duplicate name -> 409 HTTP_ERROR
      const step1 = await runClientSubstep({
        runId,
        caseId: 'T8',
        requestId: reqIdGen.next('T8'),
        method: 'POST',
        url: `${goBaseUrl}/api/v1/users`,
        routeTemplate: '/api/v1/users',
        body: f.duplicateA,
        nextVersion,
        harnessRevision,
      })
      substeps.push(step1)

      // Substep 2: Mandatory readback GET A unchanged (refId guaranteed present by schema)
      const step2 = await runClientSubstep({
        runId,
        caseId: 'T8',
        requestId: reqIdGen.next('T8'),
        method: 'GET',
        url: `${goBaseUrl}/api/v1/users/${refId}`,
        routeTemplate: '/api/v1/users/{id}',
        schema: nativeUserSchema,
        nextVersion,
        harnessRevision,
      })
      substeps.push(step2)
      break
    }

    case 'T9': {
      // refId validated as required by schema
      const envelope = await runClientSubstep({
        runId,
        caseId: 'T9',
        requestId: reqIdGen.next('T9'),
        method: 'PATCH',
        url: `${goBaseUrl}/api/v1/users/${refId}`,
        routeTemplate: '/api/v1/users/{id}',
        headers: { 'If-Match': '"1"' },
        body: f.userA.updated,
        schema: nativeUserSchema,
        nextVersion,
        harnessRevision,
      })
      substeps.push(envelope)
      break
    }

    case 'T10': {
      // refId validated as required by schema
      // Substep 1: Stale PATCH (If-Match: "1") -> 412
      const step1 = await runClientSubstep({
        runId,
        caseId: 'T10',
        requestId: reqIdGen.next('T10'),
        method: 'PATCH',
        url: `${goBaseUrl}/api/v1/users/${refId}`,
        routeTemplate: '/api/v1/users/{id}',
        headers: { 'If-Match': '"1"' },
        body: f.userA.stale,
        nextVersion,
        harnessRevision,
      })
      substeps.push(step1)

      // Substep 2: Explicit read-only checkpoint (GET A shows version 2 preserved)
      const step2 = await runClientSubstep({
        runId,
        caseId: 'T10',
        requestId: reqIdGen.next('T10'),
        method: 'GET',
        url: `${goBaseUrl}/api/v1/users/${refId}`,
        routeTemplate: '/api/v1/users/{id}',
        schema: nativeUserSchema,
        nextVersion,
        harnessRevision,
      })
      substeps.push(step2)
      break
    }

    case 'T11a': {
      const envelope = await runClientSubstep({
        runId,
        caseId: 'T11a',
        requestId: reqIdGen.next('T11a'),
        method: 'GET',
        url: `${goBaseUrl}/api/v1/users/${refId}`,
        routeTemplate: '/api/v1/users/{id}',
        nextVersion,
        harnessRevision,
      })
      substeps.push(envelope)
      break
    }

    case 'T11b': {
      const envelope = await runClientSubstep({
        runId,
        caseId: 'T11b',
        requestId: reqIdGen.next('T11b'),
        method: 'PATCH',
        url: `${goBaseUrl}/api/v1/users/${refId}`,
        routeTemplate: '/api/v1/users/{id}',
        headers: { 'If-Match': '"2"' },
        body: f.userA.outage,
        nextVersion,
        harnessRevision,
      })
      substeps.push(envelope)
      break
    }

    case 'T11c': {
      const envelope = await runClientSubstep({
        runId,
        caseId: 'T11c',
        requestId: reqIdGen.next('T11c'),
        method: 'POST',
        url: `${goBaseUrl}/api/v1/users`,
        routeTemplate: '/api/v1/users',
        body: f.userX.initial,
        nextVersion,
        harnessRevision,
      })
      substeps.push(envelope)
      break
    }

    case 'T12': {
      const envelope = await runClientSubstep({
        runId,
        caseId: 'T12',
        requestId: reqIdGen.next('T12'),
        method: 'GET',
        url: `${goBaseUrl}/api/v1/users/${refId}`,
        routeTemplate: '/api/v1/users/{id}',
        nextVersion,
        harnessRevision,
      })
      substeps.push(envelope)
      break
    }

    case 'INT-PERS-01':
    case 'INT-PERS-02':
    case 'INT-PERS-03':
    case 'INT-PERS-04': {
      const envelope = await runClientSubstep({
        runId,
        caseId,
        requestId: reqIdGen.next(caseId),
        method: 'GET',
        url: `${goBaseUrl}/api/v1/users/${refId}`,
        routeTemplate: '/api/v1/users/{id}',
        schema: nativeUserSchema,
        nextVersion,
        harnessRevision,
      })
      substeps.push(envelope)
      break
    }

    case 'W1': {
      const envelope = await runWireSubstep({
        runId,
        caseId: 'W1',
        requestId: reqIdGen.next('W1'),
        method: 'POST',
        url: `${goBaseUrl}/api/v1/users`,
        routeTemplate: '/api/v1/users',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f.userB.initial),
        nextVersion,
        harnessRevision,
      })
      substeps.push(envelope)
      break
    }

    case 'W2': {
      const envelope = await runWireSubstep({
        runId,
        caseId: 'W2',
        requestId: reqIdGen.next('W2'),
        method: 'GET',
        url: `${goBaseUrl}/api/v1/users/${refId}`,
        routeTemplate: '/api/v1/users/{id}',
        nextVersion,
        harnessRevision,
      })
      substeps.push(envelope)
      break
    }

    case 'W3': {
      const envelope = await runWireSubstep({
        runId,
        caseId: 'W3',
        requestId: reqIdGen.next('W3'),
        method: 'GET',
        url: `${goBaseUrl}/api/v1/users/${FIXED_MISSING_UUID}`,
        routeTemplate: '/api/v1/users/{id}',
        nextVersion,
        harnessRevision,
      })
      substeps.push(envelope)
      break
    }

    case 'T6-W': {
      const envelope = await runWireSubstep({
        runId,
        caseId: 'T6-W',
        requestId: reqIdGen.next('T6-W'),
        method: 'POST',
        url: `${goBaseUrl}/api/v1/users`,
        routeTemplate: '/api/v1/users',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
        nextVersion,
        harnessRevision,
      })
      substeps.push(envelope)
      break
    }

    case 'T7-W': {
      const rawBytes = new TextEncoder().encode(
        JSON.stringify({ email: f.wireT7.email, name: f.wireT7.name }),
      )
      const envelope = await runWireSubstep({
        runId,
        caseId: 'T7-W',
        requestId: reqIdGen.next('T7-W'),
        method: 'POST',
        url: `${goBaseUrl}/api/v1/users`,
        routeTemplate: '/api/v1/users',
        headers: {}, // Deliberately omit Content-Type
        body: rawBytes,
        nextVersion,
        harnessRevision,
      })
      substeps.push(envelope)
      break
    }

    case 'W9': {
      const envelope = await runWireSubstep({
        runId,
        caseId: 'W9',
        requestId: reqIdGen.next('W9'),
        method: 'GET',
        url: `${goBaseUrl}/api/v1/users/${refId}`,
        routeTemplate: '/api/v1/users/{id}',
        nextVersion,
        harnessRevision,
      })
      substeps.push(envelope)
      break
    }

    case 'W11': {
      const envelope = await runWireSubstep({
        runId,
        caseId: 'W11',
        requestId: reqIdGen.next('W11'),
        method: 'GET',
        url: `${goBaseUrl}/api/v1/users/${refId}`,
        routeTemplate: '/api/v1/users/{id}',
        nextVersion,
        harnessRevision,
      })
      substeps.push(envelope)
      break
    }

    default: {
      const unhandled: never = caseId
      throw new Error(`Unhandled caseId: ${unhandled}`)
    }
  }

  return { runId, caseId, substeps }
}

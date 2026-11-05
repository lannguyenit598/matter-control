export const MAX_RETAINED_BODY_BYTES = 16384

/**
 * Contract outcome vocabulary per INTA-1 §5:
 * - 'value': successful request with decoded/schema-validated body
 * - 'apiError': client or HTTP error with status/code/message/details
 * - 'abort': caller abort leaves value=null, apiError=null.
 *   Note on abort reachability: The harness does not expose caller-controlled abort signals
 *   merely to exercise this state, preserving strict INTA-1 control boundaries.
 */
export type HarnessOutcome = 'value' | 'apiError' | 'abort'

export type HarnessEnvelope = {
  runId: string
  caseId: string
  requestId: string
  mode: 'app-client' | 'wire'
  method: string
  routeTemplate: string
  startedAtUTC: string
  latencyMs: number
  actualNextVersion: string
  harnessRevision: string
  outcome: HarnessOutcome
  classification?: string | null
  value: unknown
  apiError: {
    status: number
    code: string
    message: string
    details?: unknown
  } | null
  wire: {
    status: number | null
    headers: Record<string, string> | null
    note?: string
  } | null
  truncated: boolean
}

/**
 * Finds the largest byte index <= maxBytes that does not cut in the middle of a multi-byte UTF-8 sequence.
 */
export function findSafeUtf8TruncationIndex(bytes: Uint8Array, maxBytes: number): number {
  if (bytes.length <= maxBytes) return bytes.length
  let i = maxBytes
  // Walk backwards over any continuation bytes (0x80 - 0xBF)
  while (i > 0 && (bytes[i - 1] & 0xc0) === 0x80) {
    i--
  }
  if (i === 0) {
    return 0
  }
  const lead = bytes[i - 1]
  let charLen = 1
  if ((lead & 0x80) === 0x00) {
    charLen = 1
  } else if ((lead & 0xe0) === 0xc0) {
    charLen = 2
  } else if ((lead & 0xf0) === 0xe0) {
    charLen = 3
  } else if ((lead & 0xf8) === 0xf0) {
    charLen = 4
  }

  // If the complete character fits within maxBytes, include it; otherwise cut before it
  if (i - 1 + charLen <= maxBytes) {
    return i - 1 + charLen
  } else {
    return i - 1
  }
}

/**
 * Truncates a UTF-8 string at maxBytes safely without splitting multi-byte sequences.
 * Guaranteed to never exceed maxBytes when re-encoded to UTF-8.
 */
export function truncateUtf8(str: string, maxBytes: number): { text: string; truncated: boolean } {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(str)
  if (bytes.length <= maxBytes) {
    return { text: str, truncated: false }
  }
  const safeCutIndex = findSafeUtf8TruncationIndex(bytes, maxBytes)
  const decoder = new TextDecoder('utf-8', { fatal: false })
  const text = decoder.decode(bytes.subarray(0, safeCutIndex))
  return { text, truncated: true }
}

/**
 * Caps any retained surface (value, apiError.details) at MAX_RETAINED_BODY_BYTES (16384 bytes).
 * When an object exceeds the cap, it is serialized to JSON and truncated, changing type
 * from object to string. Truncated evidence cannot establish complete-body or schema assertions.
 */
export function capRetainedSurface(val: unknown, maxBytes = MAX_RETAINED_BODY_BYTES): { val: unknown; truncated: boolean } {
  if (val === null || val === undefined) {
    return { val, truncated: false }
  }

  if (typeof val === 'string') {
    const res = truncateUtf8(val, maxBytes)
    return { val: res.text, truncated: res.truncated }
  }

  try {
    const json = JSON.stringify(val)
    const encoder = new TextEncoder()
    const bytes = encoder.encode(json)
    if (bytes.length <= maxBytes) {
      return { val, truncated: false }
    }
    const safeCutIndex = findSafeUtf8TruncationIndex(bytes, maxBytes)
    const decoder = new TextDecoder('utf-8', { fatal: false })
    const truncatedString = decoder.decode(bytes.subarray(0, safeCutIndex))
    return { val: truncatedString, truncated: true }
  } catch {
    const str = String(val)
    const res = truncateUtf8(str, maxBytes)
    return { val: res.text, truncated: res.truncated }
  }
}

export function buildHarnessEnvelope(
  params: Omit<HarnessEnvelope, 'truncated'> & { truncated?: boolean },
): HarnessEnvelope {
  let truncated = params.truncated ?? false

  // 1. Cap value surface
  const cappedValue = capRetainedSurface(params.value)
  const val = cappedValue.val
  if (cappedValue.truncated) {
    truncated = true
  }

  // 2. Cap apiError.details surface if present
  let apiError = params.apiError
  if (apiError && apiError.details !== undefined && apiError.details !== null) {
    const cappedDetails = capRetainedSurface(apiError.details)
    if (cappedDetails.truncated) {
      truncated = true
    }
    apiError = {
      ...apiError,
      details: cappedDetails.val,
    }
  }

  return {
    ...params,
    value: val,
    apiError,
    truncated,
  }
}

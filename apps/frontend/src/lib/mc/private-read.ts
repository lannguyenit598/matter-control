import 'server-only'
import { randomUUID } from 'node:crypto'
import { oidcConfig } from '@/lib/oidc/config'
import { publicUiSession } from '@/lib/auth-provider'
import { AuthError } from '@/lib/auth'
import { McError } from './errors'

export function privateJson(body: unknown, status = 200, operationId?: string) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      ...(operationId ? { 'X-Request-Id': operationId } : {}),
    },
  })
}

/** Authenticate/origin-check before consuming a bounded private read body. */
export async function privateRead(request: Request) {
  const cfg = oidcConfig()
  if (!cfg) throw new McError('unavailable', 503)
  if (request.headers.get('origin') !== cfg.appOrigin) throw new McError('forbidden', 403)
  const identity = await publicUiSession()
  if (!identity) throw new McError('unauthenticated', 401)
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json')
    throw new McError('unsupported-media-type', 415)
  const reader = request.body?.getReader()
  if (!reader) throw new McError('bad-request', 400)
  let size = 0
  const parts: Uint8Array[] = []
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 16_384) {
        await reader.cancel()
        throw new McError('payload-too-large', 413)
      }
      parts.push(value)
    }
    const joined = new Uint8Array(size)
    let offset = 0
    for (const part of parts) {
      joined.set(part, offset)
      offset += part.length
    }
    return {
      identity,
      body: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(joined)) as unknown,
      operationId: randomUUID(),
    }
  } catch (error) {
    if (error instanceof McError) throw error
    throw new McError('bad-request', 400)
  } finally {
    reader.releaseLock()
  }
}

export function privateReadError(error: unknown, operationId?: string) {
  const status = error instanceof McError ? error.status : error instanceof AuthError ? 401 : 502
  const code =
    error instanceof McError ? error.code : status === 401 ? 'unauthenticated' : 'internal'
  return privateJson({ type: `urn:mc:${code}`, status }, status, operationId)
}

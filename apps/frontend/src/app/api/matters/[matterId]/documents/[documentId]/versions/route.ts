import { NextResponse, type NextRequest } from 'next/server'

import { toMcFailure } from '@/lib/mc/action-result'
import { mcRequest, pathId } from '@/lib/mc/client'
import { UUID_V7 } from '@/lib/mc/idempotency'
import { oidcConfig } from '@/lib/oidc/config'
import { requireSession } from '@/lib/auth'
import { createdSchema } from '@/features/proof/schemas'

const STATUS = {
  validation: 422,
  unauthenticated: 401,
  forbidden: 403,
  'not-found': 404,
  stale: 412,
  unavailable: 503,
  'outcome-unknown': 503,
  'key-conflict': 422,
  rejected: 409,
} as const

/**
 * Upload of one document version. The bytes are streamed to the API with the user's own token and
 * never buffered or stored here. Same-origin POST only (CSRF). The idempotency key makes a retry
 * of the same file safe; the answer is the same JSON shape the Server Actions return, so the form
 * recovers exactly like any other receipted creation.
 */
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ matterId: string; documentId: string }> },
) {
  const cfg = oidcConfig()
  if (!cfg || request.headers.get('origin') !== cfg.appOrigin) {
    return NextResponse.json({ ok: false, kind: 'forbidden' }, { status: 403 })
  }
  try {
    await requireSession()
    const { matterId, documentId } = await ctx.params
    const key = request.headers.get('idempotency-key') ?? ''
    const rawName = request.headers.get('x-filename') ?? ''
    let filename = ''
    try {
      filename = decodeURIComponent(rawName).trim()
    } catch {
      // skip: an undecodable name is refused below as invalid
    }
    if (!UUID_V7.test(key) || filename === '' || filename.length > 255 || !request.body) {
      return NextResponse.json(
        { ok: false, kind: 'validation', error: 'The upload is incomplete.' },
        { status: 422 },
      )
    }
    const res = await mcRequest(
      `/matters/${pathId(matterId)}/documents/${pathId(documentId)}/versions`,
      {
        method: 'POST',
        raw: {
          body: request.body,
          contentType: request.headers.get('content-type') ?? 'application/octet-stream',
          headers: { 'X-Filename': filename },
        },
        idempotencyKey: key,
        schema: createdSchema,
        timeoutMs: 120_000,
      },
    )
    return NextResponse.json(
      { ok: true, id: res.data.id, replayed: res.replayed },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    const f = toMcFailure(error)
    const status = f.kind === 'error' ? 500 : (STATUS[f.kind as keyof typeof STATUS] ?? 500)
    return NextResponse.json(f, { status, headers: { 'Cache-Control': 'no-store' } })
  }
}

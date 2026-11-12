import { NextResponse, type NextRequest } from 'next/server'

import { mailRepository } from '@/features/mail/repository'
import { MAX_EML_BYTES, mailDirectionSchema } from '@/features/mail/schemas'
import { requireSession } from '@/lib/auth'
import { toMcFailure } from '@/lib/mc/action-result'
import { pathId } from '@/lib/mc/client'
import { UUID_V7 } from '@/lib/mc/idempotency'
import { oidcConfig } from '@/lib/oidc/config'

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

const MULTIPART = /^multipart\/form-data;\s*boundary=/i

/**
 * Intake of one captured email (.eml). The browser sends multipart form data; the file's bytes are
 * forwarded to the API untouched as the raw message body (Content-Type: message/rfc822, direction
 * as a query flag, no filename: the API defaults to message.eml) and are never stored here.
 * Same-origin POST only (CSRF). The idempotency key makes a retry of the same file safe; the answer
 * is the JSON shape the Server Actions return, so the form recovers like any receipted creation.
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ matterId: string }> }) {
  const cfg = oidcConfig()
  if (!cfg || request.headers.get('origin') !== cfg.appOrigin) {
    return NextResponse.json(
      { ok: false, kind: 'forbidden', error: 'Upload origin refused.' },
      { status: 403 },
    )
  }
  try {
    await requireSession()
    const { matterId } = await ctx.params
    pathId(matterId)
    const key = request.headers.get('idempotency-key') ?? ''
    const contentType = request.headers.get('content-type') ?? ''
    if (!UUID_V7.test(key) || !MULTIPART.test(contentType)) {
      return NextResponse.json(
        { ok: false, kind: 'validation', error: 'The upload is incomplete.' },
        { status: 422 },
      )
    }
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, kind: 'validation', error: 'The upload is incomplete.' },
        { status: 422 },
      )
    }
    if (!file.name.toLowerCase().endsWith('.eml') || file.size > MAX_EML_BYTES) {
      return NextResponse.json(
        { ok: false, kind: 'validation', error: 'Only .eml files up to 25 MiB are accepted.' },
        { status: 422 },
      )
    }
    // Direction is optional on the wire and defaults to inbound.
    const direction = mailDirectionSchema.safeParse(form.get('direction'))
    const res = await mailRepository.intake(
      matterId,
      file,
      direction.success ? direction.data : 'INBOUND',
      key,
    )
    return NextResponse.json(
      {
        ok: true,
        documentId: res.data.documentId,
        versionId: res.data.versionId,
        mailId: res.data.mailId,
        replayed: res.replayed,
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    const f = toMcFailure(error)
    // Mail intake is a receipted creation: an unconfirmed outcome recovers by resending the SAME
    // key, so the flag must survive the BFF hop even though toMcFailure cannot know it here.
    const safe =
      f.kind === 'outcome-unknown' ? { ...f, retrySameKey: true, requiresReread: undefined } : f
    const status = f.kind === 'error' ? 500 : (STATUS[f.kind as keyof typeof STATUS] ?? 500)
    return NextResponse.json(safe, { status, headers: { 'Cache-Control': 'no-store' } })
  }
}

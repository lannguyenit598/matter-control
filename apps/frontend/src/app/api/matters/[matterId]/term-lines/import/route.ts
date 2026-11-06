import { NextResponse, type NextRequest } from 'next/server'

import { termSheetRepository } from '@/features/term-sheet/repository'
import { requireSession } from '@/lib/auth'
import { toMcFailure } from '@/lib/mc/action-result'
import { McError } from '@/lib/mc/errors'
import { UUID_V7 } from '@/lib/mc/idempotency'
import { oidcConfig } from '@/lib/oidc/config'

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
    const key = request.headers.get('idempotency-key') ?? ''
    const contentType = request.headers.get('content-type') ?? ''
    if (
      !UUID_V7.test(key) ||
      !/^multipart\/form-data;\s*boundary=/i.test(contentType) ||
      !request.body
    ) {
      return NextResponse.json(
        { ok: false, kind: 'validation', error: 'The upload is incomplete.' },
        { status: 422 },
      )
    }
    const result = await termSheetRepository.import(matterId, request.body, contentType, key)
    if (result.rejected.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          kind: 'validation',
          error: 'No term lines were imported.',
          fieldErrors: Object.fromEntries(result.rejected.map((row) => [row.rowKey, [row.detail]])),
        },
        { status: 422 },
      )
    }
    return NextResponse.json(
      { ok: true, replayed: result.replayed },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    if (error instanceof McError && error.code === 'payload-too-large') {
      return NextResponse.json(
        { ok: false, kind: 'validation', error: 'The term sheet exceeds 5 MiB.' },
        { status: 413 },
      )
    }
    const failure = toMcFailure(error)
    const status = {
      unauthenticated: 401,
      forbidden: 403,
      'not-found': 404,
      stale: 412,
      validation: 422,
      'key-conflict': 422,
      unavailable: 503,
      'outcome-unknown': 503,
      rejected: 409,
      error: 500,
      'last-owner': 409,
    }[failure.kind]
    return NextResponse.json(failure, { status })
  }
}

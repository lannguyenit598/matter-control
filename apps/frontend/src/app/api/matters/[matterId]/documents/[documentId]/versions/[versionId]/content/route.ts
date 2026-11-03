import { NextResponse, type NextRequest } from 'next/server'

import { toMcFailure } from '@/lib/mc/action-result'
import { mcDownload, pathId } from '@/lib/mc/client'

const PASS = [
  'content-disposition',
  'x-content-type-options',
  'cache-control',
  'mc-media-type',
  'mc-content-sha256',
]

/**
 * Streams one stored version. It is always an attachment of opaque bytes (the API sets that), is
 * never cached, and only the download-describing headers are passed on.
 */
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ matterId: string; documentId: string; versionId: string }> },
) {
  try {
    const { matterId, documentId, versionId } = await ctx.params
    const upstream = await mcDownload(
      `/matters/${pathId(matterId)}/documents/${pathId(documentId)}/versions/${pathId(versionId)}/content`,
      120_000,
    )
    const headers = new Headers({ 'Content-Type': 'application/octet-stream' })
    for (const h of PASS) {
      const v = upstream.headers.get(h)
      if (v) headers.set(h, v)
    }
    return new Response(upstream.body, { status: 200, headers })
  } catch (error) {
    const f = toMcFailure(error)
    const status = { unauthenticated: 401, forbidden: 403, 'not-found': 404, unavailable: 503 }[
      f.kind as 'unauthenticated'
    ]
    return NextResponse.json(f, { status: status ?? 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

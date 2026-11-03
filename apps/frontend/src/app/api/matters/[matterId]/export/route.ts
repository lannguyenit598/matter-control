import { NextResponse, type NextRequest } from 'next/server'

import { toMcFailure } from '@/lib/mc/action-result'
import { mcDownload, pathId } from '@/lib/mc/client'

const PASS = ['content-disposition', 'mc-as-of', 'mc-source-revision']

/**
 * Streams the scoped XLSX/CSV export through the BFF. Authorization is rechecked by
 * the API at retrieval; the browser never sees a bearer token.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ matterId: string }> }) {
  try {
    const { matterId } = await ctx.params
    const format = request.nextUrl.searchParams.get('format') === 'csv' ? 'csv' : 'xlsx'
    const upstream = await mcDownload(
      `/matters/${pathId(matterId)}/export?format=${encodeURIComponent(format)}`,
      120_000,
    )
    const headers = new Headers({
      'Content-Type':
        format === 'csv'
          ? 'text/csv; charset=utf-8'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Cache-Control': 'no-store',
    })
    for (const h of PASS) {
      const v = upstream.headers.get(h)
      if (v) headers.set(h, v)
    }
    if (!headers.has('content-disposition')) {
      headers.set('Content-Disposition', `attachment; filename="matter-export.${format}"`)
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

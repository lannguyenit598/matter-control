import { searchInputSchema } from '@/features/search/schemas'
import { searchRepository } from '@/features/search/repository'
import { privateJson, privateRead, privateReadError } from '@/lib/mc/private-read'

export async function POST(request: Request) {
  let operationId: string | undefined
  try {
    const read = await privateRead(request)
    operationId = read.operationId
    const parsed = searchInputSchema.safeParse(read.body)
    if (!parsed.success) return privateJson({ type: 'urn:mc:bad-request' }, 400, operationId)
    if (parsed.data.epoch !== read.identity.epoch)
      return privateJson({ type: 'urn:mc:ui-session-changed' }, 409, operationId)
    const start = Date.now()
    const result = await searchRepository.read(parsed.data, request.signal, operationId)
    for (const [group, outcome] of Object.entries(result.groups))
      console.info('[private-read]', {
        route: 'search',
        group,
        outcome: outcome?.status,
        durationMs: Date.now() - start,
        operationId,
      })
    return privateJson(result, 200, operationId)
  } catch (error) {
    return privateReadError(error, operationId)
  }
}

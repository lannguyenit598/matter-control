import { z } from 'zod'
import { privateRead, privateJson, privateReadError } from '@/lib/mc/private-read'
import { targetSchema } from '@/features/work/focus/model'
import { classifyFocus } from '@/features/work/focus/eligibility'
import { workRepository } from '@/features/work/repository'
import { matterRepository } from '@/features/matters/repository'

const inputSchema = z
  .object({
    epoch: z.string().max(100),
    target: targetSchema.optional(),
    query: z.string().max(100).optional(),
  })
  .strict()

export async function POST(request: Request) {
  let operationId: string | undefined
  try {
    const read = await privateRead(request)
    operationId = read.operationId
    const input = inputSchema.safeParse(read.body)
    if (!input.success) return privateJson({ type: 'urn:mc:bad-request' }, 400, operationId)
    if (input.data.epoch !== read.identity.epoch)
      return privateJson({ type: 'urn:mc:ui-session-changed' }, 409, operationId)
    const opts = { signal: request.signal, operationId }
    const stage = async <T>(name: 'classification' | 'detail' | 'name', run: () => Promise<T>) => {
      const start = Date.now()
      try {
        const value = await run()
        console.info('[private-read]', {
          route: 'focus',
          stage: name,
          operationId,
          durationMs: Date.now() - start,
          outcome: 'ok',
        })
        return value
      } catch (error) {
        console.info('[private-read]', {
          route: 'focus',
          stage: name,
          operationId,
          durationMs: Date.now() - start,
          outcome: 'failed',
        })
        throw error
      }
    }
    const outcome = await classifyFocus(input.data, {
      readActions: () => stage('classification', () => workRepository.myActions(opts)),
      readTarget: (target) =>
        stage(
          'detail',
          async () => (await workRepository.get(target.matterId, target.actionId, opts)).detail,
        ),
      readMatterName: (id) =>
        stage('name', async () => (await matterRepository.get(id, opts)).matter.title),
    })
    return privateJson(
      { identity: read.identity, checkedAt: new Date().toISOString(), ...outcome },
      200,
      operationId,
    )
  } catch (error) {
    return privateReadError(error, operationId)
  }
}

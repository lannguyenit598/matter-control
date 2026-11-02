import 'server-only'
import { mcRequest } from '@/lib/mc/client'
import { McError } from '@/lib/mc/errors'
import { GROUPS, searchResponseSchema, type SearchInput } from './schemas'

export const searchRepository = {
  read: async (input: SearchInput, signal: AbortSignal, operationId: string) => {
    const result = (
      await mcRequest('/search', {
        method: 'POST',
        semantics: 'read',
        body: input,
        signal,
        operationId,
        schema: searchResponseSchema,
      })
    ).data
    const expected = input.types ?? GROUPS
    if (
      Object.keys(result.groups).length !== expected.length ||
      expected.some((group) => !result.groups[group])
    )
      throw new McError('internal', 502)
    return result
  },
}

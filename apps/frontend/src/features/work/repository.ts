import 'server-only'

import { mcRequest, pathId } from '@/lib/mc/client'

import {
  createActionInputSchema,
  agendaRowSchema,
  createdSchema,
  deleteSavedViewInputSchema,
  detailSchema,
  envelopeSchema,
  meAgendaPageSchema,
  milestonePageSchema,
  myActionsSchema,
  partyPageSchema,
  partySchema,
  saveViewInputSchema,
  savedViewPageSchema,
  savedViewSchema,
  updateSavedViewInputSchema,
  workPageSchema,
  workstreamPageSchema,
  workstreamSchema,
  milestoneViewSchema,
  type GridQuery,
} from './schemas'
import { z } from 'zod'

type Query = Record<string, string | number | undefined>

/** Work-graph reads and commands (contract §2.3). Every call carries the user's own token. */
export const workRepository = {
  /** The operational grid: filtering, sorting and paging happen at one snapshot on the API. */
  list: async (matterId: string, q: GridQuery, limit = 50) => {
    const query: Query = {
      kind: q.kind,
      execution: q.execution,
      dependency: q.dependency,
      timing: q.timing,
      attention: q.attention,
      owner: q.owner,
      workstream: q.workstream,
      q: q.q,
      sort: q.sort,
      desc: q.desc,
      cursor: q.cursor,
      limit,
    }
    const res = await mcRequest(`/matters/${pathId(matterId)}/work-items`, {
      query,
      schema: workPageSchema,
    })
    return { page: res.data, asOf: res.asOf }
  },

  get: async (
    matterId: string,
    itemId: string,
    read: { signal?: AbortSignal; operationId?: string } = {},
  ) => {
    const res = await mcRequest(`/matters/${pathId(matterId)}/work-items/${pathId(itemId)}`, {
      schema: detailSchema,
      ...read,
    })
    return { detail: res.data, asOf: res.asOf }
  },

  myActions: async (read: { signal?: AbortSignal; operationId?: string } = {}) => {
    const res = await mcRequest('/me/actions', { schema: myActionsSchema, ...read })
    return { actions: res.data, asOf: res.asOf }
  },

  /**
   * My Agenda (RLF-03): the caller's recorded due dates across all authorized Matters, read as
   * one aggregate — the UI never fans out per Matter. Keyset cursors are followed server-side
   * up to a declared bound (10 pages × 200 rows); anything beyond that bound is reported
   * honestly as `truncated`, never silently dropped.
   */
  meAgenda: async (
    params: {
      from?: string
      until?: string
      read?: { signal?: AbortSignal; operationId?: string }
    } = {},
  ) => {
    const { read, from, until } = params
    const MAX_PAGES = 10
    const items: z.infer<typeof agendaRowSchema>[] = []
    let cursor: string | undefined
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await mcRequest('/me/agenda', {
        query: { from, until, limit: 200, cursor },
        schema: meAgendaPageSchema,
        ...read,
      })
      items.push(...res.data.items)
      const next = res.data.page.nextCursor
      if (!next) return { items, truncated: false, asOf: res.asOf }
      cursor = next
    }
    return { items, truncated: true, asOf: undefined }
  },

  waitingOn: async (matterId: string) =>
    (await mcRequest(`/matters/${pathId(matterId)}/waiting-on`, { schema: workPageSchema })).data,

  workstreams: async (matterId: string) =>
    (await mcRequest(`/matters/${pathId(matterId)}/workstreams`, { schema: workstreamPageSchema }))
      .data,

  parties: async (matterId: string) =>
    (await mcRequest(`/matters/${pathId(matterId)}/parties`, { schema: partyPageSchema })).data,

  milestones: async (matterId: string) =>
    (await mcRequest(`/matters/${pathId(matterId)}/milestones`, { schema: milestonePageSchema }))
      .data,

  // ---- commands ----

  createAction: (input: z.infer<typeof createActionInputSchema>) =>
    mcRequest(`/matters/${pathId(input.matterId)}/actions`, {
      method: 'POST',
      body: { title: input.title, outcome: input.outcome },
      idempotencyKey: input.idempotencyKey,
      schema: envelopeSchema,
    }),

  update: (matterId: string, itemId: string, body: Record<string, unknown>, ifMatch: string) =>
    mcRequest(`/matters/${pathId(matterId)}/work-items/${pathId(itemId)}`, {
      method: 'PATCH',
      body,
      ifMatch,
      schema: envelopeSchema,
    }),

  // ---- saved views (RLF-04): private named filter definitions ----

  savedViews: async (matterId: string) =>
    (await mcRequest(`/matters/${pathId(matterId)}/saved-views`, { schema: savedViewPageSchema }))
      .data,

  createSavedView: (input: z.infer<typeof saveViewInputSchema>) =>
    mcRequest(`/matters/${pathId(input.matterId)}/saved-views`, {
      method: 'POST',
      body: { name: input.name, filters: input.filters },
      idempotencyKey: input.idempotencyKey,
      schema: createdSchema,
    }),

  updateSavedView: (input: z.infer<typeof updateSavedViewInputSchema>) =>
    mcRequest(`/matters/${pathId(input.matterId)}/saved-views/${pathId(input.viewId)}`, {
      method: 'PATCH',
      body: { name: input.name, filters: input.filters },
      ifMatch: input.ifMatch,
      schema: savedViewSchema,
    }),

  deleteSavedView: (input: z.infer<typeof deleteSavedViewInputSchema>) =>
    mcRequest(`/matters/${pathId(input.matterId)}/saved-views/${pathId(input.viewId)}/removal`, {
      method: 'POST',
      body: {},
      ifMatch: input.ifMatch,
      schema: z.object({}).passthrough(),
    }),

  transition: (matterId: string, itemId: string, body: Record<string, unknown>, ifMatch: string) =>
    mcRequest(`/matters/${pathId(matterId)}/work-items/${pathId(itemId)}/execution`, {
      method: 'POST',
      body,
      ifMatch,
      schema: envelopeSchema,
    }),

  escalate: (matterId: string, itemId: string, reason: string, ifMatch: string) =>
    mcRequest(`/matters/${pathId(matterId)}/work-items/${pathId(itemId)}/escalation`, {
      method: 'POST',
      body: { reason },
      ifMatch,
      schema: envelopeSchema,
    }),

  addDependency: (
    matterId: string,
    targetId: string,
    body: Record<string, unknown>,
    ifMatch: string,
  ) =>
    mcRequest(`/matters/${pathId(matterId)}/work-items/${pathId(targetId)}/dependencies`, {
      method: 'POST',
      body,
      ifMatch,
      schema: detailSchema,
    }),

  removeDependency: (
    matterId: string,
    targetId: string,
    edgeId: string,
    reason: string,
    ifMatch: string,
  ) =>
    mcRequest(
      `/matters/${pathId(matterId)}/work-items/${pathId(targetId)}/dependencies/${pathId(edgeId)}/removal`,
      { method: 'POST', body: { reason }, ifMatch, schema: detailSchema },
    ),

  createWorkstream: (matterId: string, name: string) =>
    mcRequest(`/matters/${pathId(matterId)}/workstreams`, {
      method: 'POST',
      body: { name },
      schema: workstreamSchema,
    }),

  createParty: (matterId: string, body: Record<string, unknown>) =>
    mcRequest(`/matters/${pathId(matterId)}/parties`, {
      method: 'POST',
      body,
      schema: partySchema,
    }),

  updateParty: (
    matterId: string,
    partyId: string,
    body: Record<string, unknown>,
    ifMatch: string,
  ) =>
    mcRequest(`/matters/${pathId(matterId)}/parties/${pathId(partyId)}`, {
      method: 'PATCH',
      body,
      ifMatch,
      schema: partySchema,
    }),

  createMilestone: (matterId: string, body: Record<string, unknown>) =>
    mcRequest(`/matters/${pathId(matterId)}/milestones`, {
      method: 'POST',
      body,
      schema: milestoneViewSchema,
    }),

  setMilestonePrerequisites: (
    matterId: string,
    milestoneId: string,
    body: Record<string, unknown>,
    ifMatch: string,
  ) =>
    mcRequest(`/matters/${pathId(matterId)}/milestones/${pathId(milestoneId)}/prerequisites`, {
      method: 'PUT',
      body,
      ifMatch,
      schema: milestoneViewSchema,
    }),
}

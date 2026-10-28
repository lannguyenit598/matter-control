import 'server-only'

import { mcRequest, pathId } from '@/lib/mc/client'

import {
  createActionInputSchema,
  detailSchema,
  envelopeSchema,
  milestonePageSchema,
  myActionsSchema,
  partyPageSchema,
  partySchema,
  workPageSchema,
  workstreamPageSchema,
  workstreamSchema,
  milestoneViewSchema,
  type GridQuery,
} from './schemas'
import type { z } from 'zod'

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

  get: async (matterId: string, itemId: string) => {
    const res = await mcRequest(`/matters/${pathId(matterId)}/work-items/${pathId(itemId)}`, {
      schema: detailSchema,
    })
    return { detail: res.data, asOf: res.asOf }
  },

  myActions: async () => {
    const res = await mcRequest('/me/actions', { schema: myActionsSchema })
    return { actions: res.data, asOf: res.asOf }
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

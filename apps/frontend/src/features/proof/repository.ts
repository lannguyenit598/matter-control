import 'server-only'

import { mcRequest, pathId } from '@/lib/mc/client'

import {
  checklistSchema,
  createdSchema,
  documentDetailSchema,
  documentPageSchema,
  pendingAssessmentPageSchema,
  verifiersSchema,
} from './schemas'

const m = (id: string) => `/matters/${pathId(id)}`

/** Documents and proof (contract §2.4). Every call carries the user's own token. */
export const proofRepository = {
  documents: async (matterId: string) =>
    (await mcRequest(`${m(matterId)}/documents`, { schema: documentPageSchema })).data,

  document: async (matterId: string, documentId: string, promoteTo?: string) => {
    const res = await mcRequest(`${m(matterId)}/documents/${pathId(documentId)}`, {
      query: { promoteTo },
      schema: documentDetailSchema,
    })
    return { detail: res.data, etag: res.etag }
  },

  checklist: async (matterId: string, itemId: string) => {
    const res = await mcRequest(`${m(matterId)}/work-items/${pathId(itemId)}/proof`, {
      schema: checklistSchema,
    })
    return { checklist: res.data, asOf: res.asOf }
  },

  /** Claims the caller may assess now across their matters, oldest offer first (bounded, paged). */
  reviewQueue: async (cursor?: string) =>
    (
      await mcRequest('/me/reviews', {
        query: { limit: 25, cursor },
        schema: pendingAssessmentPageSchema,
      })
    ).data,

  verifiers: async (matterId: string) =>
    (await mcRequest(`${m(matterId)}/verifiers`, { schema: verifiersSchema })).data.verifiers,

  // ---- commands ----

  createDocument: (matterId: string, name: string, idempotencyKey: string) =>
    mcRequest(`${m(matterId)}/documents`, {
      method: 'POST',
      body: { name },
      idempotencyKey,
      schema: createdSchema,
    }),

  promote: (matterId: string, documentId: string, body: Record<string, unknown>, ifMatch: string) =>
    mcRequest(`${m(matterId)}/documents/${pathId(documentId)}/promotion`, {
      method: 'POST',
      body,
      ifMatch,
      schema: documentDetailSchema,
    }),

  recordSignature: (matterId: string, versionId: string, body: Record<string, unknown>) =>
    mcRequest(`${m(matterId)}/versions/${pathId(versionId)}/signatures`, {
      method: 'POST',
      body,
      schema: documentDetailSchema,
    }),

  createCriterion: (matterId: string, itemId: string, body: Record<string, unknown>) =>
    mcRequest(`${m(matterId)}/work-items/${pathId(itemId)}/criteria`, {
      method: 'POST',
      body,
      schema: checklistSchema,
    }),

  reviseCriterion: (
    matterId: string,
    itemId: string,
    criterionId: string,
    body: Record<string, unknown>,
    ifMatch: string,
  ) =>
    mcRequest(
      `${m(matterId)}/work-items/${pathId(itemId)}/criteria/${pathId(criterionId)}/revision`,
      { method: 'POST', body, ifMatch, schema: checklistSchema },
    ),

  setApplicability: (
    matterId: string,
    itemId: string,
    body: Record<string, unknown>,
    ifMatch: string,
  ) =>
    mcRequest(`${m(matterId)}/work-items/${pathId(itemId)}/applicability`, {
      method: 'POST',
      body,
      ifMatch,
      schema: checklistSchema,
    }),

  submitEvidence: (matterId: string, body: Record<string, unknown>, idempotencyKey: string) =>
    mcRequest(`${m(matterId)}/evidence`, {
      method: 'POST',
      body,
      idempotencyKey,
      schema: createdSchema,
    }),

  addClaim: (matterId: string, evidenceId: string, criterionId: string) =>
    mcRequest(`${m(matterId)}/evidence/${pathId(evidenceId)}/claims`, {
      method: 'POST',
      body: { criterionId },
      schema: checklistSchema,
    }),

  /** `path` is one of withdrawal | revocation | disputes on the given resource. */
  reasoned: (matterId: string, resource: string, id: string, action: string, reason: string) =>
    mcRequest(`${m(matterId)}/${resource}/${pathId(id)}/${action}`, {
      method: 'POST',
      body: { reason },
      schema: checklistSchema,
    }),

  assess: (matterId: string, claimId: string, body: Record<string, unknown>) =>
    mcRequest(`${m(matterId)}/claims/${pathId(claimId)}/assessments`, {
      method: 'POST',
      body,
      schema: checklistSchema,
    }),

  resolve: (matterId: string, disputeId: string, resolution: string) =>
    mcRequest(`${m(matterId)}/disputes/${pathId(disputeId)}/resolution`, {
      method: 'POST',
      body: { resolution },
      schema: checklistSchema,
    }),

  setVerifier: (matterId: string, userId: string, revoke: boolean) =>
    revoke
      ? mcRequest(`${m(matterId)}/verifiers/${pathId(userId)}/revocation`, {
          method: 'POST',
          body: {},
          schema: verifiersSchema,
        })
      : mcRequest(`${m(matterId)}/verifiers`, {
          method: 'POST',
          body: { userId },
          schema: verifiersSchema,
        }),
}

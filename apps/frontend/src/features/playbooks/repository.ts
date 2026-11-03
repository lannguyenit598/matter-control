import 'server-only'

import { z } from 'zod'

import { mcRequest, pathId } from '@/lib/mc/client'

import {
  appliedPlaybookSchema,
  playbookApplicationPreviewSchema,
  playbookDetailSchema,
  playbookInstancePageSchema,
  playbookPageSchema,
  type PlaybookEntry,
} from './schemas'

export type PlaybookApplicationPreview = z.infer<typeof playbookApplicationPreviewSchema>
export type AppliedPlaybook = z.infer<typeof appliedPlaybookSchema>

/** Playbook reads and commands (RLF-05). Every call carries the user's own token. */
export const playbookRepository = {
  list: async (workspaceId: string) =>
    (
      await mcRequest(`/workspaces/${pathId(workspaceId)}/playbooks`, {
        schema: playbookPageSchema,
      })
    ).data,

  get: async (workspaceId: string, playbookId: string) =>
    (
      await mcRequest(`/workspaces/${pathId(workspaceId)}/playbooks/${pathId(playbookId)}`, {
        schema: playbookDetailSchema,
      })
    ).data,

  create: (input: { workspaceId: string; name: string; idempotencyKey: string; ifMatch: string }) =>
    mcRequest(`/workspaces/${pathId(input.workspaceId)}/playbooks`, {
      method: 'POST',
      body: { name: input.name },
      idempotencyKey: input.idempotencyKey,
      ifMatch: input.ifMatch,
      schema: z.object({ id: z.string(), kind: z.string(), seq: z.number() }),
    }),

  publish: (input: {
    workspaceId: string
    playbookId: string
    entries: PlaybookEntry[]
    idempotencyKey: string
    ifMatch: string
  }) =>
    mcRequest(
      `/workspaces/${pathId(input.workspaceId)}/playbooks/${pathId(input.playbookId)}/revisions`,
      {
        method: 'POST',
        body: { entries: input.entries },
        idempotencyKey: input.idempotencyKey,
        ifMatch: input.ifMatch,
        schema: z.object({ id: z.string(), kind: z.string(), seq: z.number() }),
      },
    ),

  preview: async (matterId: string, revisionId: string) =>
    (
      await mcRequest(`/matters/${pathId(matterId)}/playbook-applications/preview`, {
        query: { revision: revisionId },
        schema: playbookApplicationPreviewSchema,
      })
    ).data,

  apply: (input: {
    matterId: string
    revisionId: string
    ownerMap: Record<string, string>
    idempotencyKey: string
  }) =>
    mcRequest(`/matters/${pathId(input.matterId)}/playbook-applications`, {
      method: 'POST',
      body: { revisionId: input.revisionId, ownerMap: input.ownerMap },
      idempotencyKey: input.idempotencyKey,
      schema: appliedPlaybookSchema,
    }),

  instances: async (matterId: string) =>
    (
      await mcRequest(`/matters/${pathId(matterId)}/playbook-instances`, {
        schema: playbookInstancePageSchema,
      })
    ).data,
}

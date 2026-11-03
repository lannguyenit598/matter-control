import { z } from 'zod'

import { idSchema, pageMetaSchema } from '@/lib/mc/schemas'

// RLF-05: workspace playbooks. Templates are validated shapes — never executable content — and
// applying one is an explicit, receipted matter-OWNER command.

export const playbookEntrySchema = z.object({
  key: z.string().trim().min(1).max(100),
  kind: z.enum(['REQUIREMENT', 'ACTION']),
  title: z.string().trim().min(1).max(300),
  outcome: z.string().trim().min(1).max(5000),
  ownerKey: z.string().trim().max(100).optional().catch(undefined),
  dueDaysOffset: z.number().int().min(0).max(3650).optional().catch(undefined),
  dependsOn: z.array(z.string().trim().min(1).max(100)).max(100).optional().catch(undefined),
})
export type PlaybookEntry = z.infer<typeof playbookEntrySchema>

export const playbookSchema = z.object({
  id: z.string(),
  name: z.string(),
  revision: z.number().int(),
  createdAt: z.string(),
})
export type Playbook = z.infer<typeof playbookSchema>
export const playbookPageSchema = z.object({
  items: z.array(playbookSchema),
  page: pageMetaSchema,
})

export const playbookRevisionSchema = z.object({
  id: z.string(),
  no: z.number().int(),
  entries: z.array(playbookEntrySchema),
  createdAt: z.string(),
})
export const playbookDetailSchema = z.object({
  playbook: playbookSchema,
  revisions: z.array(playbookRevisionSchema),
})

export type PlaybookApplicationPreview = z.infer<typeof playbookApplicationPreviewSchema>
export const playbookApplicationPreviewSchema = z.object({
  playbook: playbookSchema,
  revision: playbookRevisionSchema,
  ownerKeys: z.record(z.string(), z.string()),
  problems: z.array(z.string()),
})

export const appliedPlaybookSchema = z.object({
  playbookId: z.string(),
  revisionId: z.string(),
  revisionNo: z.number().int(),
})

export const playbookInstanceSchema = z.object({
  revisionId: z.string(),
  playbookId: z.string(),
  entryKey: z.string(),
  itemId: z.string(),
  appliedAt: z.string(),
})
export const playbookInstancePageSchema = z.object({
  items: z.array(playbookInstanceSchema),
  page: pageMetaSchema,
})

// ---- command inputs (re-validated by every Server Action) ----

const key = z.string().min(1).max(100)

export const createPlaybookInputSchema = z.object({
  idempotencyKey: key,
  workspaceId: idSchema,
  ifMatch: z.string().min(1).max(200),
  name: z.string().trim().min(1).max(100),
})

export const publishPlaybookInputSchema = z.object({
  idempotencyKey: key,
  workspaceId: idSchema,
  playbookId: idSchema,
  ifMatch: z.string().min(1).max(200),
  entries: z.array(playbookEntrySchema).min(1).max(100),
})

export const applyPlaybookInputSchema = z.object({
  idempotencyKey: key,
  matterId: idSchema,
  revisionId: idSchema,
  ownerMap: z.record(z.string(), idSchema),
})

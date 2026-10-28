import { z } from 'zod'

import { idSchema } from '@/lib/mc/schemas'

export const requirementSchema = z.object({
  id: z.string(),
  matterId: z.string(),
  title: z.string(),
  outcome: z.string(),
  executionState: z.string(),
  dependencyState: z.string(),
  verificationState: z.string(),
  verificationApplicability: z.string(),
  applicabilityReason: z.string().nullable(),
  importedVerificationClaim: z.string().optional(),
  proofEpoch: z.number().int(),
  workstreamId: z.string().nullable(),
  ownerId: z.string().nullable(),
  dueAt: z.string().nullable(),
  revision: z.number().int(),
})

export type Requirement = z.infer<typeof requirementSchema>

export const createRequirementInputSchema = z.object({
  idempotencyKey: z.string().min(1).max(100),
  matterId: idSchema,
  title: z.string().trim().min(1, 'Enter a title').max(500),
  outcome: z.string().trim().min(1, 'Describe the intended outcome').max(5000),
})

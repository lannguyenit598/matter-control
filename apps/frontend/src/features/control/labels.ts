export const GAP_LABEL: Record<string, string> = {
  COMPLETED_UNVERIFIED: 'Completed, proof not verified',
  NO_CRITERIA: 'No evidence criteria declared',
  PROOF_DISPUTED: 'Proof is disputed',
  NO_OWNER: 'No owner',
  NEGATIVE_FILING_OUTCOME: 'Filing rejected or withdrawn',
}

export const KIND_LABEL: Record<string, string> = {
  DECISION: 'Decision',
  FINDING: 'Finding',
  RISK: 'Risk',
  ENTITY: 'Entity',
}

export function userName(names: Record<string, string>, id: string | null | undefined) {
  if (!id) return 'unassigned'
  return names[id] ?? 'a former member'
}

export const GATE_LABEL: Record<string, string> = {
  COMPLETION: 'Completion gate',
  PROOF: 'Proof gate',
}

/** Why one gate is not satisfied: completion and proof are never blurred. */
export const GATE_REASON: Record<string, string> = {
  NOT_COMPLETED: 'the prerequisite is not completed',
  NOT_VERIFIED: 'the prerequisite is completed but its proof is not satisfied',
  UPSTREAM_BLOCKED:
    'the prerequisite is completed or ready, but is itself blocked by something earlier',
  CANCELLED: 'the prerequisite was cancelled (cancellation does not satisfy a gate)',
}

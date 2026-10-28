/** Human wording for stable codes. Only these tables reach the screen: server text is never echoed. */

export const EXECUTION_LABEL: Record<string, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  WAITING: 'Waiting',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const DEPENDENCY_LABEL: Record<string, string> = { READY: 'Ready', BLOCKED: 'Blocked' }
export const TIMING_LABEL: Record<string, string> = {
  ON_TRACK: 'On track',
  DUE_SOON: 'Due soon',
  OVERDUE: 'Overdue',
}
export const ATTENTION_LABEL: Record<string, string> = {
  NORMAL: 'Normal',
  ATTENTION: 'Needs attention',
  CRITICAL: 'Critical',
}
export const KIND_LABEL: Record<string, string> = { REQUIREMENT: 'Requirement', ACTION: 'Action' }
export const VERIFICATION_LABEL: Record<string, string> = {
  NOT_REQUIRED: 'Not required',
  UNVERIFIED: 'Unverified',
  PARTIALLY_VERIFIED: 'Partially verified',
  VERIFIED: 'Verified',
  DISPUTED: 'Disputed',
}

export const GATE_LABEL: Record<string, string> = {
  COMPLETION: 'Completion gate',
  PROOF: 'Proof gate',
}

/** Why one gate is not satisfied: completion and proof are never blurred. */
export const GATE_REASON: Record<string, string> = {
  NOT_COMPLETED: 'the prerequisite is not completed',
  NOT_VERIFIED: 'the prerequisite is completed but not verified',
  UPSTREAM_BLOCKED: 'the prerequisite is itself blocked',
  CANCELLED: 'the prerequisite was cancelled (cancellation does not satisfy a gate)',
}

export const ATTENTION_REASON: Record<string, string> = {
  CRITICAL_CHAIN: 'unsatisfied prerequisite of a critical milestone',
  ESCALATED: 'escalated by an owner',
  OVERDUE: 'overdue',
  PROOF_DISPUTED: 'proof is disputed',
  COMPLETED_UNVERIFIED: 'completed but not verified',
  WAITING: 'waiting on an external condition',
}

export const MILESTONE_REASON: Record<string, string> = {
  CANCELLED: 'cancelled',
  NOT_COMPLETED: 'not completed',
  PROOF_DISPUTED: 'proof disputed',
  PROOF_NOT_VERIFIED: 'proof not verified',
  DEPENDENCY_BLOCKED: 'blocked by prerequisites',
  NOT_FOUND: 'no longer exists',
}

export const MILESTONE_STATE_LABEL: Record<string, string> = {
  UNASSESSED: 'Not assessed: no prerequisites declared',
  READY: 'Ready',
  NOT_READY: 'Not ready',
}

/**
 * Execution states offered as the next step. This mirrors the approved table only as an
 * affordance; the API is authoritative and refuses anything else, with the allowed alternatives.
 */
export function offeredTransitions(from: string, role: string): string[] {
  const owner = role === 'OWNER'
  switch (from) {
    case 'NOT_STARTED':
      return ['IN_PROGRESS', 'WAITING', 'COMPLETED', ...(owner ? ['CANCELLED'] : [])]
    case 'IN_PROGRESS':
      return ['WAITING', 'COMPLETED', ...(owner ? ['CANCELLED'] : [])]
    case 'WAITING':
      return ['IN_PROGRESS', 'COMPLETED', ...(owner ? ['CANCELLED'] : [])]
    case 'COMPLETED':
    case 'CANCELLED':
      return owner ? ['IN_PROGRESS'] : []
    default:
      return []
  }
}

export const TRANSITION_VERB: Record<string, string> = {
  IN_PROGRESS: 'Start / resume work',
  WAITING: 'Wait on an external party',
  COMPLETED: 'Mark completed',
  CANCELLED: 'Cancel (owner)',
}

/** Display an instant with its explicit UTC offset, never a guessed local zone. */
export function formatInstant(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.toISOString().slice(0, 16).replace('T', ' ')} UTC`
}

/** Display-only Vietnamese labels; stable state IDs and ordering are unchanged. */
export const WORK_LABEL_VI: Record<string, string> = {
  REQUIREMENT: 'Yêu cầu',
  ACTION: 'Hành động',
  NOT_STARTED: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang thực hiện',
  WAITING: 'Đang chờ',
  COMPLETED: 'Đã hoàn tất',
  CANCELLED: 'Đã hủy',
  READY: 'Sẵn sàng',
  BLOCKED: 'Bị chặn',
  ON_TRACK: 'Đúng hạn',
  DUE_SOON: 'Sắp đến hạn',
  OVERDUE: 'Quá hạn',
  NORMAL: 'Bình thường',
  ATTENTION: 'Cần chú ý',
  CRITICAL: 'Nghiêm trọng',
  UNVERIFIED: 'Chưa xác minh',
  VERIFIED: 'Đã xác minh',
  PARTIALLY_VERIFIED: 'Đã xác minh một phần',
  DISPUTED: 'Đang tranh chấp',
  NOT_REQUIRED: 'Không bắt buộc',
  COMPLETION: 'Điều kiện hoàn tất',
  PROOF: 'Điều kiện bằng chứng',
}

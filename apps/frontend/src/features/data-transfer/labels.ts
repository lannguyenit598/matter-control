import type { RowStatus } from './schemas'

/** Why a row failed, in words. Only this table reaches the screen; server text is never echoed. */
const FAILURE: Record<string, string> = {
  stale: 'The item changed since you read it. Preview again to get its current revision.',
  'unknown-item': 'No such item in this matter.',
  role: 'Your role cannot edit this matter.',
  'not-a-member': 'The owner must be an active member of this matter.',
  validation: 'A value is not valid.',
  'key-reuse': 'This attempt identity was already used for different content.',
  'content-conflict':
    'This source and row key were imported before with different content. Nothing was overwritten.',
  'group-rejected': 'Another row in its connected group was rejected, so the whole group was.',
  forbidden: 'You no longer have access to import into this matter.',
  'not-found': 'This matter is no longer available to you.',
  storage: 'The group was rolled back by a storage error. Nothing was applied.',
}

const FAILURE_VI: Record<string, string> = {
  stale: 'Mục đã thay đổi. Xem trước lại để lấy phiên bản hiện tại.',
  'unknown-item': 'Hồ sơ này không có mục đó.',
  role: 'Vai trò của bạn không được sửa hồ sơ này.',
  'not-a-member': 'Người phụ trách phải là thành viên đang hoạt động của hồ sơ.',
  validation: 'Một giá trị không hợp lệ.',
  'key-reuse': 'Mã lần thực hiện này đã được dùng cho nội dung khác.',
  'content-conflict':
    'Nguồn và mã dòng này đã được nhập với nội dung khác. Không có dữ liệu bị ghi đè.',
  'group-rejected': 'Một dòng liên kết bị từ chối, nên toàn bộ nhóm bị từ chối.',
  forbidden: 'Bạn không còn quyền nhập dữ liệu vào hồ sơ này.',
  'not-found': 'Bạn không còn xem được hồ sơ này.',
  storage: 'Lỗi lưu trữ đã hoàn tác cả nhóm. Không có thay đổi được áp dụng.',
}

export function describeRowFailure(code: string | undefined, locale: 'en' | 'vi' = 'en'): string {
  const labels = locale === 'vi' ? FAILURE_VI : FAILURE
  return (
    (code && labels[code]) ||
    (locale === 'vi'
      ? 'Dòng này bị từ chối. Không có thay đổi được áp dụng.'
      : 'This row was refused. Nothing was applied.')
  )
}

/**
 * Action failures that mean the right to SEE this matter ended (R8-N01; R9 error table): 404 answers
 * uniformly and a missing session shows nothing. A 403 is different: the matter stays visible and
 * only the write is withheld, so the draft and any unresolved attempt are kept, read-only.
 */
export const ACCESS_LOST = new Set(['not-found', 'unauthenticated'])

/** A row refused because the actor's access went away between the preview and the commit. */
export const ROW_ACCESS_LOST = new Set(['not-found', 'hidden'])

export const ACCESS_LOST_TEXT =
  'Your access to this matter ended. Everything you entered, the preview and any results were removed from this page, and nothing was kept. If an earlier attempt may have been applied, ask an owner to check the matter history.'

export const STATUS_LABEL: Record<RowStatus, string> = {
  SUCCESS: 'Applied',
  SUCCESS_REPLAYED: 'Already applied',
  FAILURE: 'Failed',
  UNKNOWN: 'Unknown',
}

type Phrase = { en: string; vi: string }

/** A recorded change in words. Unknown types fall back to a generic sentence; the raw type stays in the details. */
const CHANGE_PHRASE: Record<string, Phrase> = {
  'action.created': { en: 'was created', vi: 'được tạo' },
  'requirement.created': { en: 'was created', vi: 'được tạo' },
  'work.updated': { en: 'had its details changed', vi: 'được sửa chi tiết' },
  'work.execution_changed': { en: 'changed status', vi: 'đổi trạng thái' },
  'work.dependency_changed': {
    en: 'became ready or blocked',
    vi: 'chuyển sang sẵn sàng hoặc bị chặn',
  },
  'work.verification_changed': { en: 'changed verification', vi: 'đổi trạng thái xác minh' },
  'work.applicability_changed': {
    en: 'changed whether proof is needed',
    vi: 'đổi yêu cầu về bằng chứng',
  },
  'dependency.added': { en: 'gained a prerequisite', vi: 'có thêm điều kiện tiên quyết' },
  'dependency.removed': { en: 'lost a prerequisite', vi: 'bỏ một điều kiện tiên quyết' },
  'criterion.created': { en: 'gained a proof criterion', vi: 'có thêm tiêu chí bằng chứng' },
  'criterion.revised': { en: 'had a proof criterion revised', vi: 'sửa một tiêu chí bằng chứng' },
  'evidence.submitted': { en: 'received evidence', vi: 'nhận bằng chứng' },
  'evidence.claimed': {
    en: 'had evidence offered for a criterion',
    vi: 'có bằng chứng được đưa ra cho một tiêu chí',
  },
  'evidence.withdrawn': { en: 'had evidence withdrawn', vi: 'có bằng chứng bị rút' },
  'assessment.recorded': { en: 'had evidence assessed', vi: 'có bằng chứng được đánh giá' },
  'assessment.revoked': { en: 'had an acceptance revoked', vi: 'bị thu hồi một chấp nhận' },
  'dispute.raised': { en: 'had an acceptance challenged', vi: 'có chấp nhận bị phản đối' },
  'dispute.resolved': { en: 'had a challenge resolved', vi: 'có phản đối được giải quyết' },
  'document.created': { en: 'was created', vi: 'được tạo' },
  'document.version_added': { en: 'received a new version', vi: 'có phiên bản mới' },
  'document.promoted': { en: 'had a version made current', vi: 'được chọn phiên bản hiện hành' },
  'signature.observed': { en: 'had a signature recorded', vi: 'có chữ ký được ghi nhận' },
  'filing.created': { en: 'was created', vi: 'được tạo' },
  'filing.stage_changed': { en: 'moved to another stage', vi: 'chuyển sang giai đoạn khác' },
  'filing.negative_outcome': {
    en: 'recorded a rejection or withdrawal',
    vi: 'ghi nhận bị từ chối hoặc rút',
  },
  'filing.observation_corrected': {
    en: 'had an observation corrected',
    vi: 'có ghi nhận được đính chính',
  },
  'filing.work_changed': { en: 'had its work state changed', vi: 'đổi trạng thái công việc' },
  'subject.proof_epoch_advanced': {
    en: 'was reopened for new proof',
    vi: 'được mở lại để lấy bằng chứng mới',
  },
  'milestone.created': { en: 'was created', vi: 'được tạo' },
  'milestone.prerequisites_changed': {
    en: 'had its prerequisites changed',
    vi: 'đổi điều kiện tiên quyết',
  },
  'party.created': { en: 'was added', vi: 'được thêm' },
  'party.updated': { en: 'was updated', vi: 'được cập nhật' },
  'workstream.created': { en: 'was created', vi: 'được tạo' },
  'context.created': { en: 'was added', vi: 'được thêm' },
  'context.updated': { en: 'was updated', vi: 'được cập nhật' },
  'review.grid_created': { en: 'was created', vi: 'được tạo' },
  'review.answer_recorded': { en: 'received an answer', vi: 'nhận một câu trả lời' },
}

export function changePhrase(type: string): Phrase {
  return CHANGE_PHRASE[type] ?? { en: 'was changed', vi: 'có thay đổi' }
}

const TARGET_NOUN: Record<string, Phrase> = {
  ACTION: { en: 'Action', vi: 'Hành động' },
  REQUIREMENT: { en: 'Requirement', vi: 'Yêu cầu' },
  FILING: { en: 'Filing', vi: 'Thủ tục' },
  CRITERION: { en: 'Proof criterion', vi: 'Tiêu chí bằng chứng' },
  EVIDENCE: { en: 'Evidence', vi: 'Bằng chứng' },
  CLAIM: { en: 'Evidence offer', vi: 'Đề nghị bằng chứng' },
  ASSESSMENT: { en: 'Assessment', vi: 'Đánh giá' },
  DISPUTE: { en: 'Challenge', vi: 'Phản đối' },
  DOCUMENT: { en: 'Document', vi: 'Tài liệu' },
  DOCUMENT_VERSION: { en: 'Document version', vi: 'Phiên bản tài liệu' },
  DEPENDENCY: { en: 'Prerequisite', vi: 'Điều kiện tiên quyết' },
  MILESTONE: { en: 'Milestone', vi: 'Cột mốc' },
  PARTY: { en: 'External party', vi: 'Bên ngoài' },
  WORKSTREAM: { en: 'Workstream', vi: 'Nhóm công việc' },
  CONTEXT_RECORD: { en: 'Context record', vi: 'Bản ghi bối cảnh' },
  REVIEW_GRID: { en: 'Review matrix', vi: 'Ma trận rà soát' },
}

export function targetNoun(kind: string): Phrase {
  return TARGET_NOUN[kind] ?? { en: 'Record', vi: 'Bản ghi' }
}

/** Where a change's target can be opened; only kinds with their own page get a link. */
export function targetHref(matterId: string, kind: string, id: string): string | null {
  if (kind === 'ACTION' || kind === 'REQUIREMENT' || kind === 'FILING')
    return `/matters/${encodeURIComponent(matterId)}/work/${encodeURIComponent(id)}`
  if (kind === 'DOCUMENT')
    return `/matters/${encodeURIComponent(matterId)}/documents/${encodeURIComponent(id)}`
  return null
}

const EXEC: Record<string, Phrase> = {
  NOT_STARTED: { en: 'Not started', vi: 'Chưa bắt đầu' },
  IN_PROGRESS: { en: 'In progress', vi: 'Đang thực hiện' },
  WAITING: { en: 'Waiting', vi: 'Đang chờ' },
  COMPLETED: { en: 'Completed', vi: 'Đã hoàn tất' },
  CANCELLED: { en: 'Cancelled', vi: 'Đã hủy' },
}
const DEP: Record<string, Phrase> = {
  READY: { en: 'Ready', vi: 'Sẵn sàng' },
  BLOCKED: { en: 'Blocked', vi: 'Bị chặn' },
}
const VER: Record<string, Phrase> = {
  UNVERIFIED: { en: 'Unverified', vi: 'Chưa xác minh' },
  PARTIALLY_VERIFIED: { en: 'Partially verified', vi: 'Xác minh một phần' },
  VERIFIED: { en: 'Verified', vi: 'Đã xác minh' },
  DISPUTED: { en: 'Disputed', vi: 'Bị phản đối' },
  NOT_REQUIRED: { en: 'Proof not required', vi: 'Không cần bằng chứng' },
}

export const executionPhrase = (v: string): Phrase => EXEC[v] ?? { en: v, vi: v }
export const dependencyPhrase = (v: string): Phrase => DEP[v] ?? { en: v, vi: v }
export const verificationPhrase = (v: string): Phrase => VER[v] ?? { en: v, vi: v }

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

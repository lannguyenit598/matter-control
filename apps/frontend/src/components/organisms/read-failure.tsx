import { LocalizedText } from '@/components/molecules/localized-text'
import type { ReactNode } from 'react'
import { CloudOff, LockKeyhole, LogIn, RefreshCw, SearchX, TriangleAlert } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@/components/atoms/button'
import { EmptyState } from '@/components/molecules/empty-state'

import { PurgeDrafts } from './draft-scope'

export type ReadFailureProps = {
  kind: 'sign-in' | 'forbidden' | 'not-found' | 'unavailable' | 'error'
  /** Where "Try again" goes (usually the current page). */
  retryHref?: string
  /** Shown for not-found, e.g. "workspace". */
  subject?: string
  /**
   * The page heading the failed read belongs to (UX-L-05): a failure state keeps the page's h1
   * and context instead of leaving the page heading-less. Rendered above the state itself.
   */
  heading?: ReactNode
  /**
   * A section of a page the user can still read (a role-limited or sub-resource read): its
   * denial is not a loss of the page's scope, so it keeps drafts. An ended session is never
   * partial. Default is a primary read.
   */
  partial?: boolean
}

/** The vi names of the read subjects; an unknown subject falls back to its own text. */
const SUBJECT_VI: Record<string, string> = {
  matter: 'hồ sơ',
  'matter list': 'danh sách hồ sơ',
  workspace: 'không gian làm việc',
  'workspace list': 'danh sách không gian làm việc',
  document: 'tài liệu',
  filing: 'thủ tục',
  agenda: 'lịch',
  history: 'lịch sử',
  grid: 'bảng công việc',
  list: 'danh sách',
  proof: 'bằng chứng',
  record: 'bản ghi',
  requirement: 'yêu cầu',
  reviews: 'rà soát',
  'review list': 'danh sách rà soát',
  'Control Room': 'Phòng điều hành',
  item: 'mục',
}

function subjectVi(subject: string): string {
  return SUBJECT_VI[subject] ?? subject
}

/** One truthful state per read failure: never an empty list, a zero, or a spinner that never ends. */
export function ReadFailure({ partial, heading, ...props }: ReadFailureProps) {
  // The session ended, or a primary read was denied (the right to see this ended): keep no draft.
  const lost =
    props.kind === 'sign-in' ||
    (!partial && (props.kind === 'forbidden' || props.kind === 'not-found'))
  return (
    <>
      {lost && (
        <PurgeDrafts reason={props.kind === 'sign-in' ? 'session-ended' : 'access-recheck'} />
      )}
      <div className="flex flex-col gap-4">
        {heading && <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>}
        <ReadFailureState {...props} />
      </div>
    </>
  )
}

function ReadFailureState({ kind, retryHref, subject = 'item' }: ReadFailureProps) {
  switch (kind) {
    case 'sign-in':
      return (
        <EmptyState
          icon={<LockKeyhole />}
          title={<LocalizedText en="Sign-in required" vi="Cần đăng nhập" />}
          description={
            <LocalizedText
              en="Your session has ended or you are not signed in."
              vi="Phiên đã kết thúc hoặc bạn chưa đăng nhập."
            />
          }
          action={
            <Link
              href={`/login${retryHref ? `?returnTo=${encodeURIComponent(retryHref)}` : ''}`}
              className={buttonVariants()}
            >
              <LogIn aria-hidden />
              <LocalizedText en="Sign in" vi="Đăng nhập" />
            </Link>
          }
        />
      )
    case 'forbidden':
      return (
        <EmptyState
          icon={<LockKeyhole />}
          title={<LocalizedText en="Not permitted" vi="Không được phép" />}
          description={
            <LocalizedText
              en="You do not have permission to view this."
              vi="Bạn không có quyền xem nội dung này."
            />
          }
        />
      )
    case 'not-found':
      return (
        <EmptyState
          icon={<SearchX />}
          title={
            <LocalizedText
              en={`This ${subject} is not available`}
              vi={`${subjectVi(subject)} này không khả dụng`}
            />
          }
          description={
            <LocalizedText
              en="It does not exist, or you do not have access to it."
              vi="Nội dung không tồn tại hoặc bạn không có quyền truy cập."
            />
          }
        />
      )
    case 'unavailable':
      return (
        <EmptyState
          icon={<CloudOff />}
          title={<LocalizedText en="Temporarily unavailable" vi="Tạm thời không khả dụng" />}
          description={
            <LocalizedText
              en="The service could not be reached. Your session is unaffected. Nothing shown here is a result."
              vi="Chưa kết nối được dịch vụ. Phiên của bạn không bị ảnh hưởng. Không có gì hiển thị ở đây là một kết quả."
            />
          }
          action={
            retryHref ? (
              <Link href={retryHref} className={buttonVariants({ variant: 'outline' })}>
                <RefreshCw aria-hidden />
                <LocalizedText en="Try again" vi="Thử lại" />
              </Link>
            ) : undefined
          }
        />
      )
    default:
      return (
        <EmptyState
          icon={<TriangleAlert />}
          title={<LocalizedText en="Something went wrong" vi="Đã xảy ra lỗi" />}
          description={
            <LocalizedText
              en="This could not be loaded. Please try again."
              vi="Không tải được nội dung. Vui lòng thử lại."
            />
          }
        />
      )
  }
}

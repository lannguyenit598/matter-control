import { LocalizedText } from '@/components/molecules/localized-text'
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
   * A section of a page the user can still read (a role-limited or sub-resource read): its
   * denial is not a loss of the page's scope, so it keeps drafts. An ended session is never
   * partial. Default is a primary read.
   */
  partial?: boolean
}

/** One truthful state per read failure: never an empty list, a zero, or a spinner that never ends. */
export function ReadFailure({ partial, ...props }: ReadFailureProps) {
  // The session ended, or a primary read was denied (the right to see this ended): keep no draft.
  const lost =
    props.kind === 'sign-in' ||
    (!partial && (props.kind === 'forbidden' || props.kind === 'not-found'))
  return (
    <>
      {lost && <PurgeDrafts />}
      <ReadFailureState {...props} />
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
          title={`This ${subject} is not available`}
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
          description="The service could not be reached. Your session is unaffected. Nothing shown here is a result."
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

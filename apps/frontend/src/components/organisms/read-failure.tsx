import { LocalizedText } from '@/components/molecules/localized-text'
import { CloudOff, LockKeyhole, SearchX, TriangleAlert } from 'lucide-react'
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
}

/** One truthful state per read failure: never an empty list, a zero, or a spinner that never ends. */
export function ReadFailure(props: ReadFailureProps) {
  // The right to see this ended (or the session did): keep no draft typed under it.
  const lost = props.kind === 'sign-in' || props.kind === 'forbidden' || props.kind === 'not-found'
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

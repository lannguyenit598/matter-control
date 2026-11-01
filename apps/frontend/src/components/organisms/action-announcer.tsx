'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { LocalizedText } from '@/components/molecules/localized-text'
import type { McActionResult } from '@/lib/mc/action-result'

/**
 * The shell-level polite live region (P-09 / F8, WCAG 4.1.3): action outcomes are announced to
 * screen readers even when the visual result lands in an alert the user is not looking at. Any
 * client code calls announceAction({ en, vi }); the region stays out of the visual layout
 * (sr-only) and never steals focus. Copy follows the OpenDesign pattern: state the outcome, no
 * codes.
 */
export const ANNOUNCE_EVENT = 'mc:announce'

export type Announcement = { en: string; vi: string }

const ShellAnnouncements = createContext(false)

/** Forms outside the shell retain their existing local live feedback. */
export function useShellAnnouncements() {
  return useContext(ShellAnnouncements)
}

export function announceAction(announcement: Announcement) {
  window.dispatchEvent(new CustomEvent<Announcement>(ANNOUNCE_EVENT, { detail: announcement }))
}

const failures: Record<Extract<McActionResult, { ok: false }>['kind'], Announcement> = {
  validation: {
    en: 'Please fix the highlighted fields.',
    vi: 'Vui lòng sửa các trường được đánh dấu.',
  },
  unauthenticated: {
    en: 'Your session has ended. Sign in again.',
    vi: 'Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.',
  },
  forbidden: {
    en: 'You do not have permission to do this.',
    vi: 'Bạn không có quyền thực hiện thao tác này.',
  },
  'not-found': {
    en: 'This item is no longer available to you.',
    vi: 'Bạn không còn truy cập được mục này.',
  },
  stale: {
    en: 'This changed. Reload the current state before trying again.',
    vi: 'Dữ liệu đã thay đổi. Đọc lại trạng thái hiện tại trước khi thử lại.',
  },
  unavailable: {
    en: 'The service is temporarily unavailable. Try again shortly.',
    vi: 'Dịch vụ tạm thời chưa sẵn sàng. Vui lòng thử lại sau.',
  },
  'outcome-unknown': {
    en: 'Outcome not confirmed. Retry only the same request to confirm.',
    vi: 'Chưa xác nhận được kết quả. Chỉ thử lại đúng yêu cầu này để xác nhận.',
  },
  'key-conflict': {
    en: 'This request conflicts with an earlier attempt. Reload before starting again.',
    vi: 'Yêu cầu xung đột với lần gửi trước. Đọc lại trạng thái trước khi bắt đầu lại.',
  },
  'last-owner': {
    en: 'The last owner cannot be removed. Transfer ownership first.',
    vi: 'Không thể xóa chủ sở hữu cuối cùng. Hãy chuyển quyền sở hữu trước.',
  },
  rejected: {
    en: 'The change was refused. Review the explanation in the form.',
    vi: 'Thay đổi chưa được chấp nhận. Xem lý do trong biểu mẫu.',
  },
  error: {
    en: 'Could not confirm the change. Review the form before trying again.',
    vi: 'Chưa xác nhận được thay đổi. Kiểm tra biểu mẫu trước khi thử lại.',
  },
}

/** Only fixed UI copy reaches the global region; never relay record text or raw server details. */
export function announceActionResult(result: McActionResult) {
  announceAction(
    result.ok
      ? result.replayed
        ? {
            en: 'Already saved: this request had been recorded before.',
            vi: 'Đã lưu: yêu cầu này đã được ghi nhận trước đó.',
          }
        : { en: 'Saved.', vi: 'Đã lưu.' }
      : result.kind === 'outcome-unknown' && !result.retrySameKey
        ? {
            en: 'Outcome not confirmed. Do not resend. Reload the current state.',
            vi: 'Chưa xác nhận được kết quả. Không gửi lại. Hãy đọc lại trạng thái hiện tại.',
          }
        : failures[result.kind],
  )
}

export function ActionAnnouncer({ children }: { children?: ReactNode }) {
  const [current, setCurrent] = useState<{ message: Announcement; sequence: number } | null>(null)
  useEffect(() => {
    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<Announcement>).detail
      if (typeof detail?.en === 'string' && typeof detail.vi === 'string') {
        setCurrent((previous) => ({ message: detail, sequence: (previous?.sequence ?? 0) + 1 }))
      }
    }
    window.addEventListener(ANNOUNCE_EVENT, onAnnounce)
    return () => window.removeEventListener(ANNOUNCE_EVENT, onAnnounce)
  }, [])
  return (
    <ShellAnnouncements.Provider value={true}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        data-slot="action-announcer"
        className="sr-only"
      >
        {current && (
          <span key={current.sequence}>
            <LocalizedText en={current.message.en} vi={current.message.vi} />
          </span>
        )}
      </div>
    </ShellAnnouncements.Provider>
  )
}

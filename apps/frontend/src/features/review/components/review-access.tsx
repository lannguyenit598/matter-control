'use client'

import Link from 'next/link'
import { createContext, useContext, useState, type ReactNode } from 'react'

import { LocalizedText } from '@/components/molecules/localized-text'

export type AccessLossKind = 'unauthenticated' | 'forbidden' | 'not-found'

export type AccessLoss = { kind: AccessLossKind; error: string }

const ReviewAccess = createContext<{ report: (loss: AccessLoss) => void } | null>(null)

/**
 * One writer reports a definitive access loss for this grid (unauthenticated/forbidden/not-found
 * from a review command); the provider then stops rendering the protected surface and announces
 * the denial. The state is component state: a fresh navigation re-authorizes server-side before
 * anything protected is shown again.
 */
export function ReviewAccessProvider({
  backHref,
  children,
}: {
  backHref: string
  children: ReactNode
}) {
  const [lost, setLost] = useState<AccessLoss | null>(null)
  if (lost) return <AccessLossNotice loss={lost} backHref={backHref} />
  return (
    <ReviewAccess.Provider value={{ report: setLost }}>
      <div className="flex flex-col gap-6">{children}</div>
    </ReviewAccess.Provider>
  )
}

export const useReviewAccess = () => useContext(ReviewAccess)

/**
 * What a denied surface shows instead of its content: the refusal, why, and the safe ways out
 * (back to the list the server re-authorizes, or sign in). Nothing protected is rendered.
 */
export function AccessLossNotice({ loss, backHref }: { loss: AccessLoss; backHref: string }) {
  return (
    <aside
      role="alert"
      aria-label="Access ended"
      className="flex flex-col gap-2 rounded-lg border bg-card p-4"
    >
      <p className="font-medium">
        {loss.kind === 'unauthenticated' ? (
          <LocalizedText en="Your session has ended." vi="Phiên của bạn đã kết thúc." />
        ) : (
          <LocalizedText
            en="You no longer have access to this review surface."
            vi="Bạn không còn quyền truy cập bề mặt rà soát này."
          />
        )}
      </p>
      <p className="text-sm text-muted-foreground">{loss.error}</p>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href={backHref} className="underline">
          <LocalizedText en="Back to all review grids" vi="Về danh sách bảng rà soát" />
        </Link>
        {loss.kind === 'unauthenticated' && (
          <Link href="/login" className="underline">
            <LocalizedText en="Sign in" vi="Đăng nhập" />
          </Link>
        )}
      </div>
    </aside>
  )
}

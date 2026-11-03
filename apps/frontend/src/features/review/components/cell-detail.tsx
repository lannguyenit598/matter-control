'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { LocalizedInstant } from '@/components/molecules/localized-instant'
import { LocalizedText } from '@/components/molecules/localized-text'
import { useDraftNamespace } from '@/components/organisms/draft-scope'

import { clearScopeDrafts } from '@/lib/mc/drafts'

import { cellLabel, type MatrixFilter } from '../matrix'
import type { ReviewAnswer, ReviewGridView } from '../schemas'
import { reviewHistoryAction } from '../actions'

import { AnswerForm } from './answer-form'
import { AccessLossNotice, useReviewAccess, type AccessLoss } from './review-access'
import { LABEL_TEXT, reviewHref } from './review-matrix'

/** One authorized page of the cell's answer history: the items and whether older ones exist. */
export type AnswerHistoryPage = { items: ReviewAnswer[]; nextCursor: string | null }

const STATE_TEXT: Record<ReviewAnswer['state'], { en: string; vi: string }> = {
  REVIEWED: { en: 'Reviewed', vi: 'Đã rà soát' },
  ABSENT: { en: 'Absent in this document', vi: 'Không có trong tài liệu' },
  UNABLE: { en: 'Unable to review', vi: 'Không thể rà soát' },
}

const who = (names: Record<string, string>, id: string) => names[id]

function Person({ names, id }: { names: Record<string, string>; id: string }) {
  return who(names, id) ?? <LocalizedText en="a former member" vi="một thành viên cũ" />
}

/**
 * One cell, in full: the exact version, the wording the answer actually addressed, the person's
 * conclusion with their typed references (always marked "not validated"), and the history. The
 * answer form is offered only to people who may write.
 *
 * A definitive refusal of a command on this surface (unauthenticated/forbidden/not-found) ends the
 * right to see it: the loaded content is removed, the grid's session drafts and pending attempts
 * are purged, and the wider review surface is told (so the matrix and structure controls clear
 * too). A 412 conflict or an unknown outcome keeps everything for safe recovery.
 */
export function CellDetail({
  matterId,
  view,
  cell,
  filter,
  history,
  names,
  canWrite,
}: {
  matterId: string
  view: ReviewGridView
  cell: { versionId: string; questionId: string }
  filter: MatrixFilter
  history: AnswerHistoryPage | null
  names: Record<string, string>
  canWrite: boolean
}) {
  const [lost, setLost] = useState<AccessLoss | null>(null)
  const [trail, setTrail] = useState<AnswerHistoryPage | null>(history)
  const [more, setMore] = useState<'idle' | 'loading' | 'error'>('idle')
  const access = useReviewAccess()
  const namespace = useDraftNamespace()
  const close = reviewHref(matterId, view.id, filter)
  const onAccessLoss = (loss: AccessLoss) => {
    // The grid's protected scope is gone: nothing typed or pending for it may survive the
    // refusal, in this form or in any other cell's form of the same grid.
    if (namespace) clearScopeDrafts(namespace, `review:${view.id}:`)
    setLost(loss)
    access?.report(loss)
  }
  const loadOlder = async () => {
    if (!trail?.nextCursor) return
    setMore('loading')
    const r = await reviewHistoryAction({
      matterId,
      gridId: view.id,
      versionId: cell.versionId,
      questionId: cell.questionId,
      cursor: trail.nextCursor,
    })
    if (r.ok) {
      // The keyset continuation never repeats or skips older rows; append in order.
      setTrail({
        items: [...trail.items, ...(r.items as ReviewAnswer[])],
        nextCursor: r.nextCursor,
      })
      setMore('idle')
    } else if (r.kind === 'unauthenticated' || r.kind === 'forbidden' || r.kind === 'not-found') {
      onAccessLoss({ kind: r.kind, error: r.error })
    } else {
      setMore('error') // transient: the already-read history stays, a retry is offered
    }
  }
  if (lost) {
    // Nothing protected and no write control: the refusal, why, and the safe ways out.
    return <AccessLossNotice loss={lost} backHref={close} />
  }
  const version = view.versions.find((v) => v.versionId === cell.versionId)
  const question = view.questions.find((q) => q.id === cell.questionId)
  const data = view.cells.find(
    (c) => c.versionId === cell.versionId && c.questionId === cell.questionId,
  )
  if (!version || !question || !data) {
    return (
      <p role="status" className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        <LocalizedText
          en="That cell is no longer in this grid. Choose another cell."
          vi="Ô đó không còn trong bảng này. Hãy chọn ô khác."
        />{' '}
        <Link href={close} className="underline">
          <LocalizedText en="Close" vi="Đóng" />
        </Link>
      </p>
    )
  }
  const a = data.answer
  const answered = a
    ? view.questionHistory.find((q) => q.id === a.questionId && q.revision === a.questionRevision)
    : undefined
  const label = cellLabel(data)
  return (
    <aside aria-label="Cell detail" className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="font-semibold break-words">{question.text}</h3>
          <p className="text-sm break-words text-muted-foreground">
            {version.documentName} · v{version.no} · {version.filename}
            {!version.current && (
              <>
                {' · '}
                <LocalizedText en="not the current version" vi="không phải phiên bản hiện hành" />
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={label === 'STALE' ? 'timing' : 'outline'}>
            <LocalizedText en={LABEL_TEXT[label].en} vi={LABEL_TEXT[label].vi} />
          </Badge>
          <Link href={close} className="control-target text-sm underline">
            <LocalizedText en="Close" vi="Đóng" />
          </Link>
        </div>
      </div>

      {a ? (
        <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
          <dt className="text-muted-foreground">
            <LocalizedText en="Conclusion" vi="Kết luận" />
          </dt>
          <dd>
            <LocalizedText en={STATE_TEXT[a.state].en} vi={STATE_TEXT[a.state].vi} />
          </dd>
          {a.text && (
            <>
              <dt className="text-muted-foreground">
                <LocalizedText en="What was found" vi="Đã thấy gì" />
              </dt>
              <dd className="break-words whitespace-pre-line">{a.text}</dd>
            </>
          )}
          {(a.pageRef || a.quoteRef) && (
            <>
              <dt className="text-muted-foreground">
                <LocalizedText en="References" vi="Tham chiếu" />
              </dt>
              <dd className="break-words">
                {a.pageRef && (
                  <span>
                    <LocalizedText en="page" vi="trang" /> {a.pageRef}{' '}
                  </span>
                )}
                {a.quoteRef && <q className="whitespace-pre-line">{a.quoteRef}</q>}{' '}
                <span className="text-muted-foreground">
                  <LocalizedText
                    en="(typed by a person, not validated)"
                    vi="(do người dùng nhập, chưa được xác thực)"
                  />
                </span>
              </dd>
            </>
          )}
          <dt className="text-muted-foreground">
            <LocalizedText en="Recorded by" vi="Ghi bởi" />
          </dt>
          <dd>
            <Person names={names} id={a.author} /> · <LocalizedInstant iso={a.answeredAt} />
          </dd>
          {data.stale && (
            <>
              <dt className="text-timing">
                <LocalizedText en="Stale" vi="Lỗi thời" />
              </dt>
              <dd>
                <LocalizedText
                  en="The question was reworded after this answer. It answered:"
                  vi="Câu hỏi đã được sửa lời sau câu trả lời này. Câu trả lời dành cho:"
                />{' '}
                <q className="break-words">
                  {answered?.text ?? <LocalizedText en="an earlier wording" vi="lời trước đó" />}
                </q>
              </dd>
            </>
          )}
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">
          <LocalizedText en="No one has answered this cell yet." vi="Chưa ai trả lời ô này." />
        </p>
      )}

      {trail && (trail.items.length > 1 || trail.nextCursor) && (
        <section aria-label="Answer history" className="flex flex-col gap-2 text-sm">
          <h4 className="font-medium">
            <LocalizedText en="History" vi="Lịch sử" />
          </h4>
          <ol className="flex flex-col gap-3">
            {trail.items.map((h) => {
              const wording = view.questionHistory.find(
                (q) => q.id === h.questionId && q.revision === h.questionRevision,
              )
              return (
                <li key={h.id} className="flex flex-col gap-0.5 border-l-2 pl-3">
                  <span className="font-medium">
                    <LocalizedText en={STATE_TEXT[h.state].en} vi={STATE_TEXT[h.state].vi} />
                    <span className="font-normal text-muted-foreground">
                      {' · '}
                      <Person names={names} id={h.author} /> ·{' '}
                      <LocalizedInstant iso={h.answeredAt} />
                    </span>
                  </span>
                  {wording && (
                    <span className="text-xs text-muted-foreground">
                      <LocalizedText en="Answered:" vi="Trả lời cho:" /> <q>{wording.text}</q>
                    </span>
                  )}
                  {h.text && <span className="break-words whitespace-pre-line">{h.text}</span>}
                  {(h.pageRef || h.quoteRef) && (
                    <span className="text-xs break-words text-muted-foreground">
                      {h.pageRef && (
                        <>
                          <LocalizedText en="page" vi="trang" /> {h.pageRef}{' '}
                        </>
                      )}
                      {h.quoteRef && <q className="whitespace-pre-line">{h.quoteRef}</q>}{' '}
                      <LocalizedText
                        en="(typed by a person, not validated)"
                        vi="(do người dùng nhập, chưa được xác thực)"
                      />
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
          {more === 'loading' && (
            <p role="status" aria-busy="true" className="text-muted-foreground">
              <LocalizedText en="Loading older answers…" vi="Đang tải các câu trả lời cũ hơn…" />
            </p>
          )}
          {more === 'error' && (
            <p role="alert" className="flex flex-wrap items-center gap-2 text-muted-foreground">
              <LocalizedText
                en="Older answers could not be loaded; what you have read stays."
                vi="Không tải được các câu trả lời cũ hơn; phần đã đọc vẫn còn."
              />
              <Button type="button" variant="outline" onClick={loadOlder}>
                <LocalizedText en="Try again" vi="Thử lại" />
              </Button>
            </p>
          )}
          {trail.nextCursor ? (
            more !== 'loading' && (
              <Button type="button" variant="outline" className="self-start" onClick={loadOlder}>
                <LocalizedText en="Older answers" vi="Các câu trả lời cũ hơn" />
              </Button>
            )
          ) : (
            <p role="status" className="text-xs text-muted-foreground">
              <LocalizedText
                en="You have reached the beginning of this history."
                vi="Bạn đã đến đầu lịch sử của ô này."
              />
            </p>
          )}
        </section>
      )}

      {canWrite && (
        <section aria-label="Answer this cell" className="flex flex-col gap-2 border-t pt-4">
          <h4 className="font-medium">
            {a ? (
              <LocalizedText en="Record a new answer" vi="Ghi câu trả lời mới" />
            ) : (
              <LocalizedText en="Answer this cell" vi="Trả lời ô này" />
            )}
          </h4>
          <AnswerForm
            key={`${cell.versionId}:${cell.questionId}`}
            matterId={matterId}
            gridId={view.id}
            versionId={cell.versionId}
            questionId={cell.questionId}
            expectedAnswerId={a?.id ?? ''}
            questionRevision={question.revision}
            onAccessLoss={onAccessLoss}
          />
        </section>
      )}
    </aside>
  )
}

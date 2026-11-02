'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Timer, Pause, Play, Plus, Square, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Select } from '@/components/atoms/select'
import { Dialog } from '@/components/molecules/dialog'
import { LocalizedText } from '@/components/molecules/localized-text'
import { SearchPicker } from '@/components/molecules/search-picker'
import { useLocale } from '@/hooks/use-locale'
import { useFocus } from '../provider'
import { readFocus } from '../transport'

export function FocusController({ epoch }: { epoch?: string }) {
  const focus = useFocus()
  const [open, setOpen] = useState(false)
  const locale = useLocale()
  if (!focus) return null
  const { view, dispatch } = focus
  const active = view.slot?.active
  const time = `${Math.floor(view.left / 60_000)
    .toString()
    .padStart(2, '0')}:${Math.floor((view.left % 60_000) / 1000)
    .toString()
    .padStart(2, '0')}`
  const enabled = view.status === 'active' || view.status === 'suspended'
  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        aria-label={locale === 'vi' ? 'Mở tập trung' : 'Open Focus'}
        onClick={() => setOpen(true)}
        className="shrink-0"
      >
        <Timer aria-hidden />
        <span className="tabular-nums">
          {active && enabled ? (
            time
          ) : (
            <span className="hidden sm:inline">
              <LocalizedText en="Focus" vi="Tập trung" />
            </span>
          )}
        </span>
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={<LocalizedText en="Focus" vi="Tập trung" />}
        description={
          <LocalizedText
            en="A personal timer over one ready Action. Work status stays unchanged."
            vi="Bộ đếm cá nhân cho một hành động sẵn sàng. Trạng thái công việc không đổi."
          />
        }
      >
        {view.status === 'checking' && (
          <p role="status">
            <LocalizedText en="Checking current access…" vi="Đang kiểm tra quyền hiện tại…" />
          </p>
        )}
        {view.status === 'unsupported' && (
          <p role="status">
            <LocalizedText
              en="Focus coordination is unavailable. Reload after storage and session access are restored. Work remains available."
              vi="Chưa dùng được đồng bộ tập trung. Đọc lại trang sau khi khôi phục lưu trữ và phiên. Bạn vẫn có thể làm việc."
            />
          </p>
        )}
        {view.status === 'summary' && (
          <div className="flex flex-col gap-3">
            <p>
              <LocalizedText
                en="Focus ended. No work was marked complete."
                vi="Phiên tập trung đã kết thúc. Không có công việc nào được đánh dấu hoàn tất."
              />
            </p>
            <Button
              variant="outline"
              onClick={() => {
                void dispatch({ type: 'dismiss' })
              }}
            >
              <LocalizedText en="Dismiss" vi="Đóng thông báo" />
            </Button>
          </div>
        )}
        {active && enabled && (
          <div className="flex flex-col gap-3">
            {view.target ? (
              <div className="min-w-0 break-words">
                <h3 className="font-semibold">{view.target.title}</h3>
                <p className="text-sm text-muted-foreground">{view.target.matterName}</p>
                <p className="text-xs text-muted-foreground">
                  <LocalizedText
                    en={view.target.reason}
                    vi={
                      view.target.reason === 'assigned to you, ready to work'
                        ? 'Giao cho bạn, sẵn sàng thực hiện'
                        : view.target.reason
                    }
                  />
                </p>
                <Link
                  className="inline-flex min-h-10 items-center gap-2 text-sm underline"
                  href={`/matters/${view.target.matterId}/work/${view.target.actionId}`}
                  onClick={() => setOpen(false)}
                >
                  <ArrowUpRight aria-hidden className="size-4" />
                  <LocalizedText en="Open task" vi="Mở công việc" />
                </Link>
              </div>
            ) : (
              <p>
                <LocalizedText
                  en={
                    view.cause === 'clock'
                      ? 'Device time changed. Focus was suspended without adding time.'
                      : view.cause === 'ineligible'
                        ? 'This Action is not currently eligible. Review its state before resuming.'
                        : 'Focus is suspended until current access and eligibility can be verified.'
                  }
                  vi={
                    view.cause === 'clock'
                      ? 'Giờ thiết bị đã thay đổi. Tập trung được tạm dừng và không cộng thêm thời gian.'
                      : view.cause === 'ineligible'
                        ? 'Hành động hiện chưa đủ điều kiện. Kiểm tra trạng thái trước khi tiếp tục.'
                        : 'Tập trung đang tạm dừng đến khi kiểm tra lại quyền và điều kiện hiện tại.'
                  }
                />
              </p>
            )}
            <p className="text-3xl font-semibold tabular-nums" aria-live="off">
              {time}
            </p>
            <p className="text-sm text-muted-foreground">
              <LocalizedText
                en={
                  view.status === 'suspended'
                    ? 'Suspended — resume explicitly after checking.'
                    : active.state === 'PAUSED'
                      ? 'Paused'
                      : 'Running'
                }
                vi={
                  view.status === 'suspended'
                    ? 'Tạm dừng — kiểm tra rồi chủ động tiếp tục.'
                    : active.state === 'PAUSED'
                      ? 'Đã tạm dừng'
                      : 'Đang chạy'
                }
              />
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={view.busy}
                onClick={() => {
                  void dispatch({ type: active.state === 'RUNNING' ? 'pause' : 'resume' })
                }}
              >
                {active.state === 'RUNNING' ? <Pause aria-hidden /> : <Play aria-hidden />}
                <LocalizedText
                  en={active.state === 'RUNNING' ? 'Pause' : 'Resume'}
                  vi={active.state === 'RUNNING' ? 'Tạm dừng' : 'Tiếp tục'}
                />
              </Button>
              <Button
                variant="outline"
                disabled={view.busy || active.state === 'SUSPENDED'}
                onClick={() => {
                  void dispatch({ type: 'extend' })
                }}
              >
                <Plus aria-hidden />
                <LocalizedText en="5 minutes" vi="5 phút" />
              </Button>
              <Button
                variant="outline"
                disabled={view.busy}
                onClick={() => {
                  void dispatch({ type: 'end' })
                }}
              >
                <Square aria-hidden />
                <LocalizedText en="End" vi="Kết thúc" />
              </Button>
            </div>
          </div>
        )}
        {view.status === 'idle' && epoch && (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              const data = new FormData(event.currentTarget)
              const value = String(data.get('target') ?? '')
              const [matterId, actionId] = value.split(':')
              if (matterId && actionId)
                void dispatch({
                  type: 'start',
                  target: { matterId, actionId },
                  minutes: Number(data.get('minutes')) as 15 | 25 | 50,
                })
            }}
          >
            <SearchPicker
              name="target"
              required
              legend={<LocalizedText en="Ready Action" vi="Hành động sẵn sàng" />}
              searchLabel={<LocalizedText en="Find a ready Action" vi="Tìm hành động sẵn sàng" />}
              hint={
                <Link
                  href="/my-actions?queue=ready"
                  className="underline"
                  onClick={() => setOpen(false)}
                >
                  <LocalizedText
                    en="Open the complete Ready queue"
                    vi="Mở đầy đủ hàng đợi Sẵn sàng"
                  />
                </Link>
              }
              search={async (query) => {
                try {
                  const result = await readFocus(epoch, undefined, query)
                  return result.kind === 'candidates'
                    ? {
                        status: 'ok',
                        options: result.candidates.map((x) => ({
                          value: `${x.matterId}:${x.actionId}`,
                          label: `${x.title} · ${x.matterName}`,
                        })),
                        truncated: result.truncated,
                      }
                    : { status: 'unavailable' }
                } catch {
                  return { status: 'unavailable' }
                }
              }}
            />
            <label className="flex items-center gap-2 text-sm">
              <LocalizedText en="Minutes" vi="Phút" />
              <Select
                name="minutes"
                defaultValue="25"
                options={[15, 25, 50].map((n) => ({ value: String(n), label: `${n} min` }))}
              />
            </label>
            <Button type="submit" disabled={view.busy}>
              <Play aria-hidden />
              <LocalizedText en="Start Focus" vi="Bắt đầu tập trung" />
            </Button>
          </form>
        )}
      </Dialog>
    </>
  )
}

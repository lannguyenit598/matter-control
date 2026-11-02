'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Timer } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Select } from '@/components/atoms/select'
import { LocalizedText } from '@/components/molecules/localized-text'
import type { FocusTarget } from '../model'
import { useFocus } from '../provider'

export function FocusCard({
  target,
  eligible = true,
}: {
  target: FocusTarget
  eligible?: boolean
}) {
  const focus = useFocus()
  const [minutes, setMinutes] = useState<15 | 25 | 50>(25)
  if (!eligible)
    return (
      <p className="text-xs text-muted-foreground">
        <LocalizedText
          en="Focus starts only on an assigned ready Action."
          vi="Chỉ có thể tập trung vào hành động sẵn sàng được giao cho bạn."
        />{' '}
        <Link href="/my-actions?queue=ready" className="underline">
          <LocalizedText en="Open Ready queue" vi="Mở hàng đợi Sẵn sàng" />
        </Link>
      </p>
    )
  if (!focus) return null
  const { view, dispatch } = focus
  const available = view.status === 'idle' && !!view.slot
  return (
    <section className="flex flex-col gap-2 rounded-xl border bg-card p-3" aria-label="Focus">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Timer aria-hidden className="size-4" />
        <LocalizedText en="One thing at a time" vi="Tập trung vào một việc" />
      </p>
      <p className="text-xs text-muted-foreground">
        <LocalizedText
          en="A personal timer. It does not change work status or record billable time."
          vi="Bộ đếm cá nhân. Không đổi trạng thái công việc hoặc ghi giờ tính phí."
        />
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">
            <LocalizedText en="Focus duration" vi="Thời gian tập trung" />
          </span>
          <Select
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value) as 15 | 25 | 50)}
            disabled={!available || view.busy}
            options={[15, 25, 50].map((n) => ({ value: String(n), label: `${n} min` }))}
          />
        </label>
        <Button
          size="sm"
          disabled={!available || view.busy}
          onClick={() => {
            void dispatch({ type: 'start', target, minutes })
          }}
        >
          <Timer aria-hidden />
          <LocalizedText en="Start Focus" vi="Bắt đầu tập trung" />
        </Button>
      </div>
      {!available && (
        <p className="text-xs text-muted-foreground">
          <LocalizedText
            en={
              view.status === 'unsupported'
                ? 'Focus coordination is unavailable. Your work is unaffected.'
                : 'Use Focus in the toolbar to manage the current session.'
            }
            vi={
              view.status === 'unsupported'
                ? 'Chưa dùng được đồng bộ tập trung. Công việc không bị ảnh hưởng.'
                : 'Dùng Tập trung trên thanh công cụ để quản lý phiên hiện tại.'
            }
          />
        </p>
      )}
    </section>
  )
}

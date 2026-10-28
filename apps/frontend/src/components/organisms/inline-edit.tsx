'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { useState, useTransition } from 'react'

import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Alert } from '@/components/molecules/alert'
import { callMcAction, type McActionResult } from '@/lib/mc/action-result'

export type InlineEditProps = {
  /** Names the field and the row for assistive technology, e.g. `title of "Draft SPA"`. */
  label: string
  value: string
  canEdit: boolean
  maxLength?: number
  /** Persists the new value. The caller binds the row id and its revision token. */
  run: (value: string) => Promise<McActionResult>
}

/**
 * One editable field of one row. The draft stays in the box when a save fails; a CAS-only save
 * with an unknown outcome is never resent (only a re-read re-enables editing).
 */
export function InlineEdit({ label, value, canEdit, maxLength = 300, run }: InlineEditProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [result, setResult] = useState<McActionResult | null>(null)
  const [pending, start] = useTransition()
  const failure = result && !result.ok ? result : null
  const blocked = failure?.requiresReread === true

  function save() {
    if (blocked) return
    start(async () => {
      const r = await callMcAction(() => run(draft), { receipted: false })
      setResult(r)
      if (r.ok) {
        setEditing(false)
        router.refresh()
      }
    })
  }

  function reread() {
    start(() => {
      router.refresh()
    })
    setResult(null)
    setEditing(false)
  }

  if (!editing) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        <span className="break-words">{value}</span>
        {canEdit && (
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            aria-label={`Edit ${label}`}
            onClick={() => {
              setDraft(value)
              setResult(null)
              setEditing(true)
            }}
          >
            <Pencil aria-hidden />
          </Button>
        )}
      </span>
    )
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !pending) setEditing(false)
      }}
    >
      <Input
        aria-label={label}
        autoFocus
        maxLength={maxLength}
        value={draft}
        disabled={blocked}
        aria-invalid={failure?.kind === 'validation' ? true : undefined}
        onChange={(e) => setDraft(e.target.value)}
      />
      {failure && (
        <Alert variant="destructive">
          {failure.error}
          {failure.fieldErrors && Object.values(failure.fieldErrors).flat()[0]
            ? ` ${Object.values(failure.fieldErrors).flat()[0]}`
            : ''}
        </Alert>
      )}
      <div className="flex gap-2">
        {blocked ? (
          <Button type="button" size="sm" variant="outline" loading={pending} onClick={reread}>
            <LocalizedText en="Reload current state" vi="Đọc lại trạng thái hiện tại" />
          </Button>
        ) : (
          <Button type="submit" size="sm" loading={pending}>
            <LocalizedText en="Save" vi="Lưu" />
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => setEditing(false)}
        >
          <LocalizedText en="Cancel" vi="Hủy" />
        </Button>
      </div>
    </form>
  )
}

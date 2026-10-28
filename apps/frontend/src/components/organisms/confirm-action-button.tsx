'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { Button, type ButtonProps } from '@/components/atoms/button'
import { Alert } from '@/components/molecules/alert'
import { callMcAction, type McActionResult } from '@/lib/mc/action-result'

export type ConfirmActionButtonProps = {
  label: string
  confirmLabel: string
  /** What the action will do, shown while confirming. */
  warning: string
  run: () => Promise<McActionResult>
  variant?: ButtonProps['variant']
}

/** Two-step destructive action: the first click only asks; nothing is sent until it is confirmed. */
export function ConfirmActionButton({
  label,
  confirmLabel,
  warning,
  run,
  variant = 'destructive',
}: ConfirmActionButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState<McActionResult | null>(null)
  const [pending, start] = useTransition()

  // Every ConfirmActionButton command is CAS-only (no receipt): an unknown outcome blocks
  // resending until the state has been re-read.
  const blocked = result !== null && !result.ok && result.requiresReread === true

  function confirm() {
    if (blocked) return
    start(async () => {
      const r = await callMcAction(run, { receipted: false })
      setResult(r)
      if (r.ok) {
        setConfirming(false)
        router.refresh()
      }
    })
  }

  function reread() {
    start(() => {
      router.refresh()
    })
    setResult(null)
    setConfirming(false)
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {blocked ? (
        <Button size="sm" variant="outline" loading={pending} onClick={reread}>
          <LocalizedText en="Reload current state" vi="Đọc lại trạng thái hiện tại" />
        </Button>
      ) : !confirming ? (
        <Button size="sm" variant="outline" onClick={() => setConfirming(true)}>
          {label}
        </Button>
      ) : (
        <div role="group" aria-label={warning} className="flex flex-col gap-2">
          <p className="text-sm">{warning}</p>
          <div className="flex gap-2">
            <Button size="sm" variant={variant} loading={pending} onClick={confirm}>
              {confirmLabel}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              <LocalizedText en="Cancel" vi="Hủy" />
            </Button>
          </div>
        </div>
      )}
      {result && !result.ok && (
        <Alert
          variant="destructive"
          title={
            result.kind === 'stale'
              ? 'Out of date'
              : result.kind === 'outcome-unknown'
                ? 'Outcome not confirmed'
                : 'Could not complete'
          }
        >
          {result.error}
        </Alert>
      )}
    </div>
  )
}

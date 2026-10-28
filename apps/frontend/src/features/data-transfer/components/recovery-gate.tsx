'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import { useEffect, useRef, useState, type ReactNode } from 'react'

import { Button } from '@/components/atoms/button'
import { Alert } from '@/components/molecules/alert'

import { acknowledgeTransferAction, recoverTransfersAction, type RecoveryOutcome } from '../actions'
import { reconcileOutcomes } from '../intent'

import { OutcomeList } from './outcome-list'

export function RecoveryGate({ matterId, children }: { matterId: string; children: ReactNode }) {
  const [state, setState] = useState<RecoveryOutcome | null>(null)
  const [pending, setPending] = useState(true)
  const busy = useRef(false)
  useEffect(() => {
    let active = true
    recoverTransfersAction(matterId)
      .then((result) => {
        if (active) {
          setState(result)
          setPending(false)
        }
      })
      .catch(() => {
        if (active) {
          setState({
            ok: false,
            kind: 'unavailable',
            error: 'Recovery could not be checked. No new attempt is enabled.',
          })
          setPending(false)
        }
      })
    return () => {
      active = false
    }
  }, [matterId])
  const retained = state?.ok ? state.attempts : undefined
  const recoveredAll =
    !!retained?.length &&
    retained.every((attempt) => {
      const receipt = state?.ok && state.recoveries?.find((result) => result.kind === attempt.kind)
      return (
        !!receipt &&
        !attempt.blocked &&
        !reconcileOutcomes(receipt.rows, attempt.rows).some((row) => row.status === 'UNKNOWN')
      )
    })
  const retry = async () => {
    if (busy.current) return
    busy.current = true
    setPending(true)
    try {
      const result = await recoverTransfersAction(matterId, !!retained?.length)
      if (result.ok && result.recoveries?.length) {
        for (const recovered of result.recoveries) {
          const submitted = retained?.find((attempt) => attempt.kind === recovered.kind)?.rows ?? []
          if (
            submitted.length &&
            !reconcileOutcomes(recovered.rows, submitted).some((row) => row.status === 'UNKNOWN')
          ) {
            await acknowledgeTransferAction(matterId, recovered.kind, recovered.key)
          }
        }
        const checked = await recoverTransfersAction(matterId)
        setState(checked.ok ? { ...checked, recoveries: result.recoveries } : checked)
      } else setState(result)
    } catch {
      setState({
        ok: false,
        kind: 'outcome-unknown',
        error: 'The recovery answer was lost. Check again; no new keys were created.',
      })
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return (
    <>
      {pending && (
        <p role="status">
          <LocalizedText
            en="Checking retained attempts…"
            vi="Đang kiểm tra các lần gửi được giữ lại…"
          />
        </p>
      )}
      {state && !state.ok && (
        <Alert
          variant="destructive"
          title={<LocalizedText en="Recovery unavailable" vi="Chưa thể khôi phục kết quả" />}
        >
          {state.error}
        </Alert>
      )}
      {!!retained?.length && (
        <Alert
          variant="info"
          title={
            recoveredAll ? (
              <LocalizedText en="Recovered results are ready" vi="Đã khôi phục kết quả" />
            ) : (
              <LocalizedText
                en="An earlier attempt is unresolved"
                vi="Lần gửi trước chưa rõ kết quả"
              />
            )
          }
        >
          Its original request and keys are retained in this server session. A reload does not prove
          failure.
          {retained.some((attempt) => attempt.blocked) && (
            <p>
              Access was lost. The payload was purged; ask an owner to reconcile the history. It
              cannot be retried here.
            </p>
          )}
        </Alert>
      )}
      {state?.ok &&
        state.recoveries?.map((result) => (
          <OutcomeList
            key={result.kind}
            results={reconcileOutcomes(
              result.rows,
              retained?.find((a) => a.kind === result.kind)?.rows ??
                result.rows.map((r) => r.rowKey),
            )}
            submitted={result.rows.length}
          />
        ))}
      {!pending && state?.ok && retained?.length === 0 ? (
        children
      ) : (
        <Button
          variant="secondary"
          disabled={pending || retained?.some((attempt) => attempt.blocked)}
          onClick={() => void retry()}
        >
          {recoveredAll ? (
            <LocalizedText en="Confirm recovered results" vi="Xác nhận kết quả đã khôi phục" />
          ) : retained?.length ? (
            <LocalizedText en="Recover the original attempt" vi="Khôi phục lần gửi ban đầu" />
          ) : (
            <LocalizedText en="Check retained attempts" vi="Kiểm tra các lần gửi được giữ lại" />
          )}
        </Button>
      )}
    </>
  )
}

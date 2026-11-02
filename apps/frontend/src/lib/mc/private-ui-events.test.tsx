import { act, render } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import {
  PrivateUiProvider,
  usePrivateScope,
  onPrivateUi,
  notifyPrivateUi,
  preparePrivateLogout,
  type PrivateScope,
} from './private-ui-events'

it('awaits acknowledged cleanup but bounds a blocked store before navigation', async () => {
  vi.useFakeTimers()
  const scope = { epoch: 'old', runtime: 'view-one' }
  let commit: () => void = () => {}
  const off = onPrivateUi(
    () =>
      new Promise<void>((resolve) => {
        commit = resolve
      }),
  )
  let done = false
  const pending = preparePrivateLogout(scope).then(() => {
    done = true
  })
  await vi.advanceTimersByTimeAsync(900)
  expect(done).toBe(false)
  commit()
  await pending
  expect(done).toBe(true)
  off()
  const offBlocked = onPrivateUi(() => new Promise(() => {}))
  done = false
  const blocked = preparePrivateLogout(scope).then(() => {
    done = true
  })
  await vi.advanceTimersByTimeAsync(1000)
  await blocked
  expect(done).toBe(true)
  offBlocked()
  vi.useRealTimers()
})
it('projects only the current epoch/runtime to privacy consumers', async () => {
  let actual: PrivateScope | null = null
  function Probe() {
    actual = usePrivateScope()
    return null
  }
  render(
    <PrivateUiProvider
      identity={{
        principalKey: 'a'.repeat(64),
        epoch: 'b'.repeat(24),
        validUntil: '2099-01-01T00:00:00.000Z',
      }}
    >
      <Probe />
    </PrivateUiProvider>,
  )
  const seen: string[] = []
  const off = onPrivateUi((event) => {
    if (actual && event.scope.epoch === actual.epoch && event.scope.runtime === actual.runtime)
      seen.push(event.type)
  })
  await act(async () => {
    await notifyPrivateUi({ type: 'session-ended', scope: { epoch: 'old', runtime: 'old' } })
  })
  expect(seen).toEqual([])
  await act(async () => {
    await notifyPrivateUi({ type: 'access-recheck', scope: actual! })
  })
  expect(seen).toEqual(['access-recheck'])
  off()
})

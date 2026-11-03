import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { McActionResult } from '@/lib/mc/action-result'

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))

import { DraftScopeProvider } from './draft-scope'
import { IntentForm, type IntentFormProps } from './intent-form'
import { ReadFailure } from './read-failure'

type Run = IntentFormProps['run']

function Form({
  ns = 'sess-a',
  scope = 'matter:1:new-action',
  receipted = true,
  run,
}: {
  ns?: string
  scope?: string
  receipted?: boolean
  run: Run
}) {
  return (
    <DraftScopeProvider namespace={ns}>
      <IntentForm submitLabel="Save" receipted={receipted} draftKey={scope} run={run}>
        {() => <input name="title" aria-label="Title" />}
      </IntentForm>
    </DraftScopeProvider>
  )
}

const unknown: McActionResult = {
  ok: false,
  kind: 'outcome-unknown',
  error: 'not confirmed',
  retrySameKey: true,
}
const unknownCas: McActionResult = {
  ok: false,
  kind: 'outcome-unknown',
  error: 'not confirmed',
  requiresReread: true,
}
const saved: McActionResult = { ok: true }

beforeEach(() => {
  window.sessionStorage.clear()
  router.refresh.mockClear()
})

const retryButton = () => screen.queryByRole('button', { name: /Retry the same request/ })

async function submitTitle(value: string) {
  fireEvent.input(screen.getByLabelText('Title'), { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: /Save|Retry the same request/ }))
}

/** First attempt of a receipted create whose answer is lost; returns the run mock. */
async function lostAnswer(run: ReturnType<typeof vi.fn<Run>>) {
  const first = render(<Form run={run} />)
  await submitTitle('First')
  await waitFor(() => expect(retryButton()).not.toBeNull())
  return first
}

describe('a receipted create whose answer was lost survives a reload', () => {
  it('retries with the original key and the original values, not the edited field', async () => {
    const run = vi.fn<Run>().mockResolvedValueOnce(unknown).mockResolvedValue(saved)
    const first = await lostAnswer(run)
    fireEvent.input(screen.getByLabelText('Title'), { target: { value: 'Edited later' } })
    first.unmount() // the page is reloaded: component state is gone, sessionStorage is not

    render(<Form run={run} />)
    expect(retryButton()).not.toBeNull() // still in the "not confirmed" state, not a fresh form
    fireEvent.click(retryButton()!)
    await waitFor(() => expect(run).toHaveBeenCalledTimes(2))
    expect(run.mock.calls[1]![1]).toBe(run.mock.calls[0]![1]) // same Idempotency-Key
    expect(run.mock.calls[1]![0]).toEqual({ title: 'First' }) // the request that may have landed
  })

  it('a successful retry clears it: the next intent is a normal form with a new key', async () => {
    const run = vi.fn<Run>().mockResolvedValueOnce(unknown).mockResolvedValue(saved)
    const first = await lostAnswer(run)
    first.unmount()
    const second = render(<Form run={run} />)
    fireEvent.click(retryButton()!)
    await waitFor(() => expect(run).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(router.refresh).toHaveBeenCalled())
    second.unmount()

    render(<Form run={run} />)
    expect(retryButton()).toBeNull()
    await submitTitle('Next')
    await waitFor(() => expect(run).toHaveBeenCalledTimes(3))
    expect(run.mock.calls[2]![1]).not.toBe(run.mock.calls[0]![1])
  })

  it('discarding clears it and starts the next intent under a new key', async () => {
    const run = vi.fn<Run>().mockResolvedValueOnce(unknown).mockResolvedValue(saved)
    const first = await lostAnswer(run)
    first.unmount()
    const second = render(<Form run={run} />)
    fireEvent.click(screen.getByRole('button', { name: /Discard and start a different request/ }))
    second.unmount()

    render(<Form run={run} />)
    expect(retryButton()).toBeNull()
    await submitTitle('Different')
    await waitFor(() => expect(run).toHaveBeenCalledTimes(2))
    expect(run.mock.calls[1]![1]).not.toBe(run.mock.calls[0]![1])
  })

  it('a definitive refusal on the retry clears it', async () => {
    const refused: McActionResult = { ok: false, kind: 'validation', error: 'no' }
    const run = vi.fn<Run>().mockResolvedValueOnce(unknown).mockResolvedValue(refused)
    const first = await lostAnswer(run)
    first.unmount()
    const second = render(<Form run={run} />)
    fireEvent.click(retryButton()!)
    await waitFor(() => expect(run).toHaveBeenCalledTimes(2))
    second.unmount()

    render(<Form run={run} />)
    expect(retryButton()).toBeNull()
  })
})

describe('what is not kept', () => {
  it('a CAS-only command is never resent, so nothing is stored for it', async () => {
    const run = vi.fn<Run>().mockResolvedValue(unknownCas)
    const first = render(<Form receipted={false} run={run} />)
    await submitTitle('Grant')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Reload current state/ })).toBeInTheDocument(),
    )
    first.unmount()

    render(<Form receipted={false} run={run} />)
    expect(screen.queryByRole('button', { name: /Reload current state/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('another session or another form never sees it', async () => {
    const run = vi.fn<Run>().mockResolvedValue(unknown)
    const first = await lostAnswer(run)
    first.unmount()

    const otherSession = render(<Form ns="sess-b" run={run} />)
    expect(retryButton()).toBeNull()
    otherSession.unmount()
    render(<Form scope="matter:1:new-party" run={run} />)
    expect(retryButton()).toBeNull()
  })

  it('a denied screen purges it, so a re-grant cannot revive the attempt', async () => {
    const run = vi.fn<Run>().mockResolvedValue(unknown)
    const first = await lostAnswer(run)
    first.unmount()
    render(<ReadFailure kind="forbidden" />).unmount()

    render(<Form run={run} />)
    expect(retryButton()).toBeNull()
    expect(window.sessionStorage.length).toBe(0)
  })

  it('a denial of the form itself clears it', async () => {
    const forbidden: McActionResult = { ok: false, kind: 'forbidden', error: 'denied' }
    const run = vi.fn<Run>().mockResolvedValueOnce(unknown).mockResolvedValue(forbidden)
    const first = await lostAnswer(run)
    first.unmount()
    const second = render(<Form run={run} />)
    fireEvent.click(retryButton()!)
    await waitFor(() => expect(run).toHaveBeenCalledTimes(2))
    second.unmount()
    render(<Form run={run} />)
    expect(retryButton()).toBeNull()
    expect(window.sessionStorage.length).toBe(0)
  })
})

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MESSAGES, type McActionResult } from '@/lib/mc/action-result'
import { UUID_V7 } from '@/lib/mc/idempotency'

const router = vi.hoisted(() => ({
  refresh: vi.fn<IntentFormProps['run']>(),
  push: vi.fn<IntentFormProps['run']>(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => router }))

import { ConfirmActionButton } from './confirm-action-button'
import { IntentForm, type IntentFormProps } from './intent-form'

const RECEIPTED_UNKNOWN: McActionResult = {
  ok: false,
  kind: 'outcome-unknown',
  error: 'unknown (receipted)',
  retrySameKey: true,
}
const CAS_UNKNOWN: McActionResult = {
  ok: false,
  kind: 'outcome-unknown',
  error: MESSAGES['outcome-unknown-reread'],
  requiresReread: true,
}

beforeEach(() => router.refresh.mockClear())

/** Click a button once it is usable: a pending transition keeps it disabled for a tick. */
async function clickWhenReady(name: string | RegExp) {
  const button = await screen.findByRole('button', { name })
  await waitFor(() => expect(button).toBeEnabled())
  fireEvent.click(button)
}

function renderForm(run: IntentFormProps['run'], receipted: boolean) {
  return render(
    <IntentForm submitLabel="Save" receipted={receipted} run={run}>
      {() => <input name="title" aria-label="Title" defaultValue="first" />}
    </IntentForm>,
  )
}

describe('IntentForm: receipted creation', () => {
  it('retries with the SAME key and the ORIGINAL payload, even if the field was edited meanwhile', async () => {
    const run = vi
      .fn<IntentFormProps['run']>()
      .mockResolvedValueOnce(RECEIPTED_UNKNOWN)
      .mockResolvedValueOnce({ ok: true })
    renderForm(run, true)

    await clickWhenReady('Save')
    await screen.findByRole('button', { name: /Retry the same request/ })
    const [firstValues, firstKey] = run.mock.calls[0] as [Record<string, string>, string]
    expect(firstKey).toMatch(UUID_V7)

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'edited after the failure' },
    })
    await clickWhenReady(/Retry the same request/)
    await waitFor(() => expect(run).toHaveBeenCalledTimes(2))
    const [secondValues, secondKey] = run.mock.calls[1] as [Record<string, string>, string]
    expect(secondKey).toBe(firstKey)
    expect(secondValues).toEqual(firstValues) // not the edited field
    expect(secondValues.title).toBe('first')
  })

  it('a NEW key is minted only after success or an explicit discard', async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce(RECEIPTED_UNKNOWN)
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true })
    renderForm(run, true)
    await clickWhenReady('Save')
    await screen.findByRole('button', { name: /Retry the same request/ })
    await clickWhenReady(/Retry the same request/)
    await waitFor(() => expect(run).toHaveBeenCalledTimes(2))
    await screen.findByText('Saved.')
    await clickWhenReady('Save')
    await waitFor(() => expect(run).toHaveBeenCalledTimes(3))
    const keys = run.mock.calls.map((c) => c[1])
    expect(keys[0]).toBe(keys[1])
    expect(keys[2]).not.toBe(keys[1])
  })

  it('discarding an unconfirmed request starts a different intent with a new key', async () => {
    const run = vi
      .fn<IntentFormProps['run']>()
      .mockResolvedValueOnce(RECEIPTED_UNKNOWN)
      .mockResolvedValueOnce({ ok: true })
    renderForm(run, true)
    await clickWhenReady('Save')
    await clickWhenReady(/Discard/)
    await clickWhenReady('Save')
    await waitFor(() => expect(run).toHaveBeenCalledTimes(2))
    expect(run.mock.calls[1]![1]).not.toBe(run.mock.calls[0]![1])
  })
})

describe('IntentForm: CAS-only command (CW1-F01)', () => {
  it('after UNKNOWN there is no resend affordance and a forced submit still sends nothing', async () => {
    const run = vi.fn<IntentFormProps['run']>().mockResolvedValue(CAS_UNKNOWN)
    const { container } = renderForm(run, false)
    await clickWhenReady('Save')
    await screen.findByRole('button', { name: 'Reload current state' })

    expect(screen.queryByRole('button', { name: /Retry|Save/ })).toBeNull()
    expect(screen.queryByText(/safe to send again/)).toBeNull()
    expect(screen.getByRole('alert')).toHaveTextContent(/must not be sent again/)

    // Even a programmatic submit (Enter key, assistive tech) must not produce a second mutation.
    fireEvent.submit(container.querySelector('form')!)
    fireEvent.submit(container.querySelector('form')!)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('only an actual re-read re-enables a NEW intent, and it then needs an explicit user action', async () => {
    const run = vi
      .fn<IntentFormProps['run']>()
      .mockResolvedValueOnce(CAS_UNKNOWN)
      .mockResolvedValueOnce({ ok: true })
    renderForm(run, false)
    await clickWhenReady('Save')
    await clickWhenReady('Reload current state')
    await waitFor(() => expect(router.refresh).toHaveBeenCalledTimes(1))
    const save = await screen.findByRole('button', { name: 'Save' })
    expect(run).toHaveBeenCalledTimes(1) // the re-read did not resubmit anything
    fireEvent.click(save)
    await waitFor(() => expect(run).toHaveBeenCalledTimes(2))
  })

  it('a rejected server-action call (network drop) is treated the same way', async () => {
    const run = vi.fn<IntentFormProps['run']>().mockRejectedValue(new TypeError('Failed to fetch'))
    renderForm(run, false)
    await clickWhenReady('Save')
    await screen.findByRole('button', { name: 'Reload current state' })
    expect(screen.queryByText(/safe to send again/)).toBeNull()
  })

  it('the same dropped call for a receipted command offers the same-key retry', async () => {
    const run = vi.fn<IntentFormProps['run']>().mockRejectedValue(new TypeError('Failed to fetch'))
    renderForm(run, true)
    await clickWhenReady('Save')
    await screen.findByRole('button', { name: /Retry the same request/ })
  })
})

describe('ConfirmActionButton (revocation): CAS-only', () => {
  it('after UNKNOWN the confirm control is gone and nothing else can resend', async () => {
    const run = vi.fn<() => Promise<McActionResult>>().mockResolvedValue(CAS_UNKNOWN)
    render(
      <ConfirmActionButton label="Remove" confirmLabel="Remove now" warning="Sure?" run={run} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove now' }))
    await screen.findByRole('button', { name: 'Reload current state' })
    expect(screen.queryByRole('button', { name: /Remove/ })).toBeNull()
    expect(run).toHaveBeenCalledTimes(1)
    await clickWhenReady('Reload current state')
    await waitFor(() => expect(router.refresh).toHaveBeenCalled())
    expect(run).toHaveBeenCalledTimes(1)
    // after the re-read the user must start over: Remove -> confirm
    expect(await screen.findByRole('button', { name: 'Remove' })).toBeInTheDocument()
  })
})

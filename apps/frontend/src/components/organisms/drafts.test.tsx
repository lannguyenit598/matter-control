import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { McActionResult } from '@/lib/mc/action-result'
import { clearAllDrafts, draftKeyFor, loadDraft } from '@/lib/mc/drafts'

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))

import { DraftScopeProvider } from './draft-scope'
import { IntentForm, type IntentFormProps } from './intent-form'
import { ReadFailure } from './read-failure'

function Form({
  ns,
  scope = 'matter:1:new-action',
  run,
}: {
  ns: string | null
  scope?: string
  run: IntentFormProps['run']
}) {
  return (
    <DraftScopeProvider namespace={ns}>
      <IntentForm submitLabel="Save" receipted draftKey={scope} run={run}>
        {() => (
          <>
            <input name="title" aria-label="Title" />
            <textarea name="outcome" aria-label="Outcome" />
            <input type="checkbox" name="req" value="r1" aria-label="R1" />
            <input type="checkbox" name="req" value="r2" aria-label="R2" />
          </>
        )}
      </IntentForm>
    </DraftScopeProvider>
  )
}

const ok = () => vi.fn<IntentFormProps['run']>().mockResolvedValue({ ok: true })
const fail = (kind: 'forbidden' | 'not-found' | 'unauthenticated'): McActionResult => ({
  ok: false,
  kind,
  error: kind,
})

beforeEach(() => {
  window.sessionStorage.clear()
  router.refresh.mockClear()
})

async function waitForSave() {
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled())
}

describe('form drafts', () => {
  it('keeps what was typed across a remount (navigation) for the same session and scope', () => {
    const first = render(<Form ns="sess-a" run={ok()} />)
    fireEvent.input(screen.getByLabelText('Title'), { target: { value: 'Long legal title' } })
    fireEvent.input(screen.getByLabelText('Outcome'), { target: { value: 'Line one\nLine two' } })
    fireEvent.click(screen.getByLabelText('R2'))
    first.unmount()

    render(<Form ns="sess-a" run={ok()} />)
    expect(screen.getByLabelText('Title')).toHaveValue('Long legal title')
    expect(screen.getByLabelText('Outcome')).toHaveValue('Line one\nLine two')
    expect(screen.getByLabelText('R2')).toBeChecked()
    expect(screen.getByLabelText('R1')).not.toBeChecked()
  })

  it('never shows a draft to another session, another scope, or when signed out', () => {
    const a = render(<Form ns="sess-a" run={ok()} />)
    fireEvent.input(screen.getByLabelText('Title'), { target: { value: 'secret draft' } })
    a.unmount()

    for (const props of [
      { ns: 'sess-b' },
      { ns: 'sess-a', scope: 'matter:2:new-action' },
      { ns: null },
    ]) {
      const r = render(<Form {...props} run={ok()} />)
      expect(screen.getByLabelText('Title')).toHaveValue('')
      r.unmount()
    }
  })

  it('stores nothing when there is no namespace (signed out)', () => {
    render(<Form ns={null} run={ok()} />)
    fireEvent.input(screen.getByLabelText('Title'), { target: { value: 'x' } })
    expect(window.sessionStorage.length).toBe(0)
  })

  it('clears the draft after a successful save so it cannot come back', async () => {
    const run = ok()
    const first = render(<Form ns="sess-a" run={run} />)
    fireEvent.input(screen.getByLabelText('Title'), { target: { value: 'to be saved' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Saved.')
    expect(loadDraft('sess-a', 'matter:1:new-action')).toBeNull()
    first.unmount()
    render(<Form ns="sess-a" run={ok()} />)
    expect(screen.getByLabelText('Title')).toHaveValue('')
  })

  it.each(['forbidden', 'not-found', 'unauthenticated'] as const)(
    'drops the draft when the result says the right to see it ended (%s)',
    async (kind) => {
      const run = vi.fn<IntentFormProps['run']>().mockResolvedValue(fail(kind))
      render(<Form ns="sess-a" run={run} />)
      fireEvent.input(screen.getByLabelText('Title'), {
        target: { value: 'typed before revocation' },
      })
      expect(loadDraft('sess-a', 'matter:1:new-action')).not.toBeNull()
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))
      await screen.findByRole('alert')
      expect(loadDraft('sess-a', 'matter:1:new-action')).toBeNull()
    },
  )

  it('keeps the draft through an ordinary failure so the user can fix and retry', async () => {
    const run = vi.fn<IntentFormProps['run']>().mockResolvedValue({
      ok: false,
      kind: 'validation',
      error: 'fix it',
      fieldErrors: { title: ['required'] },
    })
    render(<Form ns="sess-a" run={run} />)
    fireEvent.input(screen.getByLabelText('Title'), { target: { value: 'keep me' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByRole('alert')
    await waitForSave()
    expect(loadDraft('sess-a', 'matter:1:new-action')).toEqual(
      expect.objectContaining({ title: 'keep me' }),
    )
  })

  it('discarding an unconfirmed request drops the draft with it', async () => {
    const run = vi.fn<IntentFormProps['run']>().mockResolvedValue({
      ok: false,
      kind: 'outcome-unknown',
      error: 'unknown',
      retrySameKey: true,
    })
    render(<Form ns="sess-a" run={run} />)
    fireEvent.input(screen.getByLabelText('Title'), { target: { value: 'unconfirmed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    const discard = await screen.findByRole('button', { name: /Discard/ })
    await waitFor(() => expect(discard).toBeEnabled())
    fireEvent.click(discard)
    await waitFor(() => expect(loadDraft('sess-a', 'matter:1:new-action')).toBeNull())
  })

  it('logout wipes every draft of every namespace', () => {
    for (const ns of ['sess-a', 'sess-b']) {
      const r = render(<Form ns={ns} run={ok()} />)
      fireEvent.input(screen.getByLabelText('Title'), { target: { value: ns } })
      r.unmount()
    }
    expect(window.sessionStorage.length).toBe(2)
    window.sessionStorage.setItem('unrelated', 'keep')
    clearAllDrafts()
    expect(window.sessionStorage.length).toBe(1)
    expect(window.sessionStorage.getItem('unrelated')).toBe('keep')
  })

  it('still works when storage is blocked', () => {
    const spy = vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new Error('blocked')
    })
    try {
      render(<Form ns="sess-a" run={ok()} />)
      fireEvent.input(screen.getByLabelText('Title'), { target: { value: 'x' } })
      expect(screen.getByLabelText('Title')).toHaveValue('x')
    } finally {
      spy.mockRestore()
    }
  })

  it('namespaces keys so scopes cannot collide', () => {
    expect(draftKeyFor('a', 'x')).not.toBe(draftKeyFor('a', 'y'))
    expect(draftKeyFor('a', 'x')).not.toBe(draftKeyFor('b', 'x'))
  })

  describe('access loss shown by a read failure', () => {
    // Drafts of OTHER forms (here a different record kind) must not outlive the denial: a later
    // re-grant must not revive what was typed under the lost right (R8-N01).
    const seed = () => {
      window.sessionStorage.setItem(draftKeyFor('sess-a', 'item:9:meta'), '{"title":"secret"}')
      window.sessionStorage.setItem('unrelated', 'keep')
    }

    it.each(['forbidden', 'not-found', 'sign-in'] as const)(
      'purges kept drafts when the screen is %s',
      (kind) => {
        seed()
        render(<ReadFailure kind={kind} />)
        expect(loadDraft('sess-a', 'item:9:meta')).toBeNull()
        expect(window.sessionStorage.getItem('unrelated')).toBe('keep')
      },
    )

    it.each(['unavailable', 'error'] as const)('keeps drafts when the screen is %s', (kind) => {
      seed()
      render(<ReadFailure kind={kind} />)
      expect(loadDraft('sess-a', 'item:9:meta')).toEqual({ title: 'secret' })
    })

    it('does not revive a purged draft after access returns', () => {
      seed()
      render(<ReadFailure kind="forbidden" />)
      render(<Form ns="sess-a" scope="item:9:meta" run={ok()} />)
      expect(screen.getByLabelText('Title')).toHaveValue('')
    })
  })
})

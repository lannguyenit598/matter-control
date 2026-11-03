import { useEffect } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  PrivateUiProvider,
  usePrivateScope,
  notifyPrivateUi,
  type PrivateScope,
} from '@/lib/mc/private-ui-events'
import { FocusProvider, useFocus } from './provider'
import { emptySlot, transition, type FocusSlot } from './model'
import { McError } from '@/lib/mc/errors'
import { compareFocus } from './coordinator'

const mock = vi.hoisted(() => ({ readFocus: vi.fn(), open: vi.fn() }))
vi.mock('next/navigation', () => ({ usePathname: () => '/my-actions' }))
vi.mock('./transport', () => ({ readFocus: mock.readFocus }))
vi.mock('./coordinator', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./coordinator')>()),
  openCoordinator: mock.open,
}))
const identity = {
  principalKey: 'a'.repeat(64),
  epoch: 'b'.repeat(24),
  validUntil: '2099-01-01T00:00:00.000Z',
}
const target = { matterId: 'matter', actionId: 'action' }
const eligible = {
  kind: 'eligible',
  identity,
  checkedAt: '2026-11-01T00:00:00Z',
  asOf: '2026-11-01T00:00:00Z',
  target: { ...target, title: 'Private Action', matterName: 'Atlas', reason: 'ready' },
}
let scope: PrivateScope | null
let stored: FocusSlot
let reset: ReturnType<typeof vi.fn>
beforeEach(() => {
  vi.clearAllMocks()
  stored = emptySlot('initial')
  scope = null
  reset = vi.fn(async (expected: FocusSlot) => {
    if (stored.revision !== expected.revision) return 'stale' as const
    stored = { schema: 1, generation: 'ended', revision: stored.revision + 1, active: null }
    return stored
  })
  mock.readFocus.mockResolvedValue(eligible)
  mock.open.mockResolvedValue({
    read: async () => stored,
    commit: async (
      expected: FocusSlot,
      command: Parameters<typeof compareFocus>[2],
      id: typeof identity,
      ready: boolean,
    ) => {
      const result = compareFocus(stored, expected, command, id, Date.now(), 'nonce', ready)
      if (result && typeof result !== 'string') stored = result
      return result
    },
    reset,
    invalidate: vi.fn(),
    close: vi.fn(),
  })
})
function Probe() {
  const focus = useFocus()!
  const currentScope = usePrivateScope()
  useEffect(() => {
    scope = currentScope
  }, [currentScope])
  return (
    <>
      <p>{focus.view.status}</p>
      <p>{focus.view.target?.title}</p>
      <p>{focus.view.slot?.active?.state}</p>
      <button
        onClick={() => {
          void focus.dispatch({ type: 'start', target, minutes: 25 })
        }}
      >
        Start
      </button>
      <button
        onClick={() => {
          void focus.dispatch({ type: 'pause' })
        }}
      >
        Pause
      </button>
      <button
        onClick={() => {
          void focus.dispatch({ type: 'resume' })
        }}
      >
        Resume
      </button>
    </>
  )
}
const mount = () =>
  render(
    <PrivateUiProvider identity={identity}>
      <FocusProvider identity={identity}>
        <Probe />
      </FocusProvider>
    </PrivateUiProvider>,
  )

afterEach(() => vi.restoreAllMocks())

it('immediately fences a paused session when Resume observes lost access', async () => {
  mount()
  await screen.findByText('idle')
  fireEvent.click(screen.getByText('Start'))
  await screen.findByText('Private Action')
  fireEvent.click(screen.getByText('Pause'))
  await screen.findByText('PAUSED')
  mock.readFocus.mockResolvedValueOnce({ ...eligible, kind: 'access-lost' })
  fireEvent.click(screen.getByText('Resume'))
  await waitFor(() => expect(stored.active).toBeNull())
  expect(screen.queryByText('Private Action')).not.toBeInTheDocument()
})

it('persists suspension when Resume is refused as ineligible', async () => {
  mount()
  await screen.findByText('idle')
  fireEvent.click(screen.getByText('Start'))
  await screen.findByText('Private Action')
  fireEvent.click(screen.getByText('Pause'))
  await screen.findByText('PAUSED')
  mock.readFocus.mockResolvedValueOnce({ ...eligible, kind: 'ineligible', reason: 'BLOCKED' })
  fireEvent.click(screen.getByText('Resume'))
  await waitFor(() => expect(stored.active?.state).toBe('SUSPENDED'))
  expect(screen.queryByText('Private Action')).not.toBeInTheDocument()
})

it('propagates observed session loss from Resume and purges the shared reference', async () => {
  mount()
  await screen.findByText('idle')
  fireEvent.click(screen.getByText('Start'))
  await screen.findByText('Private Action')
  fireEvent.click(screen.getByText('Pause'))
  await screen.findByText('PAUSED')
  mock.readFocus.mockRejectedValueOnce(new McError('unauthenticated', 401))
  fireEvent.click(screen.getByText('Resume'))
  await waitFor(() => expect(stored.active).toBeNull())
  const connection = await mock.open.mock.results[0]!.value
  expect(connection.invalidate).toHaveBeenCalledWith(identity.epoch)
  await act(async () => mock.open.mock.calls[0]![0]())
  await screen.findByText('unsupported')
  expect(screen.queryByText('Private Action')).not.toBeInTheDocument()
  fireEvent.click(screen.getByText('Start'))
  expect(stored.active).toBeNull()
})

it('suspends a restored record whose write time is ahead of the current wall clock', async () => {
  const now = 1_800_000_000_000
  stored = transition(
    emptySlot('saved'),
    { type: 'start', target, minutes: 25 },
    identity,
    now + 3_600_000,
    'saved-session',
    true,
  )!
  vi.spyOn(Date, 'now').mockReturnValue(now)
  mount()
  await waitFor(() => expect(stored.active?.state).toBe('SUSPENDED'))
  expect(stored.active?.remainingMs).toBe(25 * 60_000)
  expect(screen.queryByText('Private Action')).not.toBeInTheDocument()
})

it('shows freshly authorized labels, pauses, and never resumes merely on revalidation', async () => {
  mount()
  await screen.findByText('idle')
  fireEvent.click(screen.getByText('Start'))
  await screen.findByText('Private Action')
  expect(stored.active?.state).toBe('RUNNING')
  fireEvent.click(screen.getByText('Pause'))
  await screen.findByText('PAUSED')
  fireEvent(window, new Event('focus'))
  await screen.findByText('Private Action')
  expect(stored.active?.state).toBe('PAUSED')
})
it('purges and fences before logout; a pending Start cannot recreate an inactive slot', async () => {
  mount()
  await screen.findByText('idle')
  let finish: (value: typeof eligible) => void = () => {}
  mock.readFocus.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve
    }),
  )
  fireEvent.click(screen.getByText('Start'))
  await act(async () => {
    await notifyPrivateUi({ type: 'session-ended', scope: scope! })
  })
  expect(reset).toHaveBeenCalled()
  await act(async () => finish(eligible))
  await waitFor(() => expect(stored.active).toBeNull())
  expect(screen.queryByText('Private Action')).not.toBeInTheDocument()
})

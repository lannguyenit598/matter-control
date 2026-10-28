import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const actions = vi.hoisted(() => ({ recover: vi.fn(), acknowledge: vi.fn() }))
vi.mock('../actions', () => ({
  recoverTransfersAction: actions.recover,
  acknowledgeTransferAction: actions.acknowledge,
}))

import { RecoveryGate } from './recovery-gate'

beforeEach(() => {
  actions.recover.mockReset()
  actions.acknowledge.mockReset()
})

describe('reload recovery gate', () => {
  it('never POSTs on mount; withholds new forms until explicit recovery and acknowledgement', async () => {
    actions.recover.mockResolvedValueOnce({
      ok: true,
      attempts: [{ kind: 'bulk', rows: ['r1'], blocked: false }],
    })
    render(
      <RecoveryGate matterId="m1">
        <p>New command form</p>
      </RecoveryGate>,
    )
    await screen.findByText('An earlier attempt is unresolved')
    expect(screen.queryByText('New command form')).not.toBeInTheDocument()
    expect(actions.recover.mock.calls).toEqual([['m1']])
    actions.recover.mockResolvedValueOnce({
      ok: true,
      attempts: [{ kind: 'bulk', rows: ['r1'], blocked: false }],
      recoveries: [
        { kind: 'bulk', key: 'original-key', rows: [{ rowKey: 'r1', status: 'SUCCESS_REPLAYED' }] },
      ],
    })
    actions.recover.mockResolvedValueOnce({ ok: true, attempts: [] })
    fireEvent.click(screen.getByRole('button', { name: 'Recover the original attempt' }))
    await screen.findByText('New command form')
    expect(actions.recover.mock.calls[1]).toEqual(['m1', true])
    expect(actions.acknowledge).toHaveBeenCalledWith('m1', 'bulk', 'original-key')
  })

  it('shows already recovered receipts as acknowledgement, not another unknown mutation', async () => {
    const terminal = {
      ok: true,
      attempts: [{ kind: 'bulk', rows: ['r1'], blocked: false }],
      recoveries: [
        { kind: 'bulk', key: 'original-key', rows: [{ rowKey: 'r1', status: 'SUCCESS' }] },
      ],
    }
    actions.recover
      .mockResolvedValueOnce(terminal)
      .mockResolvedValueOnce(terminal)
      .mockResolvedValueOnce({ ok: true, attempts: [] })
    render(
      <RecoveryGate matterId="m1">
        <p>New command form</p>
      </RecoveryGate>,
    )
    await screen.findByText('Recovered results are ready')
    expect(actions.acknowledge).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm recovered results' }))
    await screen.findByText('New command form')
    expect(actions.acknowledge).toHaveBeenCalledWith('m1', 'bulk', 'original-key')
  })
  it('fails closed if the recovery read is unavailable or access was lost', async () => {
    actions.recover.mockRejectedValueOnce(new Error('synthetic'))
    const view = render(
      <RecoveryGate matterId="m1">
        <p>New command form</p>
      </RecoveryGate>,
    )
    await screen.findByText('Recovery unavailable')
    expect(screen.queryByText('New command form')).not.toBeInTheDocument()
    view.unmount()
    actions.recover.mockResolvedValueOnce({
      ok: true,
      attempts: [{ kind: 'import', rows: [], blocked: true }],
    })
    render(
      <RecoveryGate matterId="m1">
        <p>New command form</p>
      </RecoveryGate>,
    )
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Recover the original attempt' })).toBeDisabled(),
    )
    expect(screen.queryByText('New command form')).not.toBeInTheDocument()
    expect(actions.acknowledge).not.toHaveBeenCalled()
  })
})

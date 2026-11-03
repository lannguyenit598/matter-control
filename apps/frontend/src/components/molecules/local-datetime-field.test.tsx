import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { readLocalField } from '@/lib/mc/local-time'

import { LocalDateTimeField } from './local-datetime-field'

const config = vi.hoisted(() => ({ zone: 'Asia/Ho_Chi_Minh', locale: 'en' }))
vi.mock('@/hooks/use-time-zone', () => ({ useTimeZone: () => config.zone }))
vi.mock('@/hooks/use-locale', () => ({ useLocale: () => config.locale }))

function toggle(popup: HTMLElement, state: 'open' | 'closed') {
  // jsdom has no top-layer rendering; expose the content when emitting the native lifecycle.
  popup.style.display = state === 'open' ? 'block' : 'none'
  for (const type of ['beforetoggle', 'toggle']) {
    const event = new Event(type)
    Object.defineProperty(event, 'newState', { value: state })
    fireEvent(popup, event)
  }
}

beforeEach(() => {
  config.zone = 'Asia/Ho_Chi_Minh'
  config.locale = 'en'
  vi.stubGlobal('ToggleEvent', Event)
  HTMLElement.prototype.showPopover = vi.fn()
  HTMLElement.prototype.hidePopover = vi.fn()
})
afterEach(() => vi.unstubAllGlobals())

describe('date/time calendar field', () => {
  it('applies a date/time to the original named control and emits the draft input event', async () => {
    const user = userEvent.setup()
    const persist = vi.fn()
    render(
      <form aria-label="Schedule" onInput={persist}>
        <LocalDateTimeField name="due" label="Due" current="2026-10-30T03:00:27Z" />
      </form>,
    )
    const input = screen.getByLabelText('Due') as HTMLInputElement
    const popup = screen.getByRole('dialog', { hidden: true })
    expect(input.value).toBe('2026-10-30T10:00')
    toggle(popup, 'open')
    await user.click(within(popup).getByRole('button', { name: 'Saturday, 31 October 2026' }))
    await user.clear(within(popup).getByLabelText('Time'))
    fireEvent.change(within(popup).getByLabelText('Time'), { target: { value: '14:15' } })
    await user.click(within(popup).getByRole('button', { name: 'Apply' }))
    expect(input.value).toBe('2026-10-31T14:15')
    expect(new FormData(screen.getByRole('form') as HTMLFormElement).get('dueLocal')).toBe(
      '2026-10-31T14:15',
    )
    expect(persist).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Open date and time calendar' })).toHaveFocus()
    expect(readLocalField({ dueLocal: input.value }, 'due', config.zone)).toEqual({
      ok: true,
      iso: '2026-10-31T07:15:00Z',
    })
  })

  it('does not write on navigation or cancel; reads a DOM-restored draft on open', async () => {
    const user = userEvent.setup()
    render(<LocalDateTimeField name="due" label="Due" />)
    const input = screen.getByLabelText('Due') as HTMLInputElement
    input.value = '2024-02-29T12:30'
    const popup = screen.getByRole('dialog', { hidden: true })
    toggle(popup, 'open')
    const selected = within(popup).getByRole('button', { name: 'Thursday, 29 February 2024' })
    await waitFor(() => expect(selected).toHaveFocus())
    await user.keyboard('{PageDown}')
    expect(within(popup).getByRole('button', { name: 'Friday, 29 March 2024' })).toHaveFocus()
    await user.click(within(popup).getByRole('button', { name: 'Close calendar' }))
    expect(input.value).toBe('2024-02-29T12:30')
  })

  it('preserves exact untouched instants and refuses skipped/ambiguous times as before', () => {
    config.zone = 'America/New_York'
    render(<LocalDateTimeField name="at" label="When" current="2026-10-30T03:00:27Z" />)
    const input = screen.getByLabelText('When') as HTMLInputElement
    expect(
      readLocalField({ atLocal: input.value }, 'at', config.zone, '2026-10-30T03:00:27Z'),
    ).toEqual({ ok: true, iso: '2026-10-30T03:00:27Z' })
    fireEvent.change(input, { target: { value: '2026-03-08T02:30' } })
    expect(screen.getByText(/does not exist/)).toBeInTheDocument()
    fireEvent.change(input, { target: { value: '2026-11-01T01:30' } })
    expect(screen.getByRole('combobox')).toBeEnabled()
    expect(readLocalField({ atLocal: input.value }, 'at', config.zone).ok).toBe(false)
  })

  it('keeps focus on a chosen adjacent-month day and a disabled form stays inert', async () => {
    const user = userEvent.setup()
    const view = render(
      <LocalDateTimeField name="due" label="Due" current="2026-10-30T03:00:00Z" />,
    )
    const popup = screen.getByRole('dialog', { hidden: true })
    toggle(popup, 'open')
    await user.click(within(popup).getByRole('button', { name: 'Sunday, 1 November 2026' }))
    expect(within(popup).getByRole('button', { name: 'Sunday, 1 November 2026' })).toHaveFocus()
    expect(within(popup).getByRole('gridcell', { selected: true })).toHaveTextContent('1')
    view.unmount()
    render(
      <fieldset disabled>
        <LocalDateTimeField name="due" label="Due" />
      </fieldset>,
    )
    expect(screen.getByRole('button', { name: 'Open date and time calendar' })).toBeDisabled()
    expect(screen.getByLabelText('Due')).toBeDisabled()
  })

  it('localizes the calendar and clears without submitting a parent form', async () => {
    config.locale = 'vi'
    const user = userEvent.setup()
    const submit = vi.fn((event) => event.preventDefault())
    render(
      <form onSubmit={submit}>
        <LocalDateTimeField name="due" label="Hạn" current="2026-10-30T03:00:00Z" />
      </form>,
    )
    const popup = screen.getByRole('dialog', { hidden: true })
    toggle(popup, 'open')
    expect(within(popup).getByRole('button', { name: 'Tháng sau' })).toBeInTheDocument()
    await user.click(within(popup).getByRole('button', { name: 'Xóa' }))
    expect((screen.getByLabelText('Hạn') as HTMLInputElement).value).toBe('')
    expect(submit).not.toHaveBeenCalled()
  })
})

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SearchPicker, type PickerResult } from './search-picker'

const PEOPLE = [
  { value: 'u1', label: 'Alex Nguyen' },
  { value: 'u2', label: 'Bao Tran' },
]
const ok = (options = PEOPLE): PickerResult => ({ status: 'ok', options })

function mount(search: (q: string) => Promise<PickerResult>, extra: { active?: boolean } = {}) {
  const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())
  const view = render(
    <form onSubmit={onSubmit} aria-label="host">
      <SearchPicker
        name="userId"
        legend="Person"
        searchLabel="Search people"
        debounceMs={0}
        search={search}
        {...extra}
      />
    </form>,
  )
  const form = screen.getByRole('form', { name: 'host' }) as HTMLFormElement
  return { ...view, form, onSubmit, data: () => Object.fromEntries(new FormData(form)) }
}

describe('SearchPicker', () => {
  it('lists first-page results and submits only the chosen id, never typed text', async () => {
    const { data } = mount(async () => ok())
    await screen.findByRole('radio', { name: 'Alex Nguyen' })
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search people' }), {
      target: { value: 'typed but not chosen' },
    })
    expect(data()).toEqual({})
    // Rows are offered again only once the response for the new query has settled.
    fireEvent.click(await screen.findByRole('radio', { name: 'Bao Tran' }))
    expect(data()).toEqual({ userId: 'u2' })
  })

  it('sends the trimmed query to the source', async () => {
    const search = vi.fn(async () => ok())
    mount(search)
    await waitFor(() => expect(search).toHaveBeenCalledWith(''))
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '  Alex & Bao ' } })
    await waitFor(() => expect(search).toHaveBeenLastCalledWith('Alex & Bao'))
  })

  it('treats Enter in the query box as search, not form submission', async () => {
    const { onSubmit } = mount(async () => ok())
    await screen.findByRole('radio', { name: 'Alex Nguyen' })
    const box = screen.getByRole('searchbox')
    expect(fireEvent.keyDown(box, { key: 'Enter' })).toBe(false) // default prevented
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('moves from the query box into the list with ArrowDown', async () => {
    mount(async () => ok())
    await screen.findByRole('radio', { name: 'Alex Nguyen' })
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'ArrowDown' })
    expect(screen.getByRole('radio', { name: 'Alex Nguyen' })).toHaveFocus()
  })

  it('ignores a late response for an older query', async () => {
    const pending = new Map<string, (r: PickerResult) => void>()
    const search = vi.fn(
      (q: string) => new Promise<PickerResult>((resolve) => pending.set(q, resolve)),
    )
    mount(search)
    await waitFor(() => expect(search).toHaveBeenCalledWith(''))
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'bao' } })
    await waitFor(() => expect(search).toHaveBeenCalledWith('bao'))
    await act(async () => pending.get('bao')!(ok([{ value: 'u2', label: 'Bao Tran' }])))
    await act(async () => pending.get('')!(ok())) // the stale first-page answer arrives last
    expect(screen.getByRole('radio', { name: 'Bao Tran' })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'Alex Nguyen' })).toBeNull()
  })

  it('keeps the chosen person pinned while the query changes, until Clear', async () => {
    const search = vi.fn(async (q: string) => (q ? ok([]) : ok()))
    const { data } = mount(search)
    fireEvent.click(await screen.findByRole('radio', { name: 'Alex Nguyen' }))
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz' } })
    await waitFor(() => expect(search).toHaveBeenLastCalledWith('zzz'))
    await screen.findByText('No results match this search.')
    expect(screen.getByRole('radio', { name: 'Alex Nguyen' })).toBeChecked()
    expect(data()).toEqual({ userId: 'u1' })
    fireEvent.click(screen.getByRole('button', { name: /Clear/ }))
    expect(data()).toEqual({})
    expect(screen.getByRole('searchbox')).toHaveFocus()
  })

  it('forgets the choice and the query when the form is reset', async () => {
    const { form, data } = mount(async () => ok())
    fireEvent.click(await screen.findByRole('radio', { name: 'Alex Nguyen' }))
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'ale' } })
    act(() => form.reset())
    await waitFor(() => expect(screen.getByRole('searchbox')).toHaveValue(''))
    expect(data()).toEqual({})
    expect(screen.queryByText(/Selected:/)).toBeNull()
  })

  it('does not search while inactive', async () => {
    const search = vi.fn(async () => ok())
    const { rerender, form } = mount(search, { active: false })
    await new Promise((r) => setTimeout(r, 20))
    expect(search).not.toHaveBeenCalled()
    expect(form).toBeInTheDocument()
    rerender(
      <form aria-label="host">
        <SearchPicker
          name="userId"
          legend="Person"
          searchLabel="Search people"
          debounceMs={0}
          search={search}
          active
        />
      </form>,
    )
    await waitFor(() => expect(search).toHaveBeenCalledOnce())
  })

  it('shows an empty result as "no match", with feature wording when supplied', async () => {
    mount(async () => ok([]))
    expect(await screen.findByText('Nothing to choose from.')).toBeInTheDocument()
  })

  it.each([
    ['unavailable', /not available right now/],
    ['error', /search failed/],
  ] as const)('shows %s with a real retry, never as an empty result', async (status, text) => {
    const search = vi
      .fn<(q: string) => Promise<PickerResult>>()
      .mockResolvedValueOnce({ status })
      .mockResolvedValue(ok())
    mount(search)
    expect(await screen.findByText(text)).toBeInTheDocument()
    expect(screen.queryByText('Nothing to choose from.')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await screen.findByRole('radio', { name: 'Alex Nguyen' })
    expect(search).toHaveBeenCalledTimes(2)
  })

  it('drops the pinned choice and offers no retry when permission was lost', async () => {
    const search = vi
      .fn<(q: string) => Promise<PickerResult>>()
      .mockResolvedValueOnce(ok())
      .mockResolvedValue({ status: 'denied' })
    const { data } = mount(search)
    fireEvent.click(await screen.findByRole('radio', { name: 'Alex Nguyen' }))
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'a' } })
    await screen.findByText(/no longer have permission/)
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull()
    expect(data()).toEqual({})
  })

  it('says so when equal names cannot be told apart', async () => {
    mount(async () =>
      ok([
        { value: 'u1', label: 'Alex Nguyen' },
        { value: 'u3', label: 'Alex Nguyen' },
      ]),
    )
    expect(await screen.findByText(/share a name/)).toBeInTheDocument()
    expect(screen.queryByText('u1')).toBeNull()
  })

  it('shows a refused query as its own message with no retry', async () => {
    mount(async () => ({ status: 'invalid' }))
    expect(await screen.findByText(/not accepted/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull()
  })

  it('searches again after a reset even when the query was already empty', async () => {
    const search = vi.fn(async () => ok())
    const { form } = mount(search)
    await screen.findByRole('radio', { name: 'Alex Nguyen' })
    act(() => form.reset())
    await waitFor(() => expect(search).toHaveBeenCalledTimes(2))
    await screen.findByRole('radio', { name: 'Alex Nguyen' })
    expect(screen.queryByText('Searching…')).toBeNull()
  })
  describe('results are bound to the current query (UXR-02)', () => {
    const deferred = () => {
      const pending = new Map<string, (r: PickerResult) => void>()
      const search = vi.fn(
        (q: string) =>
          new Promise<PickerResult>((resolve) => {
            pending.set(q, resolve)
          }),
      )
      return { pending, search }
    }

    it('does not leave rows of the previous query selectable while the new query is pending', async () => {
      const { pending, search } = deferred()
      mount(search)
      await waitFor(() => expect(search).toHaveBeenCalledWith(''))
      await act(async () => pending.get('')!(ok()))
      await screen.findByRole('radio', { name: 'Alex Nguyen' })
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Bao' } })
      await waitFor(() => expect(search).toHaveBeenCalledWith('Bao'))
      expect(screen.queryByRole('radio', { name: 'Alex Nguyen' })).toBeNull()
      expect(screen.queryByRole('radio', { name: 'Bao Tran' })).toBeNull()
      // No row to walk into: ArrowDown does nothing and the box keeps focus.
      screen.getByRole('searchbox').focus()
      fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'ArrowDown' })
      expect(screen.getByRole('searchbox')).toHaveFocus()
      await act(async () => pending.get('Bao')!(ok([PEOPLE[1]!])))
      expect(screen.getByRole('radio', { name: 'Bao Tran' })).toBeInTheDocument()
      expect(screen.queryByRole('radio', { name: 'Alex Nguyen' })).toBeNull()
    })

    it('keeps only the already chosen person, checked, while the new query is pending', async () => {
      const { pending, search } = deferred()
      const { data } = mount(search)
      await waitFor(() => expect(search).toHaveBeenCalledWith(''))
      await act(async () => pending.get('')!(ok()))
      fireEvent.click(await screen.findByRole('radio', { name: 'Alex Nguyen' }))
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Bao' } })
      await waitFor(() => expect(search).toHaveBeenCalledWith('Bao'))
      expect(screen.getByRole('radio', { name: 'Alex Nguyen' })).toBeChecked()
      expect(screen.queryByRole('radio', { name: 'Bao Tran' })).toBeNull()
      expect(data()).toEqual({ userId: 'u1' })
    })

    it('hides the old rows after a failed request, and shows the new rows after Retry', async () => {
      const search = vi
        .fn<(q: string) => Promise<PickerResult>>()
        .mockResolvedValueOnce(ok())
        .mockResolvedValueOnce({ status: 'error' })
        .mockResolvedValue(ok([PEOPLE[1]!]))
      mount(search)
      await screen.findByRole('radio', { name: 'Alex Nguyen' })
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Bao' } })
      await screen.findByText(/search failed/)
      expect(screen.queryByRole('radio', { name: 'Alex Nguyen' })).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
      await screen.findByRole('radio', { name: 'Bao Tran' })
      expect(screen.queryByRole('radio', { name: 'Alex Nguyen' })).toBeNull()
    })

    it('hides the rows of the old query when the query is cleared, until the empty query settles', async () => {
      const { pending, search } = deferred()
      mount(search)
      await waitFor(() => expect(search).toHaveBeenCalledWith(''))
      await act(async () => pending.get('')!(ok()))
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Bao' } })
      await waitFor(() => expect(search).toHaveBeenCalledWith('Bao'))
      await act(async () => pending.get('Bao')!(ok([PEOPLE[1]!])))
      await screen.findByRole('radio', { name: 'Bao Tran' })
      pending.delete('')
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } })
      await waitFor(() => expect(pending.has('')).toBe(true))
      expect(screen.queryByRole('radio', { name: 'Bao Tran' })).toBeNull()
      await act(async () => pending.get('')!(ok()))
      expect(screen.getByRole('radio', { name: 'Alex Nguyen' })).toBeInTheDocument()
    })
  })

  describe('authoritative eligible set (UXR-01)', () => {
    const view = (
      eligible: typeof PEOPLE,
      search: (q: string) => Promise<PickerResult> = async () => ok(),
    ) => (
      <form aria-label="host">
        <SearchPicker
          name="userId"
          legend="Person"
          searchLabel="Search people"
          debounceMs={0}
          search={search}
          eligible={eligible}
        />
      </form>
    )
    const data = () =>
      Object.fromEntries(
        new FormData(screen.getByRole('form', { name: 'host' }) as HTMLFormElement),
      )

    it('drops a chosen person who left the eligible set, and keeps one who stays', async () => {
      const search = vi.fn(async () => ok())
      const { rerender } = render(view(PEOPLE, search))
      fireEvent.click(await screen.findByRole('radio', { name: 'Alex Nguyen' }))
      rerender(view([PEOPLE[1]!], search))
      expect(screen.queryByRole('radio', { name: 'Alex Nguyen' })).toBeNull()
      expect(screen.queryByText(/Selected:/)).toBeNull()
      expect(data()).toEqual({})
      // A person who stays eligible keeps the choice across the same kind of refresh.
      fireEvent.click(await screen.findByRole('radio', { name: 'Bao Tran' }))
      rerender(view([PEOPLE[1]!, { value: 'u9', label: 'Cam Le' }], search))
      expect(screen.getByRole('radio', { name: 'Bao Tran' })).toBeChecked()
      expect(data()).toEqual({ userId: 'u2' })
    })

    it('does not bring a removed person back when they become eligible again', async () => {
      const search = vi.fn(async () => ok())
      const { rerender } = render(view(PEOPLE, search))
      fireEvent.click(await screen.findByRole('radio', { name: 'Alex Nguyen' }))
      rerender(view([PEOPLE[1]!], search))
      rerender(view(PEOPLE, search))
      expect(data()).toEqual({})
    })

    it('searches again for a changed set and shows nobody from the old set meanwhile', async () => {
      const search = vi.fn(async (q: string) => {
        void q
        return ok(PEOPLE)
      })
      const { rerender } = render(view([PEOPLE[0]!], search))
      await screen.findByRole('radio', { name: 'Alex Nguyen' })
      const calls = search.mock.calls.length
      rerender(view([PEOPLE[1]!], search))
      expect(screen.queryByRole('radio', { name: 'Alex Nguyen' })).toBeNull()
      await waitFor(() => expect(search.mock.calls.length).toBeGreaterThan(calls))
    })

    it('does not treat a name search that omits the chosen person as ineligibility', async () => {
      const search = vi.fn(async (q: string) => (q ? ok([PEOPLE[1]!]) : ok()))
      render(view(PEOPLE, search))
      fireEvent.click(await screen.findByRole('radio', { name: 'Alex Nguyen' }))
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Bao' } })
      await screen.findByRole('radio', { name: 'Bao Tran' })
      expect(screen.getByRole('radio', { name: 'Alex Nguyen' })).toBeChecked()
      expect(data()).toEqual({ userId: 'u1' })
    })
  })
})

import { describe, expect, it } from 'vitest'

import { savedViewSearch } from './saved-views'
import type { SavedViewFilters } from './schemas'

describe('savedViewSearch', () => {
  it('maps stored filters onto the grid URL contract and back through the page parser', () => {
    const filters: SavedViewFilters = {
      kind: 'ACTION',
      timing: 'OVERDUE',
      sort: 'due',
      desc: 'true',
      execution: undefined,
      dependency: undefined,
      attention: undefined,
      owner: undefined,
      workstream: undefined,
      q: undefined,
    }
    const search = savedViewSearch(filters)
    expect(search).toBe('?kind=ACTION&timing=OVERDUE&sort=due&desc=true')
    expect(search.startsWith('?')).toBe(true)
  })

  it('empty filters restore the plain base path (no filter)', () => {
    const empty: SavedViewFilters = {
      kind: undefined,
      execution: undefined,
      dependency: undefined,
      timing: undefined,
      attention: undefined,
      owner: undefined,
      workstream: undefined,
      q: undefined,
      sort: undefined,
      desc: undefined,
    }
    expect(savedViewSearch(empty)).toBe('')
  })
})

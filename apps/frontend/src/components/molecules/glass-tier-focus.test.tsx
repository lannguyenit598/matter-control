import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// GL-FORM-02: the material tier can change while a form is on screen (hydration moves the server's
// "frost" snapshot to the browser's "liquid"; the reduced-transparency / forced-colors media can
// flip at any time). The form inside must keep its element, its typed value and its focus.
const glass = vi.hoisted(() => ({
  tier: 'frost' as 'frost' | 'liquid' | 'opaque',
  listeners: new Set<() => void>(),
  register: vi.fn(() => 'mc-glass-test'),
}))
vi.mock('@/lib/mc/glass', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/mc/glass')>()),
  getGlassTier: () => glass.tier,
  subscribeGlassTier: (l: () => void) => {
    glass.listeners.add(l)
    return () => glass.listeners.delete(l)
  },
  registerGlassFilter: glass.register,
  removeGlassFilter: () => undefined,
}))

import { Dialog } from './dialog'
import { GlassSurface } from './glass-surface'

const flip = (tier: 'frost' | 'liquid' | 'opaque') => {
  glass.tier = tier
  act(() => glass.listeners.forEach((l) => l()))
}

beforeEach(() => {
  glass.tier = 'frost'
  glass.listeners.clear()
  glass.register.mockClear()
})

afterEach(() => vi.restoreAllMocks())

describe('Dialog form across material tier changes', () => {
  it('retains optical displacement for non-form glass surfaces', () => {
    glass.tier = 'liquid'
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(512)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(300)
    render(
      <GlassSurface refraction={12}>
        <button type="button">Open navigation</button>
      </GlassSurface>,
    )
    expect(screen.getByRole('button', { name: 'Open navigation' })).toBeEnabled()
    expect(glass.register).toHaveBeenCalledWith(
      expect.objectContaining({ optics: expect.objectContaining({ refraction: 12 }) }),
    )
  })

  it('keeps a liquid form interactive without creating an optical displacement filter', () => {
    glass.tier = 'liquid'
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(512)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(300)
    render(
      <Dialog open onOpenChange={() => {}} title="New workspace">
        <input aria-label="Workspace name" data-autofocus />
      </Dialog>,
    )
    const input = screen.getByRole('textbox', { name: 'Workspace name' })
    expect(input).toHaveFocus()
    expect(glass.register).not.toHaveBeenCalled()
  })

  it.each([
    ['frost', 'liquid'],
    ['liquid', 'opaque'],
    ['liquid', 'frost'],
  ] as const)('keeps the focused input, its value and focus on %s → %s', (from, to) => {
    glass.tier = from
    render(
      <Dialog open onOpenChange={() => {}} title="New matter" keepMounted>
        <input aria-label="Title" data-autofocus defaultValue="" />
      </Dialog>,
    )
    const input = screen.getByLabelText('Title') as HTMLInputElement
    input.focus()
    input.value = 'Atlas merger'
    expect(document.activeElement).toBe(input)

    flip(to)

    const after = screen.getByLabelText('Title') as HTMLInputElement
    expect(after).toBe(input) // the same element: nothing was unmounted and recreated
    expect(after.value).toBe('Atlas merger')
    expect(document.activeElement).toBe(after)
  })
})

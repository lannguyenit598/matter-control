import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// GL-FORM-02: the material tier can change while a form is on screen (hydration moves the server's
// "frost" snapshot to the browser's "liquid"; the reduced-transparency / forced-colors media can
// flip at any time). The form inside must keep its element, its typed value and its focus.
const glass = vi.hoisted(() => ({
  tier: 'frost' as 'frost' | 'liquid' | 'opaque',
  listeners: new Set<() => void>(),
}))
vi.mock('@/lib/mc/glass', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/mc/glass')>()),
  getGlassTier: () => glass.tier,
  subscribeGlassTier: (l: () => void) => {
    glass.listeners.add(l)
    return () => glass.listeners.delete(l)
  },
  registerGlassFilter: () => 'mc-glass-test',
  removeGlassFilter: () => undefined,
}))

import { Dialog } from './dialog'

const flip = (tier: 'frost' | 'liquid' | 'opaque') => {
  glass.tier = tier
  act(() => glass.listeners.forEach((l) => l()))
}

beforeEach(() => {
  glass.tier = 'frost'
  glass.listeners.clear()
})

describe('Dialog form across material tier changes', () => {
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

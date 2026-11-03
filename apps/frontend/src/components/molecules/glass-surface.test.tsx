import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { GlassSurface } from './glass-surface'

// jsdom has no CSS.supports/canvas: the tier resolves opaque, so GlassSurface adds no material —
// the fallback contract every host component relies on. Its two wrappers are layout-neutral
// (`display: contents`) so the element tree is the same in every tier (GL-FORM-02).
describe('GlassSurface fallback tiers', () => {
  it('adds no material and only layout-neutral wrappers when the tier is not liquid', () => {
    render(
      <GlassSurface className="rounded-lg" frost={0.35} refraction={24} bezel={28}>
        <button type="button">Save</button>
      </GlassSurface>,
    )
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(document.querySelector('[data-glass-tier="liquid"]')).toBeNull()
    expect(document.querySelector('.glass-layer')).toBeNull()
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button.parentElement).toHaveClass('contents')
    expect(button.parentElement?.parentElement).toHaveClass('contents')
  })

  it('stays interactive without wrapper interference', () => {
    const onClick = vi.fn()
    render(
      <GlassSurface>
        <button type="button" onClick={onClick}>
          Go
        </button>
      </GlassSurface>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

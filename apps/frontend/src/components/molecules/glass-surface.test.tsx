import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { GlassSurface } from './glass-surface'

// jsdom has no CSS.supports/canvas: the tier resolves opaque, so GlassSurface renders its
// children bare — the fallback contract every host component relies on.
describe('GlassSurface fallback tiers', () => {
  it('renders children bare when the tier is not liquid', () => {
    render(
      <GlassSurface className="rounded-lg" frost={0.35} refraction={24} bezel={28}>
        <button type="button">Save</button>
      </GlassSurface>,
    )
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(document.querySelector('[data-glass-tier="liquid"]')).toBeNull()
    expect(document.querySelector('.glass-layer')).toBeNull()
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

import { describe, expect, it } from 'vitest'

import { computeDisplacementMap, resolveGlassTier } from './glass'

const NEUTRAL = 128

describe('resolveGlassTier', () => {
  const base = {
    supportsBackdropFilter: true,
    supportsUrlBackdrop: true,
    chromium: true,
    reducedTransparency: false,
    forcedColors: false,
  }

  it('liquid on Chromium with full backdrop-filter support', () => {
    expect(resolveGlassTier(base)).toBe('liquid')
  })

  it('frost on non-Chromium engines (Safari/Firefox drop url() backdrop filters)', () => {
    expect(resolveGlassTier({ ...base, chromium: false })).toBe('frost')
  })

  it('opaque when the user reduces transparency or forces colors', () => {
    expect(resolveGlassTier({ ...base, reducedTransparency: true })).toBe('opaque')
    expect(resolveGlassTier({ ...base, forcedColors: true })).toBe('opaque')
  })

  it('opaque without backdrop-filter support at all', () => {
    expect(resolveGlassTier({ ...base, supportsBackdropFilter: false })).toBe('opaque')
  })
})

describe('computeDisplacementMap', () => {
  const w = 100
  const h = 80
  const optics = { radius: 8, bezel: 20, refraction: 24 }
  const map = computeDisplacementMap(w, h, optics)
  const at = (x: number, y: number) => {
    const i = (y * w + x) * 4
    return { r: map[i], g: map[i + 1], b: map[i + 2], a: map[i + 3] }
  }

  it('is deterministic with RGBA layout and neutral blue channel', () => {
    const again = computeDisplacementMap(w, h, optics)
    expect(again).toEqual(map)
    const c = at(50, 40)
    expect(c.b).toBe(NEUTRAL)
    expect(c.a).toBe(255)
  })

  it('keeps the interior neutral (no displacement in the center)', () => {
    const c = at(50, 40)
    expect(c.r).toBe(NEUTRAL)
    expect(c.g).toBe(NEUTRAL)
  })

  it('bends outward at the edges: R falls on the left, rises on the right', () => {
    const left = at(0, 40)
    const right = at(99, 40)
    expect(left.r).toBeLessThan(NEUTRAL - 100)
    expect(right.r).toBeGreaterThan(NEUTRAL + 100)
    expect(left.g).toBe(NEUTRAL)
    expect(right.g).toBe(NEUTRAL)
  })

  it('bends vertically at the top and bottom edges', () => {
    const top = at(50, 0)
    const bottom = at(50, 79)
    expect(top.g).toBeLessThan(NEUTRAL - 100)
    expect(bottom.g).toBeGreaterThan(NEUTRAL + 100)
    expect(top.r).toBe(NEUTRAL)
    expect(bottom.r).toBe(NEUTRAL)
  })

  it('bends diagonally in the rounded corners', () => {
    // (1,1) is clipped by the corner arc; (3,3) sits inside it, in the bezel band.
    const corner = at(3, 3)
    expect(corner.r).toBeLessThan(NEUTRAL)
    expect(corner.g).toBeLessThan(NEUTRAL)
  })

  it('eases to no displacement at the inner bezel boundary', () => {
    // bezel 20: a pixel 20px inside the left edge is back to neutral.
    const inner = at(20, 40)
    expect(inner.r).toBe(NEUTRAL)
  })

  it('tolerates optics larger than the surface without NaN', () => {
    const tiny = computeDisplacementMap(2, 2, { radius: 500, bezel: 100, refraction: 24 })
    for (let i = 3; i < tiny.length; i += 4) expect(tiny[i]).toBe(255)
    expect(Number.isNaN(tiny[0])).toBe(false)
  })
})

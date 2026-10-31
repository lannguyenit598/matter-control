'use client'

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react'

import {
  getGlassTier,
  registerGlassFilter,
  removeGlassFilter,
  subscribeGlassTier,
  type GlassOptics,
  type GlassTier,
} from '@/lib/mc/glass'

import { cn } from '@/lib/utils'

/** The resolved material tier for this page load (SSR defaults to the frosted fallback). */
export function useGlassTier(): GlassTier {
  return useSyncExternalStore(subscribeGlassTier, getGlassTier, () => 'frost')
}

type GlassSurfaceProps = {
  /** Material density: the tint opacity over the blurred backdrop (0 ≈ clear, 1 ≈ regular). */
  frost?: number
  /** Rim refraction strength in px (feDisplacementMap scale). */
  refraction?: number
  /** Width of the refracting rim in px. */
  bezel?: number
  /** Base backdrop blur in px (the frost dial adds a tint, not more blur). */
  blur?: number
  /** Rim-light intensity (0–1). */
  specular?: number
  /** Corner radius in px — must match the surface's visual radius (shapes the map). */
  radius?: number
  /**
   * Tracks the pointer as the light source for the rim highlight. Motion-gated; dialogs only —
   * never on dense content surfaces.
   */
  pointerLight?: boolean
  className?: string
  children: ReactNode
}

/**
 * The liquid glass material (tier `liquid`, Chromium): five stacked layers — blur+saturate
 * backdrop, a displacement layer bending it through a canvas-generated rounded-rect map, a
 * frost tint, a rim-light specular, then the content. On engines that drop `backdrop-filter:
 * url(#…)` (Safari/Firefox) it renders its children bare — the surrounding component's frosted
 * styles are the fallback. Opaque tier (reduced transparency / forced colors) resolves the
 * same way and the CSS media overrides force the solid tint.
 */
export function GlassSurface({
  frost = 0.35,
  refraction = 24,
  bezel = 28,
  blur = 10,
  specular = 0.5,
  radius = 8,
  pointerLight = false,
  className,
  children,
}: GlassSurfaceProps) {
  const tier = useGlassTier()
  const surfaceRef = useRef<HTMLDivElement | null>(null)
  // The rim light tracks the pointer via rAF; one ref, no re-renders (see onPointerMove below).
  const light = useRef<{ frame: number | null }>({ frame: null })
  const [filterId, setFilterId] = useState<string | null>(null)

  useEffect(() => {
    if (tier !== 'liquid') return
    const el = surfaceRef.current
    if (!el) return
    let id: string | null = null
    const apply = () => {
      const width = el.offsetWidth
      const height = el.offsetHeight
      if (!width || !height) return
      const optics: GlassOptics = { radius, bezel, refraction }
      const next = registerGlassFilter({ width, height, optics })
      if (next) {
        if (id && id !== next) removeGlassFilter(id)
        id = next
        setFilterId(next)
      }
    }
    apply()
    let observer: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(apply)
      observer.observe(el)
    }
    return () => {
      observer?.disconnect()
      if (id) removeGlassFilter(id)
    }
  }, [tier, radius, bezel, refraction])

  const liquid = tier === 'liquid'

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerLight || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = surfaceRef.current
    if (!el || light.current.frame !== null) return
    const rect = el.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    light.current.frame = requestAnimationFrame(() => {
      light.current.frame = null
      el.style.setProperty('--spec-x', `${x}%`)
      el.style.setProperty('--spec-y', `${y}%`)
    })
  }

  // The element tree is the same in every tier (GL-FORM-02). The tier is only known in the browser
  // and can change while a form is open (hydration, reduced-transparency or forced-colors flips);
  // a different wrapper structure would unmount and recreate the children, dropping the focused
  // field, typed text and an unresolved command. Outside the liquid tier the two wrappers are
  // layout-neutral (`display: contents`) and the material layers are simply absent; the fixed
  // slots keep the content's position, so React keeps its element identity.
  return (
    <div
      ref={surfaceRef}
      data-glass-tier={liquid ? 'liquid' : undefined}
      className={liquid ? cn('glass-surface relative isolate', className) : 'contents'}
      style={
        liquid
          ? ({ '--glass-frost': frost, '--glass-spec-int': specular } as CSSProperties)
          : undefined
      }
      onPointerMove={liquid && pointerLight ? onPointerMove : undefined}
    >
      {liquid ? (
        <div
          aria-hidden
          className="glass-layer glass-backdrop-a"
          style={{ backdropFilter: `blur(${blur}px) saturate(150%)` }}
        />
      ) : null}
      {liquid ? (
        <div
          aria-hidden
          className="glass-layer glass-backdrop-b"
          style={{ backdropFilter: filterId ? `url(#${filterId})` : undefined }}
        />
      ) : null}
      {liquid ? <div aria-hidden className="glass-layer glass-specular" /> : null}
      <div className={liquid ? 'glass-content' : 'contents'}>{children}</div>
    </div>
  )
}

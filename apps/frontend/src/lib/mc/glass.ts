// Liquid Glass kernel (tier detection + displacement-map math + SVG filter registry).
// Technique: SVG feDisplacementMap driven by a canvas-generated rounded-rect map — real
// refraction on Chromium; Safari/Firefox drop `backdrop-filter: url(#…)` (WebKit bug 245510)
// and fall back to the frosted tier. Zero dependencies: the map is generated on canvas (never
// as an SVG data-URI — Chromium rasterizes feImage SVG sources with CSS disabled), cached
// module-wide by size+optics, and filters live in one hoisted hidden <svg>.
// Design reference: docs/implementation/plans/MC-ZCODE-LIQUID-GLASS-ENHANCE-20261030.md.

export type GlassTier = 'liquid' | 'frost' | 'opaque'

export type GlassTierEnv = {
  supportsBackdropFilter: boolean
  supportsUrlBackdrop: boolean
  chromium: boolean
  reducedTransparency: boolean
  forcedColors: boolean
}

export type GlassOptics = {
  /** Corner radius of the pane in px — shapes the displacement map. */
  radius: number
  /** Width of the refracting rim in px. */
  bezel: number
  /** Maximum displacement in px (feDisplacementMap scale). */
  refraction: number
}

export function resolveGlassTier(env: GlassTierEnv): GlassTier {
  if (env.reducedTransparency || env.forcedColors || !env.supportsBackdropFilter) return 'opaque'
  if (env.chromium && env.supportsUrlBackdrop) return 'liquid'
  return 'frost'
}

/**
 * The displacement map as RGBA bytes. Each pixel encodes the sample offset for
 * feDisplacementMap: R drives X, G drives Y, 128 = neutral. The pane interior is neutral;
 * the bezel band bends outward along the rounded-rect normal with a quadratic ease (full
 * bend at the edge, none at the inner boundary), so straight lines behind the pane curve
 * at the rim — the lens look.
 */
export function computeDisplacementMap(
  width: number,
  height: number,
  optics: GlassOptics,
): Uint8ClampedArray {
  const w = Math.max(1, Math.floor(width))
  const h = Math.max(1, Math.floor(height))
  const radius = Math.max(1, Math.min(optics.radius, w / 2, h / 2))
  const bezel = Math.max(1, Math.min(optics.bezel, w / 2, h / 2))
  const out = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5
      const py = y + 0.5
      const sx = px < w / 2 ? -1 : 1
      const sy = py < h / 2 ? -1 : 1
      const ax = Math.abs(px - w / 2) - (w / 2 - radius)
      const ay = Math.abs(py - h / 2) - (h / 2 - radius)
      // Signed distance to the rounded-rect edge (negative inside).
      const sd =
        Math.hypot(Math.max(ax, 0), Math.max(ay, 0)) + Math.min(Math.max(ax, ay), 0) - radius
      const depth = -sd
      let r = 128
      let g = 128
      if (depth > 0) {
        const band = Math.min(depth / bezel, 1)
        const t = (1 - band) * (1 - band)
        let nx = 0
        let ny = 0
        if (ax > 0 && ay > 0) {
          const len = Math.hypot(ax, ay)
          nx = (ax / len) * sx
          ny = (ay / len) * sy
        } else if (ax > 0) {
          nx = sx
        } else if (ay > 0) {
          ny = sy
        }
        r = 128 + nx * 127 * t
        g = 128 + ny * 127 * t
      }
      const i = (y * w + x) * 4
      out[i] = r
      out[i + 1] = g
      out[i + 2] = 128
      out[i + 3] = 255
    }
  }
  return out
}

/**
 * Renders the map to a PNG data URL at (at most) half resolution above 180px — the filter
 * stretches it back with preserveAspectRatio="none", halving generation cost. Returns null
 * when there is no DOM canvas (SSR, jsdom).
 */
export function displacementMapDataUrl(
  width: number,
  height: number,
  optics: GlassOptics,
): string | null {
  if (typeof document === 'undefined') return null
  const half = width > 180 || height > 180
  const gw = half ? Math.max(1, Math.ceil(width / 2)) : Math.max(1, Math.floor(width))
  const gh = half ? Math.max(1, Math.ceil(height / 2)) : Math.max(1, Math.floor(height))
  const scale = gw / width
  const bytes = computeDisplacementMap(gw, gh, {
    radius: optics.radius * scale,
    bezel: Math.max(1, optics.bezel * scale),
    refraction: optics.refraction,
  })
  const canvas = document.createElement('canvas')
  canvas.width = gw
  canvas.height = gh
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const image = ctx.createImageData(gw, gh)
  image.data.set(bytes)
  ctx.putImageData(image, 0, 0)
  return canvas.toDataURL('image/png')
}

const mapCache = new Map<string, string>()
const mapCacheMax = 64
const mapKey = (width: number, height: number, o: GlassOptics) =>
  `${width}x${height}r${o.radius}b${o.bezel}s${o.refraction}`

/** Maps are cached module-wide by size+optics: ten same-optics surfaces share one map. */
export function getDisplacementMap(
  width: number,
  height: number,
  optics: GlassOptics,
): string | null {
  const key = mapKey(width, height, optics)
  const cached = mapCache.get(key)
  if (cached) return cached
  const url = displacementMapDataUrl(width, height, optics)
  if (!url) return null
  if (mapCache.size >= mapCacheMax) mapCache.clear()
  mapCache.set(key, url)
  return url
}

const SVG_NS = 'http://www.w3.org/2000/svg'
const registry: { svg: SVGSVGElement | null; nextId: number } = { svg: null, nextId: 0 }

function ensureRegistrySvg(): SVGSVGElement | null {
  if (registry.svg) return registry.svg
  if (typeof document === 'undefined') return null
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('aria-hidden', 'true')
  svg.style.position = 'absolute'
  svg.style.width = '0'
  svg.style.height = '0'
  document.body.appendChild(svg)
  registry.svg = svg
  return svg
}

/**
 * Creates (or replaces) the named filter for one surface: feImage carries the cached map,
 * feDisplacementMap bends the already-blurred backdrop by `refraction` px. Returns the filter
 * id, or null when maps cannot be generated (then the surface renders its frosted tier).
 */
export function registerGlassFilter(args: {
  width: number
  height: number
  optics: GlassOptics
}): string | null {
  const href = getDisplacementMap(args.width, args.height, args.optics)
  const svg = ensureRegistrySvg()
  if (!href || !svg) return null
  const id = `mc-glass-${++registry.nextId}`
  const filter = document.createElementNS(SVG_NS, 'filter')
  filter.setAttribute('id', id)
  filter.setAttribute('x', '0')
  filter.setAttribute('y', '0')
  filter.setAttribute('width', '100%')
  filter.setAttribute('height', '100%')
  const feImage = document.createElementNS(SVG_NS, 'feImage')
  feImage.setAttribute('href', href)
  feImage.setAttribute('x', '0')
  feImage.setAttribute('y', '0')
  feImage.setAttribute('width', '100%')
  feImage.setAttribute('height', '100%')
  feImage.setAttribute('preserveAspectRatio', 'none')
  feImage.setAttribute('result', 'map')
  const feDisplacement = document.createElementNS(SVG_NS, 'feDisplacementMap')
  feDisplacement.setAttribute('in', 'SourceGraphic')
  feDisplacement.setAttribute('in2', 'map')
  feDisplacement.setAttribute('scale', String(Math.max(0, args.optics.refraction)))
  feDisplacement.setAttribute('xChannelSelector', 'R')
  feDisplacement.setAttribute('yChannelSelector', 'G')
  filter.appendChild(feImage)
  filter.appendChild(feDisplacement)
  svg.appendChild(filter)
  return id
}

export function removeGlassFilter(id: string): void {
  if (!registry.svg) return
  for (const f of Array.from(registry.svg.children)) {
    if (f.getAttribute('id') === id) f.remove()
  }
}

let cachedTier: GlassTier | null = null
const tierListeners = new Set<() => void>()

function computeTier(): GlassTier {
  if (typeof window === 'undefined' || typeof CSS === 'undefined' || !CSS.supports) return 'frost'
  const supportsBackdropFilter =
    CSS.supports('backdrop-filter', 'blur(1px)') ||
    CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
  const supportsUrlBackdrop = CSS.supports('backdrop-filter', 'url(#mc-glass-probe)')
  const chromium = typeof (window as { chrome?: unknown }).chrome !== 'undefined'
  const media = (query: string) =>
    typeof window.matchMedia === 'function' && window.matchMedia(query).matches
  return resolveGlassTier({
    supportsBackdropFilter,
    supportsUrlBackdrop,
    chromium,
    reducedTransparency: media('(prefers-reduced-transparency: reduce)'),
    forcedColors: media('(forced-colors: active)'),
  })
}

/** Resolved tier for this page load (re-evaluated if the transparency/forced-colors media flip). */
export function getGlassTier(): GlassTier {
  if (cachedTier === null) cachedTier = computeTier()
  return cachedTier
}

/** useSyncExternalStore plumbing: tier is static per load unless the media states flip. */
export function subscribeGlassTier(listener: () => void): () => void {
  tierListeners.add(listener)
  if (
    tierListeners.size === 1 &&
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function'
  ) {
    for (const query of ['(prefers-reduced-transparency: reduce)', '(forced-colors: active)']) {
      window.matchMedia(query).addEventListener('change', () => {
        cachedTier = null
        for (const l of tierListeners) l()
      })
    }
  }
  return () => tierListeners.delete(listener)
}

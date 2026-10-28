/**
 * Causal navigation keeps the origin you came from in `?from=`. It is untrusted input: only a
 * same-site in-app path is ever followed back, anything else falls back to a safe default.
 */
export function safeInternalPath(raw: string | null | undefined, fallback: string): string {
  if (!raw || raw.length > 2048) return fallback
  if (/[\u0000-\u001f\u007f-\u009f\\]/.test(raw)) return fallback
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback
  let url: URL
  try {
    url = new URL(raw, 'http://local.invalid')
  } catch {
    return fallback
  }
  if (url.origin !== 'http://local.invalid') return fallback
  if (url.pathname.startsWith('/api/') || url.pathname === '/login') return fallback
  return url.pathname + url.search
}

/** Appends the origin to a link so the next page can offer a truthful "Back". */
export function withFrom(href: string, from: string): string {
  const [path = '', query = ''] = href.split('?')
  const params = new URLSearchParams(query)
  params.set('from', from)
  return `${path}?${params.toString()}`
}

import type { SavedViewFilters } from './schemas'

/**
 * The URL query of one saved view (RLF-04): the stored filters mapped onto the existing work-grid
 * URL contract. Applying a view is navigation, so Back/Forward and sharing-free behavior come
 * from the browser; the grid page re-parses and re-authorizes everything. Empty filters restore
 * "no filter" — the base path alone.
 */
export function savedViewSearch(filters: SavedViewFilters): string {
  const p = new URLSearchParams()
  for (const [name, value] of Object.entries(filters)) {
    if (value) p.set(name, String(value))
  }
  const search = p.toString()
  return search ? `?${search}` : ''
}

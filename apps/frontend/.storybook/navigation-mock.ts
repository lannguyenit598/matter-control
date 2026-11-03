/**
 * Storybook mock for `next/navigation` (UX-L-06): components under the stories (RowTitleEdit,
 * LocaleToggle, the work grid…) read the router at render time, and Storybook is not Next, so
 * the real module does not exist in the Vite graph. main.ts aliases the import here.
 */
export function useRouter() {
  return {
    push: () => {},
    replace: () => {},
    refresh: () => {},
    back: () => {},
    forward: () => {},
    prefetch: async () => {},
  }
}

export function usePathname() {
  return '/'
}

export function useParams() {
  return {}
}

export function useSearchParams() {
  return new URLSearchParams()
}

export function useSelectedLayoutSegment() {
  return null
}

export function useSelectedLayoutSegments() {
  return []
}

export function redirect() {}

export function notFound() {}

export const unstable_rethrow = () => {}

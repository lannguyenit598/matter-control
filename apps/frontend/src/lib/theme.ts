export const THEME_STORAGE_KEY = 'theme'

/**
 * W3 (UX-B-09): browser-chrome colors per theme, mirrored from the token palette —
 * light `--workbench-background`, dark `--background` — so the mobile browser bar matches
 * the page ground. Kept in sync by the same mechanism that drives `data-theme` (the init
 * script below and toggleTheme); no parallel theme system.
 */
export const THEME_COLORS: Record<'light' | 'dark', string> = {
  light: '#fafbfc',
  dark: '#0d0d10',
}

const themeColorScript = `(function(){var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',${JSON.stringify(THEME_COLORS)}[document.documentElement.dataset.theme]||'')})()`

/**
 * Runs before first paint (inlined in <head>) so the page never flashes the wrong theme.
 * Saved choice wins; otherwise follow the OS preference. Also syncs the theme-color meta
 * so the first paint already carries the right browser-chrome color.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=d?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}${themeColorScript}})()`

export function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // skip: storage blocked (private mode); theme still applies for this page view
  }
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLORS[next])
}

import type { ReactNode } from 'react'

import { LocalizedText } from '@/components/molecules/localized-text'
import { GlassSurface } from '@/components/molecules/glass-surface'

export type DashboardTemplateProps = {
  /** Desktop navigation (hidden below md). */
  sidebar: ReactNode
  header: ReactNode
  children: ReactNode
}

/**
 * Page skeleton for authenticated app screens: sidebar + sticky header + scrollable content.
 * Pure layout with slots. It knows nothing about routes, data or navigation items;
 * the route layout (app/(app)/layout.tsx) fills the slots.
 */
export function DashboardTemplate({ sidebar, header, children }: DashboardTemplateProps) {
  return (
    <div className="app-shell flex min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-background px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        <LocalizedText en="Skip to content" vi="Đến nội dung" />
      </a>
      <div className="app-sidebar-slot">
        <GlassSurface className="h-full" radius={20} frost={0.48} refraction={14} bezel={18}>
          {sidebar}
        </GlassSurface>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="app-mobile-header">{header}</div>
        <main id="main-content" className="app-main min-w-0 flex-1">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  )
}

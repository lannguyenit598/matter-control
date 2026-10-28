import type { ReactNode } from 'react'

import { LocalizedText } from '@/components/molecules/localized-text'

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
    <div className="flex min-h-dvh">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-background px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        <LocalizedText en="Skip to content" vi="Đến nội dung" />
      </a>
      <div className="sticky top-0 hidden h-dvh w-60 shrink-0 md:block">{sidebar}</div>
      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        <main id="main-content" className="mx-auto w-full max-w-[90rem] flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  )
}

import { Suspense } from 'react'
import { PanelsTopLeft, Scale, Settings2 } from 'lucide-react'

import { LocaleToggle } from '@/components/molecules/locale-toggle'
import { LocalizedText } from '@/components/molecules/localized-text'

import { ThemeToggle } from '@/components/molecules/theme-toggle'
import { AppHeader } from '@/components/organisms/app-header'
import { AppSidebar } from '@/components/organisms/app-sidebar'
import { BottomNav } from '@/components/organisms/bottom-nav'
import { CommandPalette } from '@/components/organisms/command-palette'
import { DashboardTemplate } from '@/components/templates/dashboard-template'
import { mainNavigation } from '@/config/navigation'
import { siteConfig } from '@/config/site'
import { AccountMenu } from '@/features/auth/components/account-menu'
import { ActionAnnouncer } from '@/components/organisms/action-announcer'
import { DraftScope } from '@/features/auth/components/draft-scope-server'

/** Route layout: fills the DashboardTemplate slots with organisms + app config. */
export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <DashboardTemplate
      // usePathname() in the nav is runtime data on dynamic-segment routes: keep it in Suspense.
      sidebar={
        <Suspense fallback={null}>
          <AppSidebar
            brand={
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="app-brand-mark" aria-hidden>
                  <Scale className="size-5" />
                </span>
                {siteConfig.name}
              </span>
            }
            items={mainNavigation}
            footer={
              <div className="flex flex-col gap-3 px-1">
                <Suspense fallback={null}>
                  <AccountMenu />
                </Suspense>
                <p className="text-xs font-medium text-muted-foreground">
                  <LocalizedText en="Preferences" vi="Tùy chọn" />
                </p>
                <div className="flex flex-col gap-2">
                  <LocaleToggle />
                </div>
              </div>
            }
          />
        </Suspense>
      }
      header={
        <AppHeader
          start={
            <>
              <span className="flex min-w-0 items-center gap-2 font-semibold min-[801px]:hidden">
                <Scale aria-hidden className="size-5 min-[421px]:hidden" />
                <span className="max-[420px]:sr-only">{siteConfig.name}</span>
              </span>
              <span className="hidden items-center gap-2 text-sm text-muted-foreground min-[801px]:flex">
                <PanelsTopLeft aria-hidden className="size-4" />
                <LocalizedText en="Workspace" vi="Không gian làm việc" />
              </span>
            </>
          }
          end={
            <div className="app-toolbar-controls flex items-center gap-2">
              <CommandPalette />
              <ThemeToggle />
              <details className="relative min-[801px]:hidden">
                <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-md hover:bg-accent">
                  <Settings2 aria-hidden className="size-4" />
                  <span className="sr-only">
                    <LocalizedText en="Preferences" vi="Tùy chọn" />
                  </span>
                </summary>
                <div className="absolute right-0 z-20 mt-2 flex w-56 flex-col gap-3 rounded-lg border bg-card p-4 shadow-md">
                  <LocaleToggle />
                  <Suspense>
                    <AccountMenu />
                  </Suspense>
                </div>
              </details>
            </div>
          }
        />
      }
      bottomNavigation={
        <Suspense fallback={null}>
          <BottomNav items={mainNavigation} />
        </Suspense>
      }
    >
      <ActionAnnouncer>
        <Suspense>
          <DraftScope>{children}</DraftScope>
        </Suspense>
      </ActionAnnouncer>
    </DashboardTemplate>
  )
}

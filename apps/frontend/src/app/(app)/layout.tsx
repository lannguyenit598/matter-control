import { Suspense } from 'react'
import { Monitor, Settings2 } from 'lucide-react'

import { LocaleToggle } from '@/components/molecules/locale-toggle'
import { LocalizedText } from '@/components/molecules/localized-text'

import { ThemeToggle } from '@/components/molecules/theme-toggle'
import { AppHeader } from '@/components/organisms/app-header'
import { AppSidebar } from '@/components/organisms/app-sidebar'
import { MobileNav } from '@/components/organisms/mobile-nav'
import { DashboardTemplate } from '@/components/templates/dashboard-template'
import { mainNavigation } from '@/config/navigation'
import { siteConfig } from '@/config/site'
import { AccountMenu } from '@/features/auth/components/account-menu'
import { DraftScope } from '@/features/auth/components/draft-scope-server'

/** Route layout: fills the DashboardTemplate slots with organisms + app config. */
export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <DashboardTemplate
      // usePathname() in the nav is runtime data on dynamic-segment routes: keep it in Suspense.
      sidebar={
        <Suspense fallback={null}>
          <AppSidebar
            brand={<span className="flex items-center gap-2.5">{siteConfig.name}</span>}
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
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex min-w-0 items-center gap-2">
                    <Monitor aria-hidden className="size-4 shrink-0" />
                    <LocalizedText en="Appearance" vi="Giao diện" />
                  </span>
                  <ThemeToggle />
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
              <Suspense fallback={null}>
                <MobileNav items={mainNavigation} />
              </Suspense>
              <span className="font-semibold">{siteConfig.name}</span>
            </>
          }
          end={
            <div className="flex items-center gap-3">
              <Suspense>
                <AccountMenu />
              </Suspense>
              <details className="relative">
                <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-md hover:bg-accent">
                  <Settings2 aria-hidden className="size-4" />
                  <span className="sr-only">
                    <LocalizedText en="Preferences" vi="Tùy chọn" />
                  </span>
                </summary>
                <div className="absolute right-0 z-20 mt-2 flex w-56 flex-col gap-3 rounded-lg border bg-card p-4 shadow-md">
                  <LocaleToggle />
                  <ThemeToggle />
                </div>
              </details>
            </div>
          }
        />
      }
    >
      <Suspense>
        <DraftScope>{children}</DraftScope>
      </Suspense>
    </DashboardTemplate>
  )
}

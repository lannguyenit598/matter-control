import { Suspense } from 'react'

import { LocaleToggle } from '@/components/molecules/locale-toggle'

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
          <AppSidebar brand={siteConfig.name} items={mainNavigation} />
        </Suspense>
      }
      header={
        <AppHeader
          start={
            <>
              <Suspense fallback={null}>
                <MobileNav items={mainNavigation} />
              </Suspense>
              <span className="font-semibold md:hidden">{siteConfig.name}</span>
            </>
          }
          end={
            <div className="flex items-center gap-3">
              <Suspense>
                <AccountMenu />
              </Suspense>
              <LocaleToggle />
              <ThemeToggle />
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

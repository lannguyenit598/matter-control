import type { Metadata } from 'next'
import localFont from 'next/font/local'

import { LocaleProvider } from '@/components/molecules/locale-provider'
import { siteConfig } from '@/config/site'
import { uiLocale } from '@/lib/locale-server'
import { themeInitScript } from '@/lib/theme'

import './globals.css'

const uiFont = localFont({
  src: [
    { path: './fonts/be-vietnam-pro/BeVietnamPro-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/be-vietnam-pro/BeVietnamPro-Medium.ttf', weight: '500', style: 'normal' },
    { path: './fonts/be-vietnam-pro/BeVietnamPro-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: './fonts/be-vietnam-pro/BeVietnamPro-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-ui',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
}

// D-2 (UX-L-02): the interface language is per-request (the ui-locale cookie read in the layout
// below), so the root shell blocks instead of prerendering a default-language shell. The Worker
// build resolves this module to root-shell.worker.tsx (next.config resolveAlias), which cannot
// carry the segment config.
export const instant = false

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  // The interface language is server-readable, so the first byte carries the right lang and the
  // provider seeds the hydrated tree from the same value — no hydration flip.
  const locale = await uiLocale()
  return (
    // data-theme is set by themeInitScript before hydration, hence suppressHydrationWarning.
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={uiFont.variable}>
        <LocaleProvider initial={locale}>{children}</LocaleProvider>
      </body>
    </html>
  )
}

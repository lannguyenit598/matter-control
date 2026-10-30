import type { Metadata } from 'next'
import localFont from 'next/font/local'

import { siteConfig } from '@/config/site'
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

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // data-theme is set by themeInitScript before hydration, hence suppressHydrationWarning.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={uiFont.variable}>{children}</body>
    </html>
  )
}

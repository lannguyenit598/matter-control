'use client'

import { LocalizedText } from '@/components/molecules/localized-text'
import { useLocale } from '@/hooks/use-locale'

import { useEffect } from 'react'

import './globals.css'

/**
 * Last-resort boundary for errors in the root layout. Replaces the whole document,
 * so it renders its own <html>/<body> and cannot use the app shell or metadata.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const locale = useLocale()
  const title = locale === 'vi' ? 'Đã xảy ra lỗi' : 'Something went wrong'
  useEffect(() => {
    // Replace with your error reporting service (Sentry, Datadog...).
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-dvh items-center justify-center p-4">
        <title>{title}</title>
        <main className="flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold">
            <LocalizedText en="Something went wrong" vi="Đã xảy ra lỗi" />
          </h1>
          <p className="text-sm text-muted-foreground">
            <LocalizedText
              en="An unexpected error occurred. Please try again."
              vi="Đã xảy ra lỗi không mong muốn. Vui lòng thử lại."
            />
          </p>
          <button
            type="button"
            onClick={retry}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <LocalizedText en="Try again" vi="Thử lại" />
          </button>
        </main>
      </body>
    </html>
  )
}

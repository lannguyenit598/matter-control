import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ArrowRight, Scale } from 'lucide-react'

import { buttonVariants } from '@/components/atoms/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Alert } from '@/components/molecules/alert'
import { siteConfig } from '@/config/site'
import { safeReturnTo } from '@/lib/oidc/flow'

export const metadata: Metadata = { title: 'Sign in' }

const MESSAGES: Record<string, string> = {
  denied: 'Sign-in was cancelled or refused.',
  invalid: 'The sign-in could not be verified. Please try again.',
  unavailable: 'The sign-in service could not be reached. Please try again shortly.',
}

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Scale aria-hidden className="size-8 stroke-[1.4] text-dependency-ready" />
          <h1 className="text-xl font-semibold tracking-tight">{siteConfig.name}</h1>
          <p className="text-sm text-muted-foreground">
            <LocalizedText
              en="A clear view of your legal work."
              vi="Nhìn rõ toàn bộ công việc pháp lý."
            />
          </p>
        </div>
        <Suspense>
          <LoginCard searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  )
}

async function LoginCard({ searchParams }: Pick<PageProps<'/login'>, 'searchParams'>) {
  const raw = await searchParams
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
  const error = first(raw.error)
  const returnTo = safeReturnTo(first(raw.returnTo))
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <LocalizedText en="Sign in to your workspace" vi="Đăng nhập không gian làm việc" />
        </CardTitle>
        <CardDescription>
          <LocalizedText en="Sign in to continue." vi="Đăng nhập để tiếp tục." />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {first(raw.signedOut) && (
          <Alert>
            <LocalizedText en="You have been signed out." vi="Bạn đã đăng xuất." />
          </Alert>
        )}
        {error && <Alert variant="destructive">{MESSAGES[error] ?? MESSAGES.invalid}</Alert>}
        {/* A plain link on purpose: this route redirects to the identity provider and must not be prefetched. */}
        <a
          className={buttonVariants({ className: 'w-full justify-between' })}
          href={`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
        >
          <LocalizedText en="Sign in" vi="Đăng nhập" />
          <ArrowRight aria-hidden className="size-4" />
        </a>
      </CardContent>
    </Card>
  )
}

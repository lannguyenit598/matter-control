import { LocalizedText } from '@/components/molecules/localized-text'
import Link from 'next/link'
import { UserRound, LogIn } from 'lucide-react'

import { buttonVariants } from '@/components/atoms/button'
import { currentPrincipal } from '@/lib/auth-provider'
import { awaitRequest } from '@/lib/request-time'

import { SignOutForm } from './sign-out-form'

/**
 * Who is signed in and how to leave. Display only: no token, role or permission is shown here;
 * what the person may do is decided by the API on every request.
 */
export async function AccountMenu() {
  // Session expiry reads the clock: request time, never prerendered (R-NX-5).
  await awaitRequest()
  const principal = await currentPrincipal()
  if (!principal) {
    return (
      <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        <LogIn aria-hidden />
        <LocalizedText en="Sign in" vi="Đăng nhập" />
      </Link>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="hidden items-center gap-2 text-muted-foreground sm:flex">
        <UserRound aria-hidden className="size-4 stroke-[1.6]" />
        <span className="max-w-32 truncate text-xs tabular-nums" title={principal.name}>
          {principal.name}
        </span>
      </div>
      {/* A same-origin POST (the logout route refuses any other origin) that also wipes kept drafts. */}
      <SignOutForm />
    </div>
  )
}

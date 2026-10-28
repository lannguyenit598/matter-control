import { LocalizedText } from '@/components/molecules/localized-text'
import Link from 'next/link'

import { buttonVariants } from '@/components/atoms/button'
import { currentPrincipal } from '@/lib/auth-provider'

import { SignOutForm } from './sign-out-form'

/**
 * Who is signed in and how to leave. Display only: no token, role or permission is shown here;
 * what the person may do is decided by the API on every request.
 */
export async function AccountMenu() {
  const principal = await currentPrincipal()
  if (!principal) {
    return (
      <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        <LocalizedText en="Sign in" vi="Đăng nhập" />
      </Link>
    )
  }
  return (
    <div className="flex items-center gap-3">
      <span className="hidden max-w-48 truncate text-sm sm:inline" title={principal.name}>
        {principal.name}
      </span>
      {/* A same-origin POST (the logout route refuses any other origin) that also wipes kept drafts. */}
      <SignOutForm />
    </div>
  )
}

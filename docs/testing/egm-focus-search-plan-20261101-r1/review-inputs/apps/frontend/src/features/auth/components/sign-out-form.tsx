'use client'

import { LogOut } from 'lucide-react'

import { LocalizedText } from '@/components/molecules/localized-text'

import { Button } from '@/components/atoms/button'
import { clearAllDrafts } from '@/lib/mc/drafts'

/** Signing out also wipes every kept form draft: nothing is revived for the next person at this tab. */
export function SignOutForm() {
  return (
    <form action="/api/auth/logout" method="post" onSubmit={() => clearAllDrafts()}>
      <Button type="submit" variant="outline" size="sm">
        <LogOut aria-hidden />
        <LocalizedText en="Sign out" vi="Đăng xuất" />
      </Button>
    </form>
  )
}

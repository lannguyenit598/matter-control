'use client'

import { LogOut } from 'lucide-react'
import { useRef } from 'react'
import { preparePrivateLogout, usePrivateScope } from '@/lib/mc/private-ui-events'

import { LocalizedText } from '@/components/molecules/localized-text'

import { Button } from '@/components/atoms/button'
import { clearAllDrafts } from '@/lib/mc/drafts'

/** Signing out also wipes every kept form draft: nothing is revived for the next person at this tab. */
export function SignOutForm() {
  const scope = usePrivateScope()
  const submitting = useRef(false)
  return (
    <form
      action="/api/auth/logout"
      method="post"
      onSubmit={(event) => {
        event.preventDefault()
        if (submitting.current) return
        submitting.current = true
        clearAllDrafts()
        const form = event.currentTarget
        void preparePrivateLogout(scope).finally(() => HTMLFormElement.prototype.submit.call(form))
      }}
    >
      <Button type="submit" variant="outline" size="sm">
        <LogOut aria-hidden />
        <LocalizedText en="Sign out" vi="Đăng xuất" />
      </Button>
    </form>
  )
}

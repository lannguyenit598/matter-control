'use client'

import { ConfirmActionButton } from '@/components/organisms/confirm-action-button'

import { revokeMatterMemberAction } from '../actions'

export function RevokeMatterMemberButton({
  matterId,
  userId,
  ifMatch,
}: {
  matterId: string
  userId: string
  ifMatch: string
}) {
  return (
    <ConfirmActionButton
      label="Remove"
      confirmLabel="Remove from matter"
      warning="Remove this member from the matter? Their access to its records ends immediately."
      run={() => revokeMatterMemberAction({ matterId, userId, ifMatch })}
    />
  )
}

'use client'

import { ConfirmActionButton } from '@/components/organisms/confirm-action-button'

import { revokeWorkspaceMemberAction } from '../actions'

export function RevokeWorkspaceMemberButton({
  workspaceId,
  userId,
  ifMatch,
  self,
}: {
  workspaceId: string
  userId: string
  ifMatch: string
  self: boolean
}) {
  return (
    <ConfirmActionButton
      label="Remove"
      confirmLabel="Remove member"
      warning={
        self
          ? 'Remove yourself from this workspace? You will lose access to it immediately.'
          : 'Remove this member from the workspace? Their access to all its matters ends immediately.'
      }
      run={() => revokeWorkspaceMemberAction({ workspaceId, userId, ifMatch })}
    />
  )
}

'use client'

import { InlineEdit } from '@/components/organisms/inline-edit'

import { updateWorkItemAction } from '../actions'

/** Inline edit of the one field the grid permits. Status, dependency, timing and attention have no editor. */
export function RowTitleEdit({
  matterId,
  itemId,
  title,
  etag,
  canEdit,
}: {
  matterId: string
  itemId: string
  title: string
  etag: string
  canEdit: boolean
}) {
  return (
    <InlineEdit
      label={`title of "${title}"`}
      value={title}
      canEdit={canEdit}
      run={(value) => updateWorkItemAction({ matterId, itemId, ifMatch: etag, title: value })}
    />
  )
}

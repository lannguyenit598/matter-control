'use client'

import Link from 'next/link'

import { InlineEdit } from '@/components/organisms/inline-edit'

import { updateWorkItemAction } from '../actions'

/** Inline edit of the one field the grid permits. Status, dependency, timing and attention have no editor. */
export function RowTitleEdit({
  matterId,
  itemId,
  title,
  href,
  etag,
  canEdit,
}: {
  matterId: string
  itemId: string
  title: string
  href: string
  etag: string
  canEdit: boolean
}) {
  return (
    <InlineEdit
      label={`title of "${title}"`}
      value={title}
      display={
        <Link
          href={href}
          className="rounded-sm font-medium underline-offset-4 hover:underline focus-visible:underline"
        >
          {title}
        </Link>
      }
      canEdit={canEdit}
      run={(value) => updateWorkItemAction({ matterId, itemId, ifMatch: etag, title: value })}
    />
  )
}

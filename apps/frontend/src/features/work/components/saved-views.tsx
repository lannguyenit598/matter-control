'use client'

import { useState } from 'react'

import { useLocale } from '@/hooks/use-locale'

import { Input } from '@/components/atoms/input'
import { Badge } from '@/components/atoms/badge'
import { FormField } from '@/components/molecules/form-field'
import { LocalizedText } from '@/components/molecules/localized-text'
import { IntentForm } from '@/components/organisms/intent-form'

import { deleteSavedViewAction, saveViewAction } from '../actions'
import { savedViewSearch } from '../saved-views'
import type { SavedView, SavedViewFilters } from '../schemas'

/**
 * Private Saved Views (RLF-04, REQ-MC-P1-12), kept behind the grid's own filter controls: saving
 * the current filters, listing the caller's own views, applying one through the grid URL
 * contract, and deleting. A view stores no records and grants no access — applying it re-runs
 * the authorized grid read. Views are personal: the list never shows anyone else's.
 */
export function SavedViews({
  matterId,
  views,
  current,
  basePath,
  canSave,
}: {
  matterId: string
  views: SavedView[]
  current: SavedViewFilters
  basePath: string
  /** Editors and owners may store views; viewers keep read-only surfaces. */
  canSave: boolean
}) {
  const [name, setName] = useState('')
  const vi = useLocale() === 'vi'
  return (
    <details id="saved-views" className="group flex flex-col gap-3">
      <summary className="control-target flex cursor-pointer list-none items-center justify-between text-sm font-medium">
        <LocalizedText en="Views" vi="Chế độ xem đã lưu" />
        <span className="text-muted-foreground">
          {views.length > 0 && <Badge variant="outline">{views.length}</Badge>}
        </span>
      </summary>
      <div className="flex flex-col gap-2 rounded-lg border bg-card p-3">
        {views.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            <LocalizedText
              en="You have no saved views yet. Filters you save here stay private to you in this Matter."
              vi="Bạn chưa lưu chế độ xem nào. Bộ lọc được lưu tại đây chỉ hiển thị với bạn trong hồ sơ này."
            />
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {views.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <a
                  href={`${basePath}${savedViewSearch(v.filters)}`}
                  className="font-medium break-words underline-offset-2 hover:underline"
                >
                  {v.name}
                </a>
                {canSave && (
                  <IntentForm
                    receipted={false}
                    submitLabel={<LocalizedText en="Delete" vi="Xóa" />}
                    submitAriaLabel={vi ? `Xóa chế độ xem ${v.name}` : `Delete view ${v.name}`}
                    className="shrink-0"
                    run={() => deleteSavedViewAction({ matterId, viewId: v.id, ifMatch: v.etag })}
                  >
                    {() => null}
                  </IntentForm>
                )}
              </li>
            ))}
          </ul>
        )}
        {canSave && (
          <IntentForm
            receipted
            draftKey={`saved-view:${matterId}`}
            submitLabel={<LocalizedText en="Save current filters" vi="Lưu bộ lọc hiện tại" />}
            run={(v, key) =>
              saveViewAction({
                matterId,
                idempotencyKey: key,
                name: v.name ?? '',
                filters: current,
              })
            }
            onSuccess={() => setName('')}
          >
            {({ errors }) => (
              <FormField
                label={<LocalizedText en="Name this view" vi="Đặt tên chế độ xem" />}
                required
                error={errors.name?.[0]}
              >
                {(c) => (
                  <Input
                    name="name"
                    maxLength={100}
                    autoComplete="off"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    {...c}
                  />
                )}
              </FormField>
            )}
          </IntentForm>
        )}
      </div>
    </details>
  )
}

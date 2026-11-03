'use client'

import { useState, startTransition } from 'react'

import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { Alert } from '@/components/molecules/alert'
import { FormField } from '@/components/molecules/form-field'
import { LocalizedText } from '@/components/molecules/localized-text'
import { Select } from '@/components/atoms/select'
import { IntentForm } from '@/components/organisms/intent-form'

import { applyPlaybookAction, previewPlaybookAction } from '../actions'
import type { PlaybookApplicationPreview } from '../repository'
import type { PlaybookOption } from './options'

/**
 * Matter-OWNER application (RLF-05): choose one exact published revision, see its entries,
 * choose a person for every entry that declares an owner key, and apply. The apply is a
 * receipted command — a lost answer is recovered only with the same key — and it is atomic:
 * failure creates no partial graph. Applying never completes or verifies work and never grants
 * membership.
 */
export function ApplyPlaybook({
  matterId,
  options,
  members,
}: {
  matterId: string
  options: PlaybookOption[]
  members: { id: string; label: string }[]
}) {
  const [revisionId, setRevisionId] = useState('')
  const [preview, setPreview] = useState<PlaybookApplicationPreview | null>(null)
  const [ownerMap, setOwnerMap] = useState<Record<string, string>>({})
  const blocked = (preview?.problems.length ?? 0) > 0
  return (
    <div className="flex flex-col gap-3">
      <FormField
        label={<LocalizedText en="Published revision" vi="Phiên bản đã công bố" />}
        hint={
          <LocalizedText
            en="Revisions are immutable; applying one exact revision twice is refused."
            vi="Phiên bản là bất biến; việc áp dụng cùng một phiên bản hai lần sẽ bị từ chối."
          />
        }
      >
        {(c) => (
          <select
            {...c}
            name="revisionId"
            value={revisionId}
            onChange={(e) => {
              setRevisionId(e.target.value)
              setPreview(null)
              setOwnerMap({})
            }}
            className="control-target w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm"
          >
            <option value="">—</option>
            {options.map((o) => (
              <option key={o.revisionId} value={o.revisionId}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </FormField>
      {revisionId && !preview && (
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            startTransition(async () => {
              const r = await previewPlaybookAction(matterId, revisionId)
              if (r.ok) setPreview(r.preview)
            })
          }
        >
          <LocalizedText en="Review entries" vi="Xem lại các bước" />
        </Button>
      )}
      {preview && (
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-3">
          <p className="text-sm font-semibold">
            {preview.playbook.name} · v{preview.revision.no}
          </p>
          {preview.problems.length > 0 && (
            <Alert>
              {preview.problems.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </Alert>
          )}
          <ul className="flex flex-col divide-y rounded-md border">
            {preview.revision.entries.map((e) => (
              <li key={e.key} className="flex flex-col gap-1 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium break-words">{e.title}</span>
                  <Badge variant="outline">
                    {e.kind === 'REQUIREMENT' ? 'Requirement' : 'Action'}
                  </Badge>
                </div>
                <p className="text-xs break-words text-muted-foreground">{e.outcome}</p>
                {(e.dependsOn?.length ?? 0) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    <LocalizedText en="After:" vi="Sau:" /> {(e.dependsOn ?? []).join(', ')}
                  </p>
                )}
                {preview.ownerKeys[e.key] !== undefined && (
                  <FormField
                    label={<LocalizedText en="Owner of this step" vi="Người phụ trách bước này" />}
                    required
                  >
                    {(c) => (
                      <Select
                        name={`owner-${e.key}`}
                        placeholder="Choose"
                        value={ownerMap[e.key] ?? ''}
                        onChange={(ev) => setOwnerMap((m) => ({ ...m, [e.key]: ev.target.value }))}
                        options={members.map((m) => ({ value: m.id, label: m.label }))}
                        {...c}
                      />
                    )}
                  </FormField>
                )}
              </li>
            ))}
          </ul>
          {!blocked && (
            <IntentForm
              receipted
              draftKey={`playbook-apply:${matterId}:${revisionId}`}
              submitLabel={<LocalizedText en="Apply this revision" vi="Áp dụng phiên bản này" />}
              run={(_v, key) =>
                applyPlaybookAction({
                  matterId,
                  revisionId,
                  ownerMap,
                  idempotencyKey: key,
                })
              }
            >
              {() => null}
            </IntentForm>
          )}
        </div>
      )}
    </div>
  )
}
